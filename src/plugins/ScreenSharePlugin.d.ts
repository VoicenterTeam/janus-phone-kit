import { BasePlugin } from "./BasePlugin";
import { StunServer } from "../types";
export declare class ScreenSharePlugin extends BasePlugin {
    name: string;
    memberList: {};
    videoElement: any;
    room_id: number;
    stunServers: StunServer[];
    rtcConnection: any;
    /**
     * @type {VideoRoomPlugin}
     */
    VideoRoomPlugin: any;
    constructor(options?: any);
    /**
     * Creates html video element
     * @return {null}
     */
    createVideoElement(): any;
    /**
     * Start or stop echoing video.
     * @public
     * @param {Boolean} enabled
     * @return {Object} The response from Janus
     */
    enableVideo(enabled: any): Promise<any>;
    /**
     * Start or stop echoing audio.
     *
     * @public
     * @param {Boolean} enabled
     * @return {Object} The response from Janus
     */
    enableAudio(enabled: any): Promise<any>;
    /**
     * Send a REMB packet to the browser to set the media submission bandwidth.
     *
     * @public
     * @param {Number} bitrate - Bits per second
     * @return {Object} The response from Janus
     */
    setBitrate(bitrate: any): Promise<any>;
    /**
     * Receive an asynchronous ('pushed') message sent by the Janus core.
     *
     * @public
     * @override
     */
    receive(msg: any): Promise<void>;
    /**
     * Set up a bi-directional WebRTC connection:
     *
     * 1. get local media
     * 2. create and send a SDP offer
     * 3. receive a SDP answer and add it to the RTCPeerConnection
     * 4. negotiate ICE (can happen concurrently with the SDP exchange)
     * 5. Play the video via the `onaddstream` event of RTCPeerConnection
     *
     * @private
     * @override
     */
    onAttached(): Promise<void>;
    stopSharing(): Promise<void>;
    close(): void;
}
