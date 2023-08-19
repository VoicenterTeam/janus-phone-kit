import 'webrtc-adapter';
import Session from "./Session";
import EventEmitter from "./util/EventEmitter";
export default class JanusPhoneKit extends EventEmitter {
    private options;
    private session;
    /**
     * Websocket connection
     * @type {WebSocket}
     */
    private websocket;
    /**
     * Video room plugin
     * @type {VideoRoomPlugin}
     */
    private videoRoomPlugin;
    /**
     * Screen share plugin
     * @type {ScreenSharePlugin}
     */
    private screenSharePlugin;
    isConnected: boolean;
    constructor(options?: {});
    on(event: any, fn: any): void;
    emit(...params: any[]): void;
    joinRoom({ roomId, displayName, mediaConstraints }: {
        roomId: any;
        displayName?: string;
        mediaConstraints: any;
    }): Session;
    hangup(): void;
    startVideo(): void;
    stopVideo(): void;
    startAudio(): void;
    stopAudio(): void;
    startNoiseFilter(): void;
    stopNoiseFilter(): void;
    setBitrate(bitrate: any): void;
    changePublisherStream(newSource: any): Promise<any>;
    startScreenShare(): Promise<void>;
    sendStateMessage(data?: {}): Promise<void>;
    syncParticipants(): Promise<void>;
    private registerSocketOpenHandler;
    private registerSocketCloseHandler;
}
