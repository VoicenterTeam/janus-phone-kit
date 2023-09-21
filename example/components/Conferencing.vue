<template>
    <div :class="{'conference-content fixed top-0 left-0 w-screen z-50 bg-black': isMainSource}">
      <MainSource v-if="isMainSource" />
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import useJanusPhoneKit from '@/composables/useJanusPhoneKit'
import MainSource from '@/components/Conferencing/MainSource.vue'

/* Composables */
const { mainSource } = useJanusPhoneKit()

/* Computed */
const isMainSource = computed(() =>{
    return mainSource.value !== undefined
})
</script>

<style scoped lang="scss">
$bottom-actions-height: 80px;

.conference-content {
  height: calc(100% - #{$bottom-actions-height});
}
</style>
