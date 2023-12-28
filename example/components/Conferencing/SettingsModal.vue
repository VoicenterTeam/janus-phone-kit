<template>
    <VcModal
        :visible="modalVisibleModel"
        :header="t('home.joinRoomModal.header')"
        :breakpoints="{
                        '960px': '80vw', '680px': '95vw'
                    }"
        width="50vw"
        append-to="body"
        @close="closeModal"
    >
        <VcForm
            ref="formRef"
            :model="settingsModel"
        >
            <VcFormItem
                :label="t('home.joinRoomModal.form.roomId')"
                prop="audioInput"
                :rules="[required]"
            >
                <VcSelect
                    v-model="settingsModel.audioInput"
                    :options="microphoneList"
                    :config="mediaDeviceSelectorConfig"
                />
            </VcFormItem>
            <VcFormItem
                :label="t('home.joinRoomModal.form.displayName')"
                prop="audioOutput"
                :rules="[required]"
            >
              <VcSelect
                  v-model="settingsModel.audioOutput"
                  :options="speakerList"
                  :config="mediaDeviceSelectorConfig"
              />
            </VcFormItem>
          <VcFormItem
              :label="t('home.joinRoomModal.form.displayName')"
              prop="audioOutput"
              :rules="[required]"
          >
            <VcSelect
                v-model="settingsModel.videoInput"
                :options="cameraList"
                :config="mediaDeviceSelectorConfig"
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
import { inject, ref } from "vue";
import { useI18n } from 'vue-i18n'
import { useVModel } from '@vueuse/core'
import { VcForm } from '@voicenter-team/voicenter-ui-plus'
import { DeviceManager } from 'janus/index'
import useValidationRules from '@/composables/useValidationRules'
import useVcFormValidation from '@/composables/useVcFormValidation'
//import useJanusPhoneKit from '@/composables/useJanusPhoneKit'
import { EntityConfigType } from '@/types/extend'

const useJanusPhoneKit = inject('useJanusPhoneKit')

/* Types */
interface SettingsModel {
  audioInput: string
  audioOutput: string
  videoInput: string
}

/* Composables */
const { t } = useI18n()
const { required } = useValidationRules()
const { changePublisherStream } = useJanusPhoneKit()

/* Props */
export interface Props {
    modalVisible?: boolean
}

const props = withDefaults(
    defineProps<Props>(),
    {
        modalVisible: false
    }
)

/* Emit */
export interface Emit {
    (e: 'update:modalVisible', payload: boolean): void
}

const emit = defineEmits<Emit>()

/* Data */
const formRef = ref<typeof VcForm>()
const modalVisibleModel = useVModel(props, 'modalVisible', emit)
const mediaDeviceSelectorConfig: EntityConfigType<MediaDeviceInfo> = {
    labelKey: 'label',
    valueKey: 'deviceId'
}
const settingsModel = ref<SettingsModel>({
    audioInput: 'default',
    audioOutput: 'default',
    videoInput: 'default'
})
const cameraList = ref<Array<MediaDeviceInfo>>([])
const speakerList = ref<Array<MediaDeviceInfo>>([])
const microphoneList = ref<Array<MediaDeviceInfo>>([])
// const videoInput = ref<MediaDeviceInfo | undefined>()

/* Methods */
const validateForm = useVcFormValidation(formRef)
async function submitModal () {
    const isValid = await validateForm()

    if (!isValid) {
        return
    }

    const inputsChanged = settingsModel.value.audioInput !== 'default' || settingsModel.value.videoInput !== 'default'
    const videoElements = document.querySelectorAll('video')

    if (settingsModel.value.audioOutput && videoElements.length) {
        videoElements.forEach(element => {
            DeviceManager.changeAudioOutput(element, settingsModel.value.audioOutput)
        })
    }

    if (!inputsChanged) {
        modalVisibleModel.value = false

        return
    }

    await changePublisherStream(
        settingsModel.value.videoInput,
        settingsModel.value.audioInput
    )

    modalVisibleModel.value = false
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
async function setMediaDevices () {
    console.log('set')
    speakerList.value = await DeviceManager.getSpeakerList()
    microphoneList.value = await DeviceManager.getMicrophoneList()
    cameraList.value = await DeviceManager.getCameraList()

    if (cameraList.value.length) {
        // videoInput.value = cameraList.value[0].deviceId
    }
}
function setListeners () {
    navigator.mediaDevices.addEventListener('devicechange', setMediaDevices)
}

/* Created */
setMediaDevices()
setListeners()
</script>
