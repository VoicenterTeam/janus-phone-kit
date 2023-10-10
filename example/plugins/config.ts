import type { App, InjectionKey, UnwrapRef } from 'vue'
import { reactive } from 'vue'
import { RemovableRef, useStorage } from '@vueuse/core'

import { blue } from '@voicenter-team/voicenter-ui-plus/src/theme/themes.json'
import { overrideElementTheme, appendGlobalCssVariables } from '@voicenter-team/voicenter-ui-plus/src/theme'
import { CONFERENCE_PAGE_QUERY_PARAMETERS, ConferencePageQueryParameters } from '@/config/app.config'
import { deepMerge } from '@/util/generic.util'

export interface ConfigState {
    themeData: Record<string, string>
    appConfig: ConferencePageQueryParameters
}
interface AppReadyEvent {
    type: 'appReady'
}

interface UpdateConfigEvent {
    type: 'updateConfig'
    payload: Partial<UnwrapRef<ConfigState>>
}

interface ClearConfigEvent {
    type: 'clearConfig'
}

type AppConfigEvent = AppReadyEvent | UpdateConfigEvent | ClearConfigEvent

export const ConfigInjectionKey: InjectionKey<RemovableRef<ConfigState>> = Symbol()

export const defaultConfig: ConfigState = {
    themeData: blue,
    appConfig: reactive(CONFERENCE_PAGE_QUERY_PARAMETERS)
}

export const configState = useStorage<ConfigState>(
    'voicenterConferenceConfig',
    defaultConfig
)

export default {
    install (app: App) {
        function onConfigUpdate () {
            const el = document.documentElement

            el.classList.add('hidden')

            appendGlobalCssVariables(
                overrideElementTheme(configState.value.themeData),
                el
            )

            el.classList.remove('hidden')
        }

        function onReady () {
            onConfigUpdate()

            if (window.parent) {
                window.parent.postMessage({ type: 'appReady' }, '*')
            }

            window.addEventListener('message', (event: MessageEvent<AppConfigEvent>) => {
                if (event.data.type === 'updateConfig') {
                    configState.value = deepMerge(configState.value, event.data.payload)

                    onConfigUpdate()
                } else if (event.data.type === 'clearConfig') {
                    configState.value = defaultConfig

                    onConfigUpdate()
                }
            })
        }

        app.provide(
            ConfigInjectionKey,
            configState
        )

        onReady()
    }
}
