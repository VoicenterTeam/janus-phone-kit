import { BasePlugin } from "./BasePlugin";
import { StunServer } from "../types";
export declare class VideoRoomPlugin extends BasePlugin {
    name: string;
    memberList: any;
    room_id: number;
    stunServers: StunServer[];
    iceCandidates: any[];
    publishers: any;
    displayName: string;
    rtcConnection: any;
    clientID: string;
    stream: MediaStream;
    offerOptions: any;
    isVideoOn: boolean;
    isAudioOn: boolean;
    isNoiseFilterOn: boolean;
    isTalking: boolean;
    mediaConstraints: any;
    private volumeMeter;
    constructor(options?: any);
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
    private onHangup;
    private onTrickle;
    private processIceCandidates;
    private onVideoRoomAttached;
    private onPublisherStateUpdate;
    private onPublisherInitialStateUpdate;
    private onReceivePublishers;
    loadStream(): Promise<{
        stream: MediaStream;
        options: any;
    }>;
    requestAudioAndVideoPermissions(): Promise<{
        stream: MediaStream;
        options: any;
    }>;
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
    trackMicrophoneVolume(): void;
    startVideo(): Promise<void>;
    stopVideo(): Promise<void>;
    startAudio(): Promise<void>;
    stopAudio(): Promise<void>;
    startNoiseFilter(): void;
    stopNoiseFilter(): void;
    changePublisherStream({ audioInput, videoInput }: {
        audioInput: any;
        videoInput: any;
    }): Promise<MediaStream>;
    sendConfigureMessage(options: any): Promise<any>;
    sendStateMessage(data?: {}): Promise<void>;
    private sendInitialState;
    addTracks(tracks: MediaStreamTrack[]): void;
    hangup(): Promise<void>;
    syncParticipants(): Promise<void>;
    close(): void;
}
