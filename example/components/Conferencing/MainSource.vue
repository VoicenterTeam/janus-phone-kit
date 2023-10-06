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

      <div class="text-white">
        {{ mainSource.name || mainSource.sender }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import useJanusPhoneKit from '@/composables/useJanusPhoneKit'

/* Composables */
const { t } = useI18n()
const {
    mainSource,
    isWhiteboardEnabled,
    isScreenShareWhiteboardEnabled,
    isPresentationWhiteboardEnabled,
    isImageWhiteboardEnabled
} = useJanusPhoneKit()
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
