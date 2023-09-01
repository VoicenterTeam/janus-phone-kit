import { Dialog, Form, FormItem, Input, InputNumber } from 'element-ui'
import 'element-ui/lib/theme-chalk/base.css'
import 'element-ui/lib/theme-chalk/dialog.css'
import 'element-ui/lib/theme-chalk/icon.css'
import 'element-ui/lib/theme-chalk/input.css'
import 'element-ui/lib/theme-chalk/input-number.css'
import 'element-ui/lib/theme-chalk/form.css'
import 'element-ui/lib/theme-chalk/form-item.css'

export default ({ Vue }) => {
  Vue.use(Dialog)
  Vue.use(Form)
  Vue.use(FormItem)
  Vue.use(Input)
  Vue.use(InputNumber)
};

window.global = window
