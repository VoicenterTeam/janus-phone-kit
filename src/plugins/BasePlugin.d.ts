import EventEmitter from "../util/EventEmitter";
import { StunServer } from "../types";
export declare class BasePlugin extends EventEmitter {
    /**
     * The plugin name string in the C source code.
     * @member {String}
     * @instance
     * @readonly
     */
    name: any;
    /**
     * The session to which this plugin is attached. An instance of {@link Session}.
     * @member {Session}
     * @instance
     * @readonly
     */
    session: any;
    /**
     * The server-side "plugin handle"
     * @member {String}
     * @instance
     * @readonly
     */
    id: any;
    /**
     * Is this plugin attached on the server?
     * @member {Boolean}
     * @instance
     * @readonly
     */
    attached: boolean;
    /**
     * memeberList connected on that plugin
     * @member {Object}
     * @instance
     */
    memberList: {};
    /**
     * room_id room_id to be connected to
     * @member {Number}
     * @instance
     */
    room_id: number;
    /**
     * myFeedList my own video feed from other plugin
     * @member {array}
     * @instance
     */
    private_id?: string;
    /**
     * List of STUN servers. Needed for servers that don't have public IP.
     */
    stunServers: StunServer[];
    myFeedList: any[];
    opaqueId?: string | null;
    constructor();
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
    attach(session: any): Promise<any>;
    /**
     * @protected
     * @abstract
     */
    onAttached(): void;
    /**
     * @protected
     * @abstract
     */
    onDetached(): void;
    /**
     * Closes rtc peer connections
     */
    close(): void;
    /**
     * Detach this plugin from the session. Meant to be called only from {@link Session}.
     *
     * The method {@link BasePlugin#onDetached} will be called.
     *
     * @public
     * @returns {Promise} Response from janus-gateway.
     * @emits BasePlugin#detached
     */
    detach(): Promise<void>;
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
    send(obj: any, options?: any): Promise<any>;
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
    sendMessage(body?: {}, jsep?: any, options?: any): Promise<any>;
    /**
     * Alias for `sendMessage({}, jsep)`
     *
     * @public
     * @param {Object} jsep - Should be JSON-serializable. Will be provided to the
     * `.handle_message` C function as `json_t *jsep`.
     *
     * @returns {Promise} Response from janus-gateway.
     */
    sendJsep(jsep: any): Promise<any>;
    /**
     * Send trickle ICE candidates to the janus core, related to this plugin.
     *
     * @public
     * @param {(Object|Array|null)} candidate Should be JSON-serializable.
     *
     * @returns {Promise} Response from janus-gateway.
     */
    sendTrickle(candidate: any): Promise<any>;
    /**
     * Hangup the WebRTC peer connection, but keep the plugin attached.
     *
     * @public
     * @returns {Promise} Response from janus-gateway.
     */
    hangup(): Promise<any>;
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
    receive(msg: any): Promise<void>;
}
