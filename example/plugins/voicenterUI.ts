import { App } from 'vue'
import VoicenterUI from '@voicenter-team/voicenter-ui-plus'

export default {
    install (app: App) {
        app.use(VoicenterUI, {
            themeConfig: {
                type: 'local',
                themeName: 'blue'
            }
        })
    }
}
