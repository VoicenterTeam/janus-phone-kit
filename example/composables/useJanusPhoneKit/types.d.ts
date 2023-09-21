import { Member } from 'janus/types/events'

export interface MainState {
    streamSources: Array<Member>
    talkingStream: Member | undefined
    mainSource: Member | undefined
    isMicOn: boolean
    isVideoOn: boolean
    isWithMaskEffect: boolean
    isScreenSharing: boolean
    isScreenShareWhiteboardEnabled: boolean
    isPresentationWhiteboardEnabled: boolean
    isImageWhiteboardEnabled: boolean
}
