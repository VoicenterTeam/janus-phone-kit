<template>
  <VcModal
      :visible="modalVisibleModel"
      :header="t('home.whiteboardModal.header')"
      :breakpoints="{
                        '1126px': '60vw', '942px': '80vw', '704px': '95vw', '599px': '75vw'
                    }"
      width="50vw"
      append-to="body"
      @close="closeModal"
  >
    <div class="flex w-full h-full justify-between items-center xs:items-start flex-col xs:flex-row">
      <div class="mt-2">
        <VcButton
            type="default"
            color="primary"
            icon="vc-icon-edit-pencil"
            size="large"
            @click="drawEmptyWhiteboard"
        >
          {{ t('home.whiteboardModal.form.emptyWhiteboard') }}
        </VcButton>
      </div>

      <ImageUploadButton
        :button-text="t('home.whiteboardModal.form.imageWhiteboard')"
        @upload="onImageUpload"
      />
    </div>
  </VcModal>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useVModel } from '@vueuse/core'
//import useJanusPhoneKit from '@/composables/useJanusPhoneKit'
import ImageUploadButton from '@/components/Conferencing/ImageUploadButton.vue'
import { inject } from "vue";

const useJanusPhoneKit = inject('useJanusPhoneKit')

/* Composable */
const { t } = useI18n()
const {
    isPresentationWhiteboardEnabled,
    enablePresentationWhiteboard,
    enableImageWhiteboard
} = useJanusPhoneKit()

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
const modalVisibleModel = useVModel(props, 'modalVisible', emit)

/* Methods */
const closeModal = () => {
    modalVisibleModel.value = false
}

const drawEmptyWhiteboard = () => {
    enablePresentationWhiteboard(!isPresentationWhiteboardEnabled.value)
    closeModal()
}

const onImageUpload = (base64: string) => {
    enableImageWhiteboard(!isPresentationWhiteboardEnabled.value, base64)
    closeModal()
}

</script>
