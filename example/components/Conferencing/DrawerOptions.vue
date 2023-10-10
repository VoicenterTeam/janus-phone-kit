<template>
  <div>
        <VcPopover
            :open="popoverVisibility"
            trigger="manual"
            :popoverWidth="200"
        >
          <template #reference>
            <VcButton size="large" @click="openPopover">
              Drawing options
            </VcButton>
          </template>

          <div class="p-5">
            <div class="mb-2">
              <label>Brush width</label>
              <div class="w-full">
                <VcSlider
                    v-model="strokeWidthModel"
                    :min="1"
                    :max="50"
                    :step="1"
                />
              </div>
            </div>

            <div class="flex mb-2">
              <label class="mr-2">Brush color</label>
              <div>
                <VcColorPicker
                    v-model="strokeColorModel"
                    :color-picker-area-width="280"
                    :color-picker-area-height="80"
                    mode="wide"
                />
              </div>
            </div>

            <div
                v-if="props.isExtendedOptions"
                class="flex mb-2"
            >
              <label class="mr-2">Background color</label>
              <div>
                <VcColorPicker
                    v-model="backgroundColorModel"
                    :color-picker-area-width="280"
                    :color-picker-area-height="80"
                    mode="wide"
                />
              </div>
            </div>

            <VcButton @click="applySettings">
              Apply
            </VcButton>
          </div>
        </VcPopover>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
//import useJanusPhoneKit from '@/composables/useJanusPhoneKit'
import { KonvaDrawerOptions, KonvaScreenShareDrawerOptions } from "../../../src/types/konvaDrawer";

export interface Props {
  isExtendedOptions: boolean
  isScreenShareWhiteboardEnabled: boolean
  setupDrawerOptions: () => void
  setupScreenShareDrawerOptions: () => void
}

const props = withDefaults(
    defineProps<Props>(),
    {
        isExtendedOptions: false
    })


/*const {
    isScreenShareWhiteboardEnabled,
    setupDrawerOptions,
    setupScreenShareDrawerOptions
} = useJanusPhoneKit()*/


const popoverVisibility = ref<boolean>(false)
const strokeWidthModel = ref<number>(2)
const strokeColorModel = ref<string>('#000')
const backgroundColorModel = ref<string>('#fff')

const openPopover = () => {
    popoverVisibility.value = true
}

const applySettings = () => {
    const options: KonvaDrawerOptions = {
        strokeWidth: strokeWidthModel.value,
        strokeColor: strokeColorModel.value,
        emptyDrawerRectColor: backgroundColorModel.value
    }

    if (!props.isExtendedOptions) {
        delete options.emptyDrawerRectColor
    }

    if (props.isScreenShareWhiteboardEnabled) {
        props.setupScreenShareDrawerOptions(options)
    } else {
        props.setupDrawerOptions(options)
    }

    popoverVisibility.value = false
}
</script>

<style scoped>

</style>
