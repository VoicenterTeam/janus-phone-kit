export interface StramSourceState {
    isTalking?: boolean
}

export type StreamSource = Record<string, unknown> & {
    source: MediaStream
    state?: StramSourceState
}

export interface MainState {
    streamSources: Array<StreamSource>
}
