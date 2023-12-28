import { createApp } from 'vue'

import '@/assets/index.scss'

import App from '@/App.vue'
import useJanusPhoneKit from '@/composables/useJanusPhoneKit'
const janusProvider = useJanusPhoneKit()

import voicenterUI from '@/plugins/voicenterUI'
import i18n from '@/plugins/i18n'
import config from '@/plugins/config'

import router from '@/router/index'

if (import.meta.env.VITE_APP_CONFIG) {
    try {
        const appConfig = JSON.parse(import.meta.env.VITE_APP_CONFIG)

        window.addEventListener('message', (event) => {
            if (event.data?.type === 'appReady') {
                window.postMessage({
                    type: 'updateConfig',
                    payload: {
                        appConfig
                    }
                })
            }
        })
    } catch (e) {
        console.error(e)
    }
}

createApp(App)
    .use(router)
    .use(config)
    .use(i18n)
    .use(voicenterUI)
    .provide('useJanusPhoneKit', () => janusProvider)
    .mount('#app')
