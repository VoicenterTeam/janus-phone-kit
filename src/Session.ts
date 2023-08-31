import EventEmitter from './util/EventEmitter';
import {logger} from './util/logger'
import {BasePlugin} from "./plugins/BasePlugin";

type SessionOptions = {
  timeoutMs: number,
  keepaliveMs: number,
}
const defaultOptions: SessionOptions = {
  timeoutMs: 5000,
  keepaliveMs: 50000,
}

class Session extends EventEmitter {

  id = null
  #next_transaction_id = 0
  #keepalive_timeout = null
  #options: SessionOptions = null
  #plugins: { [key: string]: { timeout_cleanup?: any, instance: BasePlugin }; } = {}
  #transactions = {}

  connected = false

  constructor(options = {}) {
    super()
    this.#options = {
      ...defaultOptions,
      ...options,
    }
  }

  /**
   * Create a session instance on the server.
   *
   * Sets {@link Session#id} when successful.
   *
   * @public
   * @returns {Promise} Response from Janus
   */
  async create() {
    const response = await this.send({janus: 'create'});
    this.connected = true;
    this.id = response.data.id;
    return response;
  }

  /**
   * Detaches all attached plugins from the server instance, then destroys the session instance on
   * the server.
   *
   * @public
   * @returns {Promise} Response from Janus
   */
  async destroy() {
    console.log('SESSION destroy plugin.instance.detach')
    this.connected = false;
    const pluginDetachPromises = Object.entries(this.#plugins).map(([, plugin]) => {
      logger.debug('Detaching plugin before destroying session', plugin.instance.name);
      return plugin.instance.detach();
    });
    await Promise.all(pluginDetachPromises);

    const response = await this.send({janus: 'destroy'});
    this.#stopKeepalive();

    Object.entries(this.#plugins).forEach(([id, plugin]) => {
      logger.debug(`Removing reference to plugin ${plugin.instance.name} (${id})`);
      clearTimeout(plugin.timeout_cleanup);
      plugin.instance.close();
      delete this.#plugins[id];
      logger.debug(`Remaining plugins: ${Object.keys(this.#plugins)}`);
    });
    return response;
  }

  /**
   * Attaches a plugin instance to this session instance.
   *
   * @public
   * @param {BasePlugin} plugin - An instance of an (extended) BasePlugin
   * @emits Session#plugin_attached
   * @listens BasePlugin
   * @returns {Promise} Response from Janus
   */
  async attachPlugin(plugin) {
    logger.debug(`Attaching plugin ${plugin.name}`);
    const response = await plugin.attach(this);

    plugin.once('detached', () => {
      console.log('SESSION attachPlugin plugin.once detached')
      logger.debug(`Plugin ${plugin.name} detached.`);
      this.#plugins[plugin.id].timeout_cleanup = setTimeout(() => {
        // Depending on the timing, we may receive a message for this plugin after it has been
        // detached. For this reason we need to keep a reference to this plugin for a bit.
        logger.debug(`Removing reference to plugin ${plugin.name} (${plugin.id})`);
        delete this.#plugins[plugin.id];
        logger.debug(`Remaining plugins: ${Object.keys(this.#plugins)}`);
      }, 30000);
    });

    this.#plugins[response.data.id] = {instance: plugin, timeout_cleanup: null};
    logger.info(`Plugin ${plugin.name} attached.`);

    /**
     * @event Session#plugin_attached
     * @type {Object} Response from Janus to the attaching of the plugin
     */
    this.emit('plugin_attached', response);
    return response;
  }

  /**
   * Receive a message sent by Janus.
   *
   * The parent application is responsible for dispatching messages here.
   *
   * @public
   * @param {Object} msg - Object parsed from JSON sent by Janus
   * @param {String} msg.janus - One of: `ack, success, error, server_info, event, media, webrtcup,
   * slowlink, hangup`
   */
  receive(msg) {
    console.log('SESSION receive')
    logger.debug('Receiving message from Janus', msg);
    // If there is a transaction property, then this is a reply to a message which we have sent
    // previously.
    if (msg.transaction) {
      // Get the original outgoing message, of which this is a reply to.
      const transaction = this.#transactions[msg.transaction];

      if (transaction) {
        // Special case:
        // If the original outgoing message was sending JSEP data, then do not resolve the promise
        // with this 'synchronous' acknowledgement, but with the JSEP answer coming later.
        if (msg.janus === 'ack' && transaction.payload.jsep) return;

        // Resolve or reject the Promise, then forget this transaction.
        clearTimeout(transaction.timeout);
        delete this.#transactions[msg.transaction];

        if (msg.janus === 'error') {
          logger.debug(`Got error ${msg.error.code} from Janus. \
          Will reject promise.`, msg.error.reason);
          transaction.reject(msg.error);
          return;
        }

        transaction.resolve(msg);
        return;
      }
    }

    // This is either
    // 1. an asynchronous ('push') message without transaction identifier, OR
    // 2. an asynchronous ('push') reply to a transaction that we have already handled.
    //
    // In the first case, the `janus` property is one of `event, webrtcup, hangup, detached, media,
    // slowlink`
    if (msg.sender) {
      console.log('SESSION receive if sender', msg)
      // Get the plugin instance which sent this (msg.sender == plugin.id)
      // and give the message to the plugin which will handle it.
      const pluginId = msg.sender.toString();
      let plugin = this.#plugins[pluginId];
      if (!plugin && Object.values(this.#plugins).length > 0) {
        // eslint-disable-next-line prefer-destructuring
        plugin = (Object.values(this.#plugins))[0];
      }
      if (!plugin) throw new Error(`Could not find plugin with ID ${pluginId}`);
      plugin.instance.receive(msg);
    }

    // If there is neither `sender` nor `transaction` property on the message, we cannot do anything
    // with it.
  }

  /**
   * Send a message to Janus.
   *
   * Only plugin instances use this method. You should never have a need to call this method
   * directly. Use {@link Session#sendKeepalive}, {@link Session#create} or {@link Session@destroy}
   * instead.
   *
   * @public
   * @param {Object} msg - The message object to send. Properties `session_id` and `transaction`
   * will be added automatically.
   * @see {@link https://janus.conf.meetecho.com/docs/rest.html}
   * @emits Session#output
   * @returns {Promise} Response from Janus
   */
  async send(msg): Promise<any> {
    this.#next_transaction_id += 1; // This could probably also be made into a UUID.
    const transaction = this.#next_transaction_id.toString();
    const payload: any = {...msg, transaction};

    // For the session create message we won't have an ID yet.
    if (this.id) {
      payload.session_id = this.id;
    }

    const responsePromise = new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        delete this.#transactions[payload.transaction];
        reject(new Error(`Signalling message timed out ${JSON.stringify(payload)}`));
      }, this.#options.timeoutMs);

      this.#transactions[transaction] = {
        resolve, reject, timeout, payload,
      };
    }).catch(e => console.error(e));

    logger.debug('Outgoing Janus message', payload);
    /**
     * The parent application is responsible for serializing this message object and sending it to
     * Janus.
     *
     * @event Session#output
     * @type {Object} The response from Janus.
     */
    this.emit('output', payload);
    this.#resetKeepalive();

    return responsePromise;
  }

  /**
   * Cleanup. Call this before unreferencing an instance.
   *
   * @public
   */
  stop() {
    logger.debug('stop()');
    Object.entries(this.#plugins).forEach(([, plugin]) => plugin.instance.close());
    this.#stopKeepalive();
    this.connected = false;
  }

  /**
   * @private
   */
  #sendKeepalive = async () => {
    try {
      await this.send({janus: 'keepalive'});
    } catch (err) {
      logger.error('Keepalive timed out');
      this.emit('keepalive_timout');
    }
  };

  /**
   * @private
   */
  #stopKeepalive = () => {
    logger.debug('stopKeepalive()');
    if (this.#keepalive_timeout) {
      clearTimeout(this.#keepalive_timeout);
    }
  };

  /**
   * @private
   */
  #resetKeepalive = () => {
    this.#stopKeepalive();

    this.#keepalive_timeout = setTimeout(async () => {
      await this.#sendKeepalive()
    }, this.#options.keepaliveMs)
  };

}

export default Session
