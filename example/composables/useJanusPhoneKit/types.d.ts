import { Member } from 'janus/types/events'
import { ProbeMetricInType, ProbeMetricOutType } from 'janus/types/metrics'

export interface MainState {
    streamSources: Array<Member>
    talkingStream: Member | undefined
    mainSource: Member | undefined
    isMicOn: boolean
    isVideoOn: boolean
    isWithBokehMaskEffect: boolean
    isWithBgImgMaskEffect: boolean
    isScreenSharing: boolean
    isScreenShareWhiteboardEnabled: boolean
    isPresentationWhiteboardEnabled: boolean
    isImageWhiteboardEnabled: boolean
    metricsReport: ProbeMetricInType | ProbeMetricOutType | undefined
}
