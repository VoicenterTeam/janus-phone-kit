import { resolve } from 'path'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
    build: {
        lib: {
            entry: resolve(__dirname, 'src/index.ts'),
            formats: [ 'es', 'cjs', 'umd', 'iife' ],
            name: 'JanusPhoneKit',
            fileName: (format) => {
                return `janus-phone-kit.${format}.js`
            },
        },
    },
    plugins: [
        dts({ rollupTypes: true }),
        vue()
    ],
})
