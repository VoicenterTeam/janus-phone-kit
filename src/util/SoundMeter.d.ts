export declare class VolumeMeter {
    private readonly stream;
    private audioContext;
    private scriptNodeProcessor;
    private gainNode;
    private analyser;
    private output;
    constructor(stream: any);
    private initMeter;
    mute(): void;
    unmute(): void;
    onAudioProcess(callback: Function): void;
    getOutputStream(): MediaStream;
}
