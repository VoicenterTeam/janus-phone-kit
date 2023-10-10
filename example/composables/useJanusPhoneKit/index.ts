import { computed, watch, reactive, nextTick } from 'vue'

import type { JoinRoomOptions } from 'janus/JanusPhoneKit'
import JanusPhoneKit from 'janus/JanusPhoneKit'
import { MainState } from '@/composables/useJanusPhoneKit/types'
import { initListeners } from './helper'
import { CONFERENCING_MODE } from 'janus/enum/conferencing.enum'
import { DeviceManager } from 'janus/index'
import { Member } from 'janus/types/events'
import {KonvaDrawerOptions, KonvaScreenShareDrawerOptions} from "../../../src/types/konvaDrawer";

const janusPhoneKit = new JanusPhoneKit({
    url: 'wss://jnwss.voicenter.co/janus'
})
const state = reactive<MainState>({
    streamSources: [],
    talkingStream: undefined,
    mainSource: undefined,
    isMicOn: true,
    isVideoOn: true,
    isWithMaskEffect: false,
    isScreenSharing: false,
    isScreenShareWhiteboardEnabled: false,
    isPresentationWhiteboardEnabled: false,
    isImageWhiteboardEnabled: false
})

export default function useJanusPhoneKit () {
    if (!janusPhoneKit) {
        throw new Error('JanusPhoneKit is not registered, call registerJanusPhoneKit first')
    }
    function joinRoom (options: JoinRoomOptions) {
        return new Promise((resolve) => {
            janusPhoneKit.on(
                'member:join',
                () => {
                    resolve(session)
                }
            )

            janusPhoneKit.on(
                'reconnect',
                () => {
                    console.log('RESET streamSources', JSON.parse(JSON.stringify(state.streamSources)))
                    state.streamSources = []
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

    async function toggleMaskEffect () {
        if (!state.isVideoOn) {
            return
        }

        try {
            const newVal = !state.isWithMaskEffect
            const stream = await janusPhoneKit.enableMask(newVal)

            state.isWithMaskEffect = newVal

            updatePublisherStream(stream)
        } catch (e) {
            console.error('Error when enabling mask effect:', e)
        }
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
            console.log('watch newSources', JSON.stringify(newSources))
            console.log('watch oldSources', JSON.stringify(oldSources))
            const newParticipant = newSources.find((newSource) => {
                if (!oldSources) {
                    return true // If oldSources is undefined, return the first newSource
                }

                return !oldSources.some((oldSource) => oldSource.id === newSource.id)
            })

            console.log('newParticipant', newParticipant)

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
        toggleMaskEffect,
        microphoneOnModel,
        videoOnModel,
        isWithMaskEffect: computed(() => state.isWithMaskEffect),
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
        })
    }
}
