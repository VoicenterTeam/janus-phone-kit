<template>
  <div class="h-full">
    <video
        v-if="!isWhiteboardEnabled"
        :srcObject.prop="mainSource.stream"
        id="main-video-id"
        class="main-video"
        :class="{'publisher-video': mainSource.type === 'publisher' /*&& mainSource.name !== 'Screen Share'*/}"
        :controls="false"
        :muted="mainSource.type === 'publisher'"
        :volume="mainSource.type === 'publisher' ? 0: 0.9"
        autoplay
        playsinline
        webkit-playsinline
    >
    </video>

    <div v-else-if="isScreenShareWhiteboardEnabled"
         id="screen-share-video-container"
         class="main-video flex justify-center"
    >
      <div id="composite-canvas-container" class="relative">
        <canvas id="composite-canvas" />
      </div>

      <div id="container" class="flex items-center"/>
    </div>

    <div v-else-if="isPresentationWhiteboardEnabled || isImageWhiteboardEnabled"
         id="presentation-video-container"
         class="main-video"
    >
      <div id="presentationCanvasWrapper" />
    </div>

    <div
        class="fixed top-0 left-0 flex justify-center items-center bg-opacity-25 bg-default-text rounded-br px-4 text-xl font-semibold">
      <div v-if="mainSource.state.audio === false" class="mr-2">
        <VcPopover
            theme="dropdown"
            :triggers="['hover']"
            placement="top"
        >
          <template #reference>
            <vue-feather type="mic-off" class="w-5 h-5 text-red-500"/>
          </template>
          <div class="p-2">
            {{ t('general.state.muted') }}
          </div>
        </VcPopover>
      </div>

      <div class="text-white" @click="metricsModalOpen = true">
        {{ mainSource.name || mainSource.sender }}
      </div>
    </div>
<!--  TODO: temporary removed because of videoroom plugin  -->
    <div
      class="fixed bottom-20 left-0 px-4 bg-default-text rounded-tr text-xl text-white">
      {{ callDuration }}
    </div>
    <MetricsModal v-model:modalVisible="metricsModalOpen" />
  </div>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, inject } from 'vue'
import { useI18n } from 'vue-i18n'
//import useJanusPhoneKit from '@/composables/useJanusPhoneKit'
import MetricsModal from './MetricsModal.vue'
import { getCreatedTime } from '@/helper/create.time.helper'

const useJanusPhoneKit = inject('useJanusPhoneKit')

/* Props */
export interface Props {
  roomId: string | undefined
}
const props = withDefaults(
    defineProps<Props>(),
    {
        roomId: undefined
    }
)
/* Composables */
const { t } = useI18n()
const {
    mainSource,
    isWhiteboardEnabled,
    isScreenShareWhiteboardEnabled,
    isPresentationWhiteboardEnabled,
    isImageWhiteboardEnabled
} = useJanusPhoneKit()

const metricsModalOpen = ref<boolean>(false)
const callDuration = ref('')
const created = ref<number | undefined>(undefined)

/* Methods */
const calculateTimeFromNow = () => {
    if (created.value && created.value > 0) {
        const currentTime = Date.now()
        const differenceInMilliseconds = currentTime - created.value
        const differenceInSeconds = Math.floor(differenceInMilliseconds / 1000)

        const hours = Math.floor(differenceInSeconds / 3600)
        const minutes = Math.floor((differenceInSeconds % 3600) / 60)
        const seconds = differenceInSeconds % 60

        const formattedHours = hours.toString().padStart(2, '0')
        const formattedMinutes = minutes.toString().padStart(2, '0')
        const formattedSeconds = seconds.toString().padStart(2, '0')

        callDuration.value = `${formattedHours}:${formattedMinutes}:${formattedSeconds}`
    } else {
        callDuration.value = '00:00:00'
    }
}

const startTimer = () => {
    calculateTimeFromNow()

    const timerInterval = setInterval(() => {
        calculateTimeFromNow()
    }, 1000)

    onBeforeUnmount(() => {
        clearInterval(timerInterval)
    })
}

// TODO: temporary removed because of videoroom plugin
onMounted(async () => {
    const data = await getCreatedTime(props.roomId)
    created.value = data?.created || Date.now()
    startTimer(data.created)
})

</script>

<style scoped>
.main-video {
  min-width: 100%;
  height: 100%;
}
#screen-share-video-container {
  position: relative;
}
#container canvas {
  position: absolute;
  top: 0;
  left: 0;
}

#composite-canvas-container {
  margin: auto 0;
}

#composite-canvas {
  position: absolute;
  top: 0;
  left: 0;
}

#container {
  z-index: 11;
}
</style>
