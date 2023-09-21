<template>
    <VcModal
        :visible="modalVisibleModel"
        :header="t('home.joinRoomModal.header')"
        :breakpoints="{
                        '960px': '80vw', '680px': '95vw'
                    }"
        width="50vw"
        @close="closeModal"
    >
        <VcForm
            ref="formRef"
            :model="roomDetailsModel"
        >
            <VcFormItem
                :label="t('home.joinRoomModal.form.roomId')"
                prop="roomId"
                :rules="[required]"
            >
                <VcInput
                    v-model="roomDetailsModel.roomId"
                    type="number"
                />
            </VcFormItem>
            <VcFormItem
                :label="t('home.joinRoomModal.form.displayName')"
                prop="displayName"
                :rules="[required]"
            >
                <VcInput
                    v-model="roomDetailsModel.displayName"
                />
            </VcFormItem>
        </VcForm>

        <template #footer>
            <div class="flex justify-between w-full">
                <VcButton @click="submitModal">
                    {{ t('general.submit') }}
                </VcButton>
                <VcButton @click="closeModal" color="secondary">
                    {{ t('general.close') }}
                </VcButton>
            </div>
        </template>
    </VcModal>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useVModel } from '@vueuse/core'
import { VcForm } from '@voicenter-team/voicenter-ui-plus'
import useValidationRules from '@/composables/useValidationRules'
import useVcFormValidation from '@/composables/useVcFormValidation'
import { JoinRoomData } from '@/types/forms'

/* Composables */
const { t } = useI18n()
const { required } = useValidationRules()

/* Props */
export interface Props {
    modalVisible?: boolean
    modelValue: JoinRoomData
}

const props = withDefaults(
    defineProps<Props>(),
    {
        modalVisible: false
    }
)

/* Emit */
export interface Emit {
    (e: 'update:modalVisibleModel', payload: boolean): void
    (e: 'update:modelValue', payload: JoinRoomData): void
    (e: 'submit', payload: JoinRoomData): void
}

const emit = defineEmits<Emit>()

/* Data */
const formRef = ref<typeof VcForm>()
const modalVisibleModel = useVModel(props, 'modalVisible', emit)
const roomDetailsModel = useVModel(props, 'modelValue', emit)

/* Methods */
const validateForm = useVcFormValidation(formRef)
async function submitModal () {
    const isValid = await validateForm()

    if (!isValid) {
        return
    }


    emit('submit', roomDetailsModel.value)
}
function closeModal () {
    resetValidate()

    modalVisibleModel.value = false
}
function resetValidate () {
    if (formRef.value) {
        formRef.value.resetFields()
    }
}
</script>
