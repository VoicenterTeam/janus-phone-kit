declare class DeviceManager {
    static canGetMediaDevices(): boolean;
    private static getDevices;
    static getMicrophoneList(): Promise<MediaDeviceInfo[]>;
    static getSpeakerList(): Promise<MediaDeviceInfo[]>;
    static getCameraList(): Promise<{
        deviceId: string;
        label: string;
        groupId: string;
        kind: MediaDeviceKind;
        toJSON(): any;
    }[]>;
    static stopStreamTracks(stream: any): void;
    static getMediaFromInputs({ videoInput, audioInput }: {
        videoInput: any;
        audioInput: any;
    }): Promise<MediaStream>;
    static getUserMedia(constraints: any): Promise<MediaStream>;
    static changeAudioOutput(element: any, deviceId: string): Promise<void>;
    static toggleAudioMute(stream: any): any;
    static toggleVideoMute(stream: any): any;
    static getStream(streamOptions?: {
        video: boolean;
        audio: boolean;
    }): Promise<{
        stream: MediaStream;
        track: MediaStreamTrack;
    }>;
}
export default DeviceManager;
