<template>
  <div>
    <div class="fixed bottom-0 h-20 bg-white shadow-lg w-full border-t border-gray-200 flex justify-between">
      <div class="w-56"></div>
      <div class="flex items-center">
        <button v-if="microphoneOnModel"
                @click="microphoneOnModel = false"
                class="p-4 mr-2 rounded-full cursor-pointer border border-gray-300 hover:shadow focus:outline-none">
          <vue-feather type="mic" class="w-5 h-5" />
        </button>
        <button v-if="!microphoneOnModel"
                @click="microphoneOnModel = true"
                class="p-4 rounded-full bg-red-600 cursor-pointer border border-red-600 hover:shadow hover:bg-red-700 focus:outline-none mr-2">
          <vue-feather type="mic-off" class="w-5 h-5 text-white" />
        </button>

        <button @click="hangupMeeting" class="p-4 mr-2 rounded-full cursor-pointer border border-gray-300 hover:shadow focus:outline-none">
          <vue-feather type="phone" class="w-5 h-5 transform text-red-600 rotate-90" />
        </button>

        <button v-if="videoOnModel"
                @click="videoOnModel= false"
                class="p-4 rounded-full cursor-pointer border border-gray-300 hover:shadow focus:outline-none mr-2">
          <vue-feather type="video" class="w-5 h-5" />
        </button>
        <button v-if="!videoOnModel"
                @click="videoOnModel = true"
                class="p-4 rounded-full bg-red-600 cursor-pointer border border-red-600 hover:bg-red-700 hover:shadow focus:outline-none mr-2">
          <vue-feather type="video-off" class="w-5 h-5 text-white" />
        </button>
        <button @click="toggleMaskEffect"
                :disabled="!videoOnModel"
                class="p-4 mr-2 rounded-full cursor-pointer border border-gray-300 hover:shadow focus:outline-none">
          {{ isWithMaskEffect ? 'Remove mask' : 'Use mask' }}
        </button>
        <button v-if="isScreenSharing && !isPresentationWhiteboardEnabled && !isImageWhiteboardEnabled"
                @click="enableScreenShareWhiteboard(!isScreenShareWhiteboardEnabled)"
                class="p-4 mr-2 rounded-full cursor-pointer border border-gray-300 hover:shadow focus:outline-none">
<!--          {{ isScreenShareWhiteboardEnabled ? 'Remove drawing' : 'Draw over screen share' }}-->
          <vue-feather type="trash" v-if="isScreenShareWhiteboardEnabled" class="w-5 h-5" />
          <vue-feather type="edit" v-else class="w-5 h-5" />
        </button>
        <button v-if="!isScreenSharing && !isImageWhiteboardEnabled"
                @click="enablePresentationWhiteboard(!isPresentationWhiteboardEnabled)"
                class="p-4 mr-2 rounded-full cursor-pointer border border-gray-300 hover:shadow focus:outline-none">
<!--          {{ isPresentationWhiteboardEnabled ? 'Stop drawing' : 'Enable drawing' }}-->
          <vue-feather type="trash" v-if="isPresentationWhiteboardEnabled" class="w-5 h-5" />
          <vue-feather type="edit" v-else class="w-5 h-5" />
        </button>
        <button v-if="!isScreenSharing && !isPresentationWhiteboardEnabled"
                @click="enableImageWhiteboard(!isImageWhiteboardEnabled)"
                class="p-4 mr-2 rounded-full cursor-pointer border border-gray-300 hover:shadow focus:outline-none">
<!--          {{ isImageWhiteboardEnabled ? 'Stop image drawing' : 'Enable image drawing' }}-->
          <vue-feather type="trash" v-if="isImageWhiteboardEnabled" class="w-5 h-5" />
          <vue-feather type="edit" v-else class="w-5 h-5" />
        </button>
      </div>
      <div class="flex items-center">
        <button @click="enableScreenShare(!isScreenSharing)"
                class="px-10 h-full border border-transparent cursor-pointer hover:bg-gray-200 focus:outline-none mr-2">
          <vue-feather type="monitor" class="w-5 h-5" />
        </button>
        <button @click="settingsModalOpen = true"
                class="px-10 h-full border border-transparent cursor-pointer hover:bg-gray-200 focus:outline-none mr-2">
          <vue-feather type="settings" class="w-5 h-5" />
        </button>
      </div>
    </div>

    <SettingsModal v-model="settingsModalOpen" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import VueFeather from 'vue-feather'
import useJanusPhoneKit from '@/composables/useJanusPhoneKit'
import SettingsModal from '@/components/Conferencing/SettingsModal.vue'

/* Composable */
const {
    microphoneOnModel,
    videoOnModel,
    isPresentationWhiteboardEnabled,
    isImageWhiteboardEnabled,
    isScreenShareWhiteboardEnabled,
    isWithMaskEffect,
    isScreenSharing,
    hangup,
    toggleMaskEffect,
    enableScreenShareWhiteboard,
    enablePresentationWhiteboard,
    enableImageWhiteboard,
    enableScreenShare
} = useJanusPhoneKit()

/* Emit */
export interface Emit {
  (e: 'hangup'): void
}

const emit = defineEmits<Emit>()

/* Data */
const settingsModalOpen = ref(false)

/* Methods */
const hangupMeeting = () => {
    emit('hangup')
    hangup()
}
</script>

<style scoped>

</style>
