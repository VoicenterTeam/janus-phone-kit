import path, { resolve } from 'path'
import * as fs from 'fs';
import { defineConfig, loadEnv, BuildOptions, PluginOption } from 'vite'
import dts from 'vite-plugin-dts'
import vue from '@vitejs/plugin-vue'
import VueI18nPlugin from '@intlify/unplugin-vue-i18n/vite'

function mediapipe_workaround() {
    return {
        name: 'mediapipe_workaround',
        load(id) {
            if (path.basename(id) === 'selfie_segmentation.js') {
                console.log('AAAAAAAAA here');
                let code = fs.readFileSync(id, 'utf-8')
                code += 'exports.SelfieSegmentation = SelfieSegmentation;'
                console.log('AAAAAAAAA', code);
                return { code }
            } else {
                return null
            }
        },
    }
}

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


const plugins: PluginOption[] = process.env.TARGET === 'doc'
    ? []
    : [
        dts({ rollupTypes: true }),
    ]

export default ({ mode }) => {
    process.env = {
        ...process.env,
        ...loadEnv(mode, process.cwd(), '')
    }

    return defineConfig({
        build,
        plugins: [
            ...plugins,
            vue(),
            VueI18nPlugin({
                include: resolve(__dirname, './example/locales/**')
            }),
            mediapipe_workaround()
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
