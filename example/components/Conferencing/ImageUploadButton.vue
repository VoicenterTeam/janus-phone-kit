<template>
  <div>
    <VcFileUploader
        id="image-uploader"
        :files="files"
        :file-size-limit="fileSizeLimit"
        button-size="large"
        class="image-uploader"
        tag-icon="vc-icon-image"
        button-icon="vc-icon-image"
        :max-length="1"
        :button-text="t('home.whiteboardModal.form.imageWhiteboard')"
        :no-data-text="t('home.whiteboardModal.form.noImage')"
        accept="image/*"
        @input="onFileChange"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { FileUploaded } from '@voicenter-team/voicenter-ui-plus/library/types/components/VcFileUploader/VcFileUploader.types'

/*export interface Props {
  modalVisible?: boolean
}

const props = withDefaults(
    defineProps<Props>(),
    {
      modalVisible: false
    }
)*/

/* Emit */
const emit = defineEmits<{
  (e: 'upload', payload: string): void
}>()

/* Composables */
const { t } = useI18n()

const fileSizeLimit = ref<number>(5242880) // Bytes (in binary) - 5MB
const file = ref<FileUploaded | null>(null)
const files = ref<Array<FileUploaded>>([])

const onFileChange = (newFiles: FileUploaded[]) => {
    files.value = newFiles
    file.value = files.value[0]

    if (file.value) {
        // Create a FileReader to read the file
        const reader = new FileReader()

        // Set up an event handler for when the FileReader has loaded the file
        reader.onload = function (event) {
            // The result property contains the base64-encoded string
            const base64String = event.target.result as string

            // Display the base64 string
            console.log('base64String', base64String)
            emit('upload', base64String)
        }

        // Read the file as a data URL (base64)
        reader.readAsDataURL(file.value)
    }
}
/*const base64ToArrayBuffer = (base64: string) => {
    const binaryString = atob(base64)
    const bytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i)
    }
    return bytes.buffer
}

watch(file, async (newV) => {
    if (!newV) return
    const audioContext = new AudioContext()
    const reader = new FileReader()

    reader.onload = async (event) => {
        const target = event.target as FileReader

        const dataURL = target.result as string // it is always string as we are using readAsDataURL method

        const base64 = getPureBase64(dataURL)

        const arrayBuffer = base64ToArrayBuffer(base64)

        try {
            const decodedData = await audioContext.decodeAudioData(arrayBuffer)
            const durationInSeconds = decodedData.duration
            if (durationInSeconds > this.maxAudioDuration) {
                this.$notify.add({
                    type: 'error',
                    title: `${this.$t('common.error')}`,
                    message: `${this.$t('device.settings.upload.sound.duration.error')}`,
                })

                this.files = []

                return
            }
            this.$emit('change', dataURL)
        } catch (e) {
            console.error('Error decoding audio data:', e)
        }
    }

    reader.readAsDataURL(newV)
})*/
</script>

<style scoped lang="scss">
.image-uploader {
  :deep() {
    .vc-input__label-wrapper-label {
      white-space: nowrap;
      font-weight: 500;
      font-size: 14px;
    }
  }
}
</style>
