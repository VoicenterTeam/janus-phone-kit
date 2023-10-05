<template>
  <div>
    <div class="fixed bottom-0 h-20 bg-light-bg shadow-lg w-full border-t border-field-borders flex justify-between">
      <div class="w-56"></div>
      <div class="flex items-center">
        <button v-if="microphoneOnModel"
                @click="microphoneOnModel = false"
                class="p-4 mr-2 rounded-full cursor-pointer text-active-elements border border-field-borders hover:shadow focus:outline-none">
          <vue-feather type="mic" class="w-5 h-5" />
        </button>
        <button v-if="!microphoneOnModel"
                @click="microphoneOnModel = true"
                class="p-4 rounded-full bg-active-elements cursor-pointer border border-active-elements hover:shadow hover:bg-active-elements--focus focus:outline-none mr-2">
          <vue-feather type="mic-off" class="w-5 h-5 text-white" />
        </button>

        <button @click="hangupMeeting" class="p-4 mr-2 rounded-full cursor-pointer border border-field-borders hover:shadow focus:outline-none">
          <vue-feather type="phone" class="w-5 h-5 transform text-destructive-actions rotate-90" />
        </button>

        <button v-if="videoOnModel"
                @click="videoOnModel= false"
                class="p-4 rounded-full cursor-pointer text-active-elements border border-field-borders hover:shadow focus:outline-none mr-2">
          <vue-feather type="video" class="w-5 h-5" />
        </button>
        <button v-if="!videoOnModel"
                @click="videoOnModel = true"
                class="p-4 rounded-full bg-active-elements cursor-pointer border border-active-elements hover:bg-active-elements--focus hover:shadow focus:outline-none mr-2">
          <vue-feather type="video-off" class="w-5 h-5 text-btn-filled-text" />
        </button>
        <button @click="toggleMaskEffect"
                :disabled="!videoOnModel"
                class="p-4 mr-2 rounded-full cursor-pointer text-default-text border border-field-borders hover:shadow focus:outline-none">
          {{ isWithMaskEffect ? 'Remove mask' : 'Use mask' }}
        </button>
        <button v-if="isScreenSharing && !isPresentationWhiteboardEnabled && !isImageWhiteboardEnabled"
                @click="enableScreenShareWhiteboard(!isScreenShareWhiteboardEnabled)"
                class="p-4 mr-2 rounded-full cursor-pointer border border-field-borders hover:shadow focus:outline-none">
          <vue-feather type="trash" v-if="isScreenShareWhiteboardEnabled" class="w-5 h-5 text-active-elements text-destructive-actions" />
          <vue-feather type="edit" v-else class="w-5 h-5 text-active-elements" />
        </button>

        <button v-if="!isScreenSharing && !isImageWhiteboardEnabled && !isPresentationWhiteboardEnabled"
                @click="whiteboardModalOpen = true"
                class="p-4 mr-2 rounded-full cursor-pointer border border-field-borders hover:shadow focus:outline-none">
          <vue-feather type="trash" v-if="isPresentationWhiteboardEnabled" class="w-5 h-5 text-destructive-actions" />
          <vue-feather type="edit" v-else class="w-5 h-5 text-active-elements" />
        </button>
        <button v-if="!isScreenSharing && isImageWhiteboardEnabled"
                class="p-4 mr-2 rounded-full cursor-pointer border border-field-borders hover:shadow focus:outline-none"
                @click="enableImageWhiteboard(false)">
          <vue-feather type="trash" class="w-5 h-5 text-destructive-actions" />
        </button>
        <button v-if="!isScreenSharing && isPresentationWhiteboardEnabled"
                class="p-4 mr-2 rounded-full cursor-pointer border border-field-borders hover:shadow focus:outline-none"
                @click="enablePresentationWhiteboard(false)">
          <vue-feather type="trash" class="w-5 h-5 text-destructive-actions" />
        </button>

      </div>

      <div class="flex items-center">
        <button @click="enableScreenShare(!isScreenSharing)"
                class="px-10 h-full border border-transparent cursor-pointer hover:bg-main-bg focus:outline-none mr-2">
          <vue-feather type="monitor" class="w-5 h-5 text-active-elements" />
        </button>
        <button @click="settingsModalOpen = true"
                class="px-10 h-full border border-transparent cursor-pointer hover:bg-main-bg focus:outline-none mr-2">
          <vue-feather type="settings" class="w-5 h-5 text-active-elements" />
        </button>
      </div>
    </div>

    <SettingsModal v-model:modalVisible="settingsModalOpen" />
    <WhiteboardOptionsModal v-model:modalVisible="whiteboardModalOpen" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import VueFeather from 'vue-feather'
import useJanusPhoneKit from '@/composables/useJanusPhoneKit'
import SettingsModal from '@/components/Conferencing/SettingsModal.vue'
import WhiteboardOptionsModal from '@/components/Conferencing/WhiteboardOptionsModal.vue'

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
const whiteboardModalOpen = ref(false)

/* Methods */
const hangupMeeting = () => {
    emit('hangup')
    hangup()
}
</script>

<style scoped>

</style>
