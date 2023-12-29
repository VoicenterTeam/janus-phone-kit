import { MainState } from '@/composables/useJanusPhoneKit/types'
import JanusPhoneKit, { DeviceManager } from 'janus/index'
import { configState } from '@/plugins/config'

export function afterHangup (state: MainState) {
    state.streamSources.forEach(source => {
        DeviceManager.stopStreamTracks(source.stream)
    })

    state.streamSources = []
}

export function initListeners (janusPhoneKit: JanusPhoneKit, state: MainState) {
    function playJoinSound () {
        console.log('stateData', configState)
        const audio = new Audio(configState.value.appConfig.SOUND_NOTIFICATIONS.join)

        audio.play()
    }

    janusPhoneKit.on(
        'screenShare:stop',
        () => {
            console.log('DEMO screenShare:stop')
            console.log('streamSources', state.streamSources)
            state.isScreenSharing = false
            state.streamSources = state.streamSources.filter((s) => !(s.name === 'Screen Share' && s.sender === 'me'))
        }
    )
    janusPhoneKit.on(
        'member:join',
        (data) => {
            console.log('on member:join', data)
            //streamSources.push(data)
            state.streamSources = [ ...state.streamSources, data ]
            console.log('state.streamSources', state.streamSources)
            playJoinSound()
        }
    )

    janusPhoneKit.on(
        'member:hangup',
        (info) => {
            console.log('member:hangup', info)
            const index = state.streamSources.findIndex(s => s.sender === info.sender)

            if (index !== -1) {
                DeviceManager.stopStreamTracks(state.streamSources[index].stream)

                state.streamSources.splice(index, 1)
                state.streamSources = [ ...state.streamSources ]
            }
        }
    )

    janusPhoneKit.on(
        'member:update',
        (data) => {
            console.log('on member:UPDATE', data)
            const index = state.streamSources.findIndex(s => s.sender === data.sender)

            if (index !== -1) {
                const source = state.streamSources[index]

                source.state = data.state
            }

            state.talkingStream = state.streamSources.find(source => source?.state?.isTalking)
        }
    )

    /*janusPhoneKit.on(
        'reconnect',
        () => {
            console.log('RESET streamSources', JSON.parse(JSON.stringify(state.streamSources)))
            state.streamSources = []
        }
    )*/

    janusPhoneKit.on(
        'hangup',
        () => afterHangup(state)
    )

    janusPhoneKit.on(
        'metrics:report',
        (report) => {
          //  console.log('on metrics:report', report)
            const { id, data } = report
            state.metricsReport = {
                ...state.metricsReport,
                [id]: data
            }
        }
    )

    janusPhoneKit.on(
        'metrics:stop',
        (id) => {
            const reports = { ...state.metricsReport }
            delete reports[id]
            state.metricsReport = { ...reports }
        }
    )
}
