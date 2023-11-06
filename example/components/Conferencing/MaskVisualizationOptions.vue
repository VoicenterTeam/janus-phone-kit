<template>
  <div>
        <VcPopover
            :open="popoverVisibility"
            trigger="manual"
            :popoverWidth="200"
        >
          <template #reference>
            <VcButton size="large" @click="openPopover">
              {{ t('home.maskVisualizationPopover.title') }}
            </VcButton>
          </template>

          <div class="p-5">
            <div class="mb-2">
              <label>{{ t('home.maskVisualizationPopover.blurAmount') }}</label>
              <div class="w-full">
                <VcSlider
                    v-model="blurAmountModel"
                    :min="1"
                    :max="20"
                    :step="1"
                />
              </div>
            </div>

            <VcButton @click="closePopover">
              {{ t('general.close') }}
            </VcButton>
          </div>
        </VcPopover>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
//import useJanusPhoneKit from '@/composables/useJanusPhoneKit'
import { KonvaDrawerOptions, KonvaScreenShareDrawerOptions } from '../../../src/types/konvaDrawer'
import { VisualizationConfigType } from '../enum/tfjs.config.enum'
import { useI18n } from 'vue-i18n'
import { debounce } from 'lodash'

export interface Props {
  setupVisualizationConfig: (config: VisualizationConfigType) => void
}

const props = withDefaults(
    defineProps<Props>(),
    {})


/*const {
    isScreenShareWhiteboardEnabled,
    setupDrawerOptions,
    setupScreenShareDrawerOptions
} = useJanusPhoneKit()*/

/* Composable */
const { t } = useI18n()

/* Data */
const popoverVisibility = ref<boolean>(false)
const blurAmountModel = ref<number>(3)

const debouncedFn = debounce((newV: number) => {
    const config: VisualizationConfigType = {
        backgroundBlur: newV
    }
    props.setupVisualizationConfig(config)
}, 200)

/* Watch */
watch(blurAmountModel, (newV) => {
    debouncedFn(newV)
})

/* Methods */
const openPopover = () => {
    popoverVisibility.value = true
}

const closePopover = () => {
    popoverVisibility.value = false
}
</script>

<style scoped>

</style>
