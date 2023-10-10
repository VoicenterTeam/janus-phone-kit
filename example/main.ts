import { createApp } from 'vue'

import '@/assets/index.scss'

import App from '@/App.vue'

import voicenterUI from '@/plugins/voicenterUI'
import i18n from '@/plugins/i18n'
import config from '@/plugins/config'

import router from '@/router/index'

createApp(App)
    .use(router)
    .use(config)
    .use(i18n)
    .use(voicenterUI)
    .mount('#app')
