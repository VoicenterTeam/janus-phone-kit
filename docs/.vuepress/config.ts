import {defineUserConfig, defaultTheme} from 'vuepress'
import {viteBundler} from '@vuepress/bundler-vite'
import mkcert from'vite-plugin-mkcert'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import {ElementPlusResolver} from 'unplugin-vue-components/resolvers'
import {registerComponentsPlugin} from '@vuepress/plugin-register-components'
import {getDirname, path} from '@vuepress/utils'

// @ts-ignore
const __dirname = getDirname(import.meta.url)

export default defineUserConfig({
    bundler: viteBundler({
        viteOptions: {
            server: {
                https: true
            },
            plugins: [
                mkcert(),
                // ...
                AutoImport({
                    resolvers: [ElementPlusResolver()],
                }),
                Components({
                    resolvers: [ElementPlusResolver()],
                }),
            ]
        }
    }),
    plugins: [
        registerComponentsPlugin({
            componentsDir: path.resolve(__dirname, './components')
        }),
    ],
    head: [
        ['link', {rel: 'stylesheet', href: 'https://unpkg.com/tailwindcss@1.4.6/dist/tailwind.min.css'}]
    ],
    theme: defaultTheme({
        repo: '/VoicenterTeam/janus-phone-kit',
        docsDir: 'docs',
        sidebar: [
            {
                text: 'General',
                link: '/',
                collapsible: false,
                children: [
                    'demo'
                ]
            }
        ]
    })
})
