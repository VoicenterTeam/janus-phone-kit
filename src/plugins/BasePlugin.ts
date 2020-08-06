import EventEmitter from "../util/EventEmitter";
import { logger } from '../util/logger'
import {StunServer} from "../types";

export class BasePlugin extends EventEmitter {
  /**
   * The plugin name string in the C source code.
   * @member {String}
   * @instance
   * @readonly
   */
  name = null

  /**
   * The session to which this plugin is attached. An instance of {@link Session}.
   * @member {Session}
   * @instance
   * @readonly
   */
  session = null

  /**
   * The server-side "plugin handle"
   * @member {String}
   * @instance
   * @readonly
   */
  id = null

  /**
   * Is this plugin attached on the server?
   * @member {Boolean}
   * @instance
   * @readonly
   */
  attached = false

  /**
   * memeberList connected on that plugin
   * @member {Object}
   * @instance
   */
  memberList = {}
  /**
   * room_id room_id to be connected to
   * @member {Number}
   * @instance
   */
  room_id = 1234
  /**
   * myFeedList my own video feed from other plugin
   * @member {array}
   * @instance
   */
  private_id?: string = null

  /**
   * List of STUN servers. Needed for servers that don't have public IP.
   */
  stunServers: StunServer[] = []

  myFeedList = []
  opaqueId?: string | null;

  constructor() {
    super()
    this.opaqueId = null
  }

  /**
   * Attach the server-side plugin (identified by {@link BasePlugin#name}) to the session. Meant to
   * be called only by {@link Session}.
   *
   * The method {@link BasePlugin#onAttached} will be called.
   *
   * @public
   * @param {Session} session - An instance of {@link Session}
   * @emits BasePlugin#attached
   * @returns {Promise} Rejected if synchronous reply contains `janus: 'error'` or response
   * takes too long. Resolved otherwise.
   */
  async attach(session) {
    logger.debug('attach()');

    this.session = session;

    const msg: any = {
      janus: 'attach',
      plugin: this.name,
    };

    if (this.opaqueId) {
      msg.opaque_id = this.opaqueId;
    }

    const response = await this.session.send(msg);

    this.id = response.data.id;
    this.attached = true;
    this.onAttached();

    /** @event BasePlugin#attached */
    this.emit('attached');

    return response;
  }

  /**
   * @protected
   * @abstract
   */
  onAttached() {
    logger.debug('onAttached() abstract method called');
  }

  /**
   * @protected
   * @abstract
   */
  onDetached() {
    logger.debug('onDetached() abstract method called');
  }

  /**
   * Closes rtc peer connections
   */
  close() {
    logger.debug('close() abstract method called');
  }

  /**
   * Detach this plugin from the session. Meant to be called only from {@link Session}.
   *
   * The method {@link BasePlugin#onDetached} will be called.
   *
   * @public
   * @returns {Promise} Response from janus-gateway.
   * @emits BasePlugin#detached
   */
  async detach() {
    logger.debug('detach()');
    await this.send({ janus: 'detach' });

    this.attached = false;
    this.onDetached();
    /** @event BasePlugin#detached */
    this.emit('detached');
  }

  /**
   * @private
   * @param {Object} obj - Should be JSON-serializable. Expected to have a key 'janus'
   * with one of the following values: 'attach|detach|message|trickle|hangup'
   * @param options  {Object} obj - Should be JSON-serializable. Expected to have a key 'handle_id'
   *
   * @returns {Promise} Rejected if synchronous reply contains `janus: 'error'` or response
   * takes too long. Resolved otherwise.
   *
   * @see {@link https://janus.conf.meetecho.com/docs/rest.html}
   */
  async send(obj, options: any = {}) {
    logger.debug('send()');
    let sendMsg = {};
    if (options && options.handle_id) {
      sendMsg = { ...obj, handle_id: options.handle_id };
    } else if (obj.janus === 'attach') {
      sendMsg = obj;
    } else {
      sendMsg = { ...obj, handle_id: this.id };
    }
    return this.session.send(sendMsg);
  }

  /**
   * Send a message to the server-side plugin.
   *
   * Janus will call the plugin C function `.handle_message` with the provided
   * arguments.
   *
   * @public
   * @param {Object} body - Should be JSON-serializable. Janus expects this. Will be
   * provided to the `.handle_message` C function as `json_t *message`.
   * @param {Object} [jsep] - Should be JSON-serializable. Will be provided to the
   * `.handle_message` C function as `json_t *jsep`.
   *
   * @param options Should be JSON-serializable. Expected to have a key 'handle_id'
   * @returns {Promise} Response from janus-gateway.
   */
  public async sendMessage(body = {}, jsep?, options?) {
    const msg: any = {
      janus: 'message',
      body, // required. 3rd argument in the server-side .handle_message() function
    };
    if (jsep) msg.jsep = jsep; // 'jsep' is a recognized key by Janus. 4th arg in .handle_message().
    logger.debug('sendMessage()');
    return this.send(msg, options);
  }

  /**
   * Alias for `sendMessage({}, jsep)`
   *
   * @public
   * @param {Object} jsep - Should be JSON-serializable. Will be provided to the
   * `.handle_message` C function as `json_t *jsep`.
   *
   * @returns {Promise} Response from janus-gateway.
   */
  async sendJsep(jsep) {
    logger.debug('sendJsep()');
    return this.sendMessage({}, jsep);
  }

  /**
   * Send trickle ICE candidates to the janus core, related to this plugin.
   *
   * @public
   * @param {(Object|Array|null)} candidate Should be JSON-serializable.
   *
   * @returns {Promise} Response from janus-gateway.
   */
  async sendTrickle(candidate) {
    logger.debug('sendTrickle()');
    return this.send({ janus: 'trickle', candidate });
  }

  /**
   * Hangup the WebRTC peer connection, but keep the plugin attached.
   *
   * @public
   * @returns {Promise} Response from janus-gateway.
   */
  async hangup() {
    logger.debug('hangup()');
    return this.send({ janus: 'hangup' });
  }

  /**
   * Receive an asynchronous ('pushed') message sent by the Janus core.
   *
   * The parent Session instance is responsible for dispatching messages here. You should have no
   * need of calling this method directly.
   *
   * This method always contains plugin-specific logic and can be overridden.
   *
   * @public
   * @abstract
   * @param {Object} msg - Object parsed from server-side JSON
   */
  async receive(msg) {
    logger.debug(`Abstract method 'receive' called with message ${msg}`);
  }

}
