import { computed, watch, reactive, nextTick } from 'vue'
import {parse} from 'qs'
import type { JoinRoomOptions } from 'janus/JanusPhoneKit'
import JanusPhoneKit from 'janus/JanusPhoneKit'
import { MainState } from '@/composables/useJanusPhoneKit/types'
import { initListeners } from './helper'
import { CONFERENCING_MODE } from 'janus/enum/conferencing.enum'
import { DeviceManager } from 'janus/index'
import { Member } from 'janus/types/events'
import { KonvaDrawerOptions, KonvaScreenShareDrawerOptions } from 'janus/types/konvaDrawer'
import { VisualizationConfigType } from 'janus/enum/tfjs.config.enum'
let janusPhoneKit

const state = reactive<MainState>({
    streamSources: [],
    talkingStream: undefined,
    mainSource: undefined,
    isMicOn: true,
    isVideoOn: true,
    isWithBokehMaskEffect: false,
    isWithBgImgMaskEffect: false,
    isScreenSharing: false,
    isScreenShareWhiteboardEnabled: false,
    isPresentationWhiteboardEnabled: false,
    isImageWhiteboardEnabled: false,
    metricsReport: undefined
})

export default function useJanusPhoneKit () {
    function joinRoom (options: JoinRoomOptions) {
        const qsConfig =parse(window.location.search.replaceAll('?',''))
        console.log('useJanusPhoneKit',qsConfig)
        const hrefRoomId = qsConfig.roomId || qsConfig.room
        janusPhoneKit = new JanusPhoneKit({
            url: `wss://jnwss.voicenter.co/janus?room=${hrefRoomId||'abcd'}`
        })

        if (!janusPhoneKit) {
            throw new Error('JanusPhoneKit is not registered, call registerJanusPhoneKit first')
        }

        return new Promise((resolve) => {
            janusPhoneKit.on(
                'member:join',
                () => {
                    console.log('ON MEMBER:JOIN RESOLVE', session)
                    resolve(session)
                }
            )

            janusPhoneKit.on(
                'reconnect',
                () => {
                    state.streamSources = []
                    console.log('MEMBER:JOIN RESET streamSources', state.streamSources.length)
                }
            )

            initListeners(janusPhoneKit, state)

            const session = janusPhoneKit.joinRoom(options)


        })
    }

    function enableScreenShareWhiteboard (enable: boolean) {
        //console.log('enableScreenShareWhiteboard isScreenShareWhiteboardEnable', enable)
        //console.log('enableScreenShareWhiteboard isPresentationWhiteboardEnable', this.isPresentationWhiteboardEnable)

        state.isScreenShareWhiteboardEnabled = enable

        return new Promise((resolve) => {
            nextTick()
                .then(() => {
                    if (enable) {
                        janusPhoneKit.enableScreenShareWhiteboard(enable, state.mainSource.stream)
                            .then(resolve)
                    } else {
                        janusPhoneKit.enableScreenShareWhiteboard(enable)
                            .then(resolve)
                    }
                })
        })
    }

    function enablePresentationWhiteboard (enable: boolean) {
        state.isPresentationWhiteboardEnabled = enable

        return new Promise((resolve) => {
            nextTick()
                .then(() => {
                    janusPhoneKit.enableWhiteboard(CONFERENCING_MODE.WHITEBOARD, enable)
                        .then(resolve)
                })
        })
    }

    function enableImageWhiteboard (enable: boolean, imageSrc: string) {
        state.isImageWhiteboardEnabled = enable

        return new Promise((resolve) => {
            nextTick()
                .then(() => {
                    janusPhoneKit.enableWhiteboard(CONFERENCING_MODE.IMAGE_WHITEBOARD, enable, imageSrc)
                        .then(resolve)
                })
        })
    }

    function setupDrawerOptions (options: KonvaDrawerOptions) {
        janusPhoneKit.setupDrawerOptions(options)
    }

    function setupScreenShareDrawerOptions (options: KonvaScreenShareDrawerOptions) {
        janusPhoneKit.setupScreenShareDrawerOptions(options)
    }

    async function enableScreenShare (enable: boolean) {
        if (enable) {
            await janusPhoneKit.startScreenShare()
        } else {
            if (state.isScreenShareWhiteboardEnabled) {
                await enableScreenShareWhiteboard(false)
            }
            janusPhoneKit.stopScreenShare()
        }
        state.isScreenSharing = enable
    }

    async function applyBokehMaskEffect () {
        if (!state.isVideoOn) {
            return
        }

        try {
            const newVal = !state.isWithBokehMaskEffect
            const stream = await janusPhoneKit.enableBokehEffectMask()

            state.isWithBokehMaskEffect = newVal

            updatePublisherStream(stream)
        } catch (e) {
            console.error('Error when enabling bokeh mask effect:', e)
        }
    }

    async function applyBackgroundImgMaskEffect (base64Img: string) {
        if (!state.isVideoOn) {
            return
        }

        if (!base64Img) {
            console.error('Error when enabling background image ' +
              'mask effect: Image was not provided')
        }

        try {
            const newVal = !state.isWithBgImgMaskEffect
            const stream = await janusPhoneKit.enableBackgroundImgEffectMask(base64Img)

            state.isWithBgImgMaskEffect = newVal

            updatePublisherStream(stream)
        } catch (e) {
            console.error('Error when enabling background image mask effect:', e)
        }
    }

    async function disableMaskEffect () {
        if (!state.isVideoOn) {
            return
        }

        try {
            const stream = await janusPhoneKit.disableMask()

            state.isWithBokehMaskEffect = false
            state.isWithBgImgMaskEffect = false

            updatePublisherStream(stream)
        } catch (e) {
            console.error('Error when disabling mask effect:', e)
        }
    }

    function setupMaskVisualizationConfig (options: VisualizationConfigType) {
        janusPhoneKit.setupMaskVisualizationConfig(options)
    }

    async function changePublisherStream (audioInput: string, videoInput: string) {
        const newStream = await janusPhoneKit.changePublisherStream({
            audioInput,
            videoInput
        })

        updatePublisherStream(newStream)
    }

    function selectMainSource (source: Member) {
        console.log('selectMainSource', source)
        if (!source || !source.id) {
            return
        }

        const sourceId = source.id
        state.mainSource = state.streamSources.find(source => source.id === sourceId)
    }

    function updatePublisherStream (newStream: MediaStream) {
        const streamSource = state.streamSources.find(source => source.type === 'publisher' && source.name !== 'Screen Share')

        console.log('onUpdatePublisherStream streamSource', streamSource)

        if (!streamSource) {
            return
        }

        /*streamSource.stream.getTracks().forEach(track => {
            track.stop()
            streamSource.stream.removeTrack(track)
        })*/

        /*const publisherVideoOnlyStream = new MediaStream()

        newStream.getVideoTracks().forEach(track => {
            publisherVideoOnlyStream.addTrack(track)
        })

        streamSource.stream = publisherVideoOnlyStream*/

        streamSource.stream = newStream

        return newStream
    }

    function hangup () {
        janusPhoneKit.hangup()
    }

    const microphoneOnModel = computed({
        get () {
            return state.isMicOn
        },
        set (value) {
            state.isMicOn = value

            if (value) {
                janusPhoneKit.startAudio()
            } else {
                janusPhoneKit.stopAudio()
            }
        }
    })

    const videoOnModel = computed({
        get () {
            return state.isVideoOn
        },
        set (value) {
            state.isVideoOn = value

            if (value) {
                janusPhoneKit.startVideo()
            } else {
                janusPhoneKit.stopVideo()
            }
        }
    })

    watch(
        () => state.streamSources,
        (newSources, oldSources) => {
            const newParticipant = newSources.find((newSource) => {
                if (!oldSources) {
                    return true // If oldSources is undefined, return the first newSource
                }

                return !oldSources.some((oldSource) => oldSource.id === newSource.id)
            })

            const talkingStream = newSources.find(source => source.state && source.state.isTalking)

            if (newSources.length > 0 && newParticipant && newParticipant.name === 'Screen Share') {
                state.mainSource = newParticipant
            } else if (newSources.length > 0 && (!state.mainSource || state.mainSource.type == 'publisher'/* && state.mainSource.name !== 'Screen Share'*/ || newSources.length === 1)) {
                state.mainSource = state.streamSources.find(source => source.type === 'subscriber')
                if (!state.mainSource) {
                    state.mainSource = state.streamSources.find(source => source.type === 'publisher' /*&& source.name !== 'Screen Share'*/)
                }
            } else if (talkingStream) {
                state.mainSource = talkingStream
            } else if (newSources.length === 0 && state.mainSource) {
                DeviceManager.stopStreamTracks(state.mainSource.stream)
                state.mainSource = undefined
            }
        },
        { immediate: true }
    )

    return {
        joinRoom,
        enableScreenShareWhiteboard,
        enablePresentationWhiteboard,
        enableImageWhiteboard,
        setupDrawerOptions,
        setupScreenShareDrawerOptions,
        enableScreenShare,
        changePublisherStream,
        selectMainSource,
        hangup,
        applyBokehMaskEffect,
        applyBackgroundImgMaskEffect,
        disableMaskEffect,
        setupMaskVisualizationConfig,
        microphoneOnModel,
        videoOnModel,
        isWithBokehMaskEffect: computed(() => state.isWithBokehMaskEffect),
        isWithBgImgMaskEffect: computed(() => state.isWithBgImgMaskEffect),
        isScreenSharing: computed(() => state.isScreenSharing),
        mainSource: computed(() => state.mainSource),
        talkingStream: computed(() => state.talkingStream),
        isScreenShareWhiteboardEnabled: computed(() => state.isScreenShareWhiteboardEnabled),
        isPresentationWhiteboardEnabled: computed(() => state.isPresentationWhiteboardEnabled),
        isImageWhiteboardEnabled: computed(() => state.isImageWhiteboardEnabled),
        isWhiteboardEnabled: computed(() => state.isScreenShareWhiteboardEnabled || state.isPresentationWhiteboardEnabled || state.isImageWhiteboardEnabled),
        sourcesExceptMain: computed(() => {
            if (!state.mainSource) {
                return state.streamSources
            }

            return state.streamSources.filter(s => s.id !== state.mainSource.id)
        }),
        metricsReport: computed(() => state.metricsReport),
    }
}
