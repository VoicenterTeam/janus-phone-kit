<template>
  <VcModal
      :visible="modalVisibleModel"
      :header="t('home.maskEffectModal.header')"
      :breakpoints="{
                        '1316px': '60vw','1126px': '70vw', '942px': '80vw', '824px': '95vw'
                    }"
      width="50vw"
      append-to="body"
      @close="closeModal"
  >
    <div class="flex w-full h-full justify-between items-center sm:items-start flex-col sm:flex-row">
      <div class="mt-2">
        <VcButton
            type="default"
            color="primary"
            icon="vc-icon-background-blur-1"
            size="large"
            @click="applyBokehEffect"
        >
          {{ t('home.maskEffectModal.form.backgroundBlurEffect') }}
        </VcButton>
      </div>

      <ImageUploadButton
        :button-text="t('home.maskEffectModal.form.backgroundImageEffect')"
        @upload="applyBackgroundImgEffect"
      />
    </div>
  </VcModal>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useVModel } from '@vueuse/core'
import useJanusPhoneKit from '@/composables/useJanusPhoneKit'
import ImageUploadButton from '@/components/Conferencing/ImageUploadButton.vue'

/* Composable */
const { t } = useI18n()
const {
    applyBokehMaskEffect,
    applyBackgroundImgMaskEffect,
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

const applyBokehEffect = () => {
    applyBokehMaskEffect()
    closeModal()
}

const applyBackgroundImgEffect = (base64: string) => {
    applyBackgroundImgMaskEffect(base64)
    closeModal()
}

</script>
