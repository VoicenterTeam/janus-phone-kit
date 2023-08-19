import { BasePlugin } from "./plugins/BasePlugin";
export declare class Member {
    private plugin;
    private rtcpPeer;
    handleId: number;
    private readonly info;
    private joinResult;
    private state;
    private stream;
    constructor(memberInfo: any, plugin: BasePlugin);
    attachMember(): Promise<void>;
    answerAttachedStream(attachedStreamInfo: any): Promise<void>;
    private get memberInfo();
    updateMemberState(newState: any): void;
    updateMemberStateFromMessage(message: any): void;
    hangup(): void;
}
