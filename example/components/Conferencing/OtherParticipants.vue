<template>
  <div class="fixed top-0 right-0 other-participants">
    <div
        v-for="source in sourcesExceptMain"
        :key="source.id"
        class="mr-2 mb-2 relative border-2 border-default-text rounded cursor-pointer"
        @click="selectParticipant(source)"
    >
      <video
          :srcObject.prop="source.stream"
          :id="source.id"
          :controls="false"
          :volume="0.9"
          :width="videoWidth"
          height="150"
          autoplay
          playsinline
      >
      </video>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'
import useJanusPhoneKit from '@/composables/useJanusPhoneKit'
import useDeviceType from '@/composables/useDeviceType'

/* Composables */
const {
    sourcesExceptMain,
    selectMainSource,
    isScreenShareWhiteboardEnabled,
    isPresentationWhiteboardEnabled,
    isImageWhiteboardEnabled
} = useJanusPhoneKit()

const { isMobile } = useDeviceType()

watch(sourcesExceptMain,(val) => {
    console.log('watch sourcesExceptMain', val)
})

/* Computed */
const videoWidth = computed(() => {
    return isMobile.value ? '130' : '200'
})

/* Methods */
const selectParticipant = (source) => {
    if (isScreenShareWhiteboardEnabled.value || isPresentationWhiteboardEnabled.value || isImageWhiteboardEnabled.value) {
        return
    }
    selectMainSource(source)
}
</script>

<style scoped lang="scss">

.other-participants {
  max-height: 100vh;
  overflow-y: auto;
}
</style>
