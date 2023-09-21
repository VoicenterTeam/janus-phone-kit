import { resolve } from 'path'
import { defineConfig, loadEnv, BuildOptions } from 'vite'
import dts from 'vite-plugin-dts'
import vue from '@vitejs/plugin-vue'
import vueI18n from '@intlify/vite-plugin-vue-i18n'
import mkcert from 'vite-plugin-mkcert'

const OUTPUT_DIR = 'library'

const build: BuildOptions = process.env.TARGET === 'doc'
    ? {}
    : {
        outDir: OUTPUT_DIR,
        sourcemap: true,
        commonjsOptions: {
            esmExternals: true
        },
        lib: {
            entry: resolve(__dirname, 'src/index.ts'),
            formats: [ 'es', 'cjs', 'umd', 'iife' ],
            name: 'JanusPhoneKit',
            fileName: (format) => {
                return `janus-phone-kit.${format}.js`
            },
        }
    }

export default ({ mode }) => {
    process.env = {
        ...process.env,
        ...loadEnv(mode, process.cwd(), '')
    }

    return defineConfig({
        build,
        server: { https: true },
        plugins: [
            dts({ rollupTypes: true }),
            vue(),
            vueI18n({
                include: resolve(__dirname, './example/locales/**')
            }),
            mkcert()
        ],
        resolve: {
            alias: {
                '@': resolve(__dirname, './example'),
                janus: resolve(__dirname, './src'),
            },
            dedupe: [ 'vue' ]
        }
    })
}
