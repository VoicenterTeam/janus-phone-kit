export type MemberType = 'publisher' | 'subscriber'

export type MemberJoinResult = Record<string, unknown>

export type Publisher = Record<string, unknown>

export type Sender = number | 'me'

export interface MemberState {
    isTalking?: boolean
    audio: boolean
}

export interface Member {
    stream: MediaStream
    id: string
    state: MemberState
    sender: Sender
    type: MemberType
    name: string
}

export interface MemberJoinPayload extends Member {
    joinResult: MemberJoinResult
    clientID?: string
}

export interface MemberUpdatePayload extends Member {
    joinResult: MemberJoinResult
}

export interface MemberHangupPayload {
    info: Publisher
    sender: Sender
}

export type PluginAttachedPayload = Record<string, unknown>

export type OutputPayload = Record<string, unknown>

export interface EventPayloads {
    'member:join': MemberJoinPayload
    'member:update': MemberUpdatePayload
    'member:hangup': MemberHangupPayload
    'hangup': null
    'plugin_attached': PluginAttachedPayload
    'output': OutputPayload
    'attached': number
    'detached': null
    'keepalive_timout': null
    'screenShare:stop': null
    'screenShare:start': null
    'webrtcup': null
    'reconnect': null
}

export type EventName = keyof EventPayloads

export type EventPayloadByEventName<T extends EventName> = EventPayloads[T]

export type EventCallback<T> = (payload: T) => void

export type EventCallbackByEventName<T extends EventName> = EventCallback<EventPayloadByEventName<T>>

export type AllEventPayloads = EventPayloads[EventName]
