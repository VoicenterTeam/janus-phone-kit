<template>
    <div :class="{'conference-content fixed top-0 left-0 w-screen z-50 bg-black': isMainSource}">
      <MainSource v-if="isMainSource" :room-id="props.roomId" />
      <OtherParticipants />
      <BottomActions v-if="isMainSource" @hangup="onHangup" />
    </div>
</template>

<script setup lang="ts">
import { computed, inject } from 'vue'
//import useJanusPhoneKit from '@/composables/useJanusPhoneKit'
import MainSource from '@/components/Conferencing/MainSource.vue'
import BottomActions from '@/components/Conferencing/BottomActions.vue'
import OtherParticipants from '@/components/Conferencing/OtherParticipants.vue'

const useJanusPhoneKit = inject('useJanusPhoneKit')

/* Composables */
const { mainSource } = useJanusPhoneKit()

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

/* Computed */
const isMainSource = computed(() =>{
    return mainSource.value !== undefined
})

/* Emit */
export interface Emit {
  (e: 'hangup'): void
}

const emit = defineEmits<Emit>()

/* Methods */
const onHangup = () => {
    emit('hangup')
}
</script>

<style scoped lang="scss">
$bottom-actions-height: 80px;

.conference-content {
  height: calc(100% - #{$bottom-actions-height});
}
</style>
