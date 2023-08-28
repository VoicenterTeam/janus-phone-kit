import Vue from 'vue';
declare const _default: import("vue/types/vue").ExtendedVue<Vue, {
    conferenceStarted: boolean;
    joinDialogVisible: boolean;
    PhoneKit: any;
    streamSources: any[];
    talkingStream: any;
    joinForm: {
        displayName: string;
        roomId: number;
        validate: boolean;
    };
    rules: {
        roomId: {
            required: boolean;
            message: string;
            trigger: string;
        }[];
        displayName: {
            required: boolean;
            message: string;
            trigger: string;
        }[];
    };
}, {
    openJoinModal(): void;
    joinRoom(): Promise<void>;
    hangup(): void;
    afterHangup(): void;
    playJoinSound(): void;
    initListeners(): void;
}, unknown, Record<never, any>>;
export default _default;
