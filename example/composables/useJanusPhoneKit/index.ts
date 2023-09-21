import { reactive } from 'vue'

import JanusPhoneKit from 'janus/JanusPhoneKit'
import type { JoinRoomOptions } from 'janus/JanusPhoneKit'
import { MainState } from '@/composables/useJanusPhoneKit/types'
import { initListeners } from './helper'

const janusPhoneKit = new JanusPhoneKit({
    url: 'wss://jnwss.voicenter.co/janus'
})
const state = reactive<MainState>({
    streamSources: [],
})

export default function useJanusPhoneKit () {
    if (!janusPhoneKit) {
        throw new Error('JanusPhoneKit is not registered, call registerJanusPhoneKit first')
    }

    function joinRoom (options: JoinRoomOptions) {
        return new Promise((resolve) => {
            const session = janusPhoneKit.joinRoom(options)

            janusPhoneKit.on(
                'member:join',
                () => {
                    resolve(session)
                }
            )

            initListeners(janusPhoneKit, state)
        })
    }

    return {
        joinRoom
    }
}
