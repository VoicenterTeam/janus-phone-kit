<template>
  <div class="fixed top-0 right-0 other-participants">
    <div
        v-for="source in sourcesExceptMain"
        :key="source.id"
        class="mr-2 mb-2 relative border-2 border-blue-700 rounded cursor-pointer"
        @click="selectMainSource(source)"
    >
      <video
          :srcObject.prop="source.stream"
          :id="source.id"
          :controls="false"
          :volume="0.9"
          width="200"
          height="150"
          autoplay
      >
      </video>
    </div>
  </div>
</template>

<script setup lang="ts">
import { watch } from 'vue'
import useJanusPhoneKit from '@/composables/useJanusPhoneKit'

/* Composables */
const { sourcesExceptMain, selectMainSource } = useJanusPhoneKit()

watch(sourcesExceptMain,(val) => {
    console.log('watch sourcesExceptMain', val)
})
</script>

<style scoped lang="scss">

.other-participants {
  max-height: 100vh;
  overflow-y: auto;
}
</style>
