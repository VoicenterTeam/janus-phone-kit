import EventEmitter from './util/EventEmitter';
declare class Session extends EventEmitter {
    #private;
    id: any;
    connected: boolean;
    constructor(options?: {});
    /**
     * Create a session instance on the server.
     *
     * Sets {@link Session#id} when successful.
     *
     * @public
     * @returns {Promise} Response from Janus
     */
    create(): Promise<any>;
    /**
     * Detaches all attached plugins from the server instance, then destroys the session instance on
     * the server.
     *
     * @public
     * @returns {Promise} Response from Janus
     */
    destroy(): Promise<any>;
    /**
     * Attaches a plugin instance to this session instance.
     *
     * @public
     * @param {BasePlugin} plugin - An instance of an (extended) BasePlugin
     * @emits Session#plugin_attached
     * @listens BasePlugin
     * @returns {Promise} Response from Janus
     */
    attachPlugin(plugin: any): Promise<any>;
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
    receive(msg: any): void;
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
    send(msg: any): Promise<any>;
    /**
     * Cleanup. Call this before unreferencing an instance.
     *
     * @public
     */
    stop(): void;
}
export default Session;
