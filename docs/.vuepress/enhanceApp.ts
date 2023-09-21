import { defineClientConfig } from '@vuepress/client'

import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'

export default defineClientConfig({
  enhance({ app, router, siteData }) {
    app.use(ElementPlus)
  },
  setup() {},
  layouts: {},
  rootComponents: [],
})

// @ts-ignore
window.global = window
