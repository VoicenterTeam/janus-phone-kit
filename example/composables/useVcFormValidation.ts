import { Ref } from 'vue'
import { VcForm } from '@voicenter-team/voicenter-ui-plus'

export default function (formRef: Ref<typeof VcForm | undefined>): () => Promise<boolean> {
    return () => {
        return new Promise(resolve => {
            if (formRef.value) {
                formRef.value.validate().then((res: { isValid: boolean, invalidFields?: unknown }) => {
                    resolve(res.isValid)
                })
            } else {
                resolve(false)
            }
        })
    }
}
