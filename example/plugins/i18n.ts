import {
    createI18n,
} from 'vue-i18n'
import messages from '@intlify/unplugin-vue-i18n/messages'

export type MessageSchema = typeof messages
export const FALLBACK_LOCALE = import.meta.env.VITE_APP_FALLBACK_LOCALE ?? 'en'

export default createI18n<false>({
    legacy: false,
    locale: 'en',
    availableLocales: [ 'en' ],
    globalInjection: true,
    fallbackLocale: FALLBACK_LOCALE,
    messages: messages as MessageSchema,
})
