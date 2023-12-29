<template>
  <div>
    <div class="fixed bottom-0 h-20 bg-light-bg shadow-lg w-full border-t border-field-borders flex justify-between">
      <div class="flex w-56 p-2 items-center">
        <img
          style="width: 150px; height: auto;"
          :src="stateData.appConfig.APP_LOGO"
        />
      </div>
      <div class="flex items-center">
        <RoundButton
            icon="vc-icon-mic"
            activeIcon="vc-icon-mic-off"
            color="active-elements"
            class="mr-2"
            :active="!microphoneOnModel"
            @click="microphoneOnModel = !microphoneOnModel"
        />
        <RoundButton
            icon="vc-icon-camera"
            activeIcon="vc-icon-camera-off"
            color="active-elements"
            class="mr-2"
            :active="!videoOnModel"
            @click="videoOnModel = !videoOnModel"
        />
        <RoundButton
            icon="vc-icon-phone-down"
            color="destructive-actions"
            class="mr-2"
            @click="hangupMeeting"
        />

        <div v-if="isScreenSharing && !isPresentationWhiteboardEnabled && !isImageWhiteboardEnabled">
          <RoundButton
              v-if="!isScreenShareWhiteboardEnabled"
              icon="vc-icon-edit-pencil"
              color="active-elements"
              class="mr-2"
              @click="enableScreenShareWhiteboard(!isScreenShareWhiteboardEnabled)"
          />
          <RoundButton
              v-else
              icon="vc-icon-recycle-bin"
              color="destructive-actions"
              class="mr-2"
              @click="enableScreenShareWhiteboard(!isScreenShareWhiteboardEnabled)"
          />
        </div>

        <div>
          <RoundButton
              v-if="!isScreenSharing && !isImageWhiteboardEnabled && !isPresentationWhiteboardEnabled"
              icon="vc-icon-edit-pencil"
              color="active-elements"
              class="mr-2"
              @click="whiteboardModalOpen = true"
          />
          <RoundButton
              v-if="!isScreenSharing && isImageWhiteboardEnabled"
              icon="vc-icon-recycle-bin"
              color="destructive-actions"
              class="mr-2"
              @click="enableImageWhiteboard(false)"
          />
          <RoundButton
              v-if="!isScreenSharing && isPresentationWhiteboardEnabled"
              icon="vc-icon-recycle-bin"
              color="destructive-actions"
              class="mr-2"
              @click="enablePresentationWhiteboard(false)"
          />
        </div>


        <div class="mx-1">
          <DrawerOptions
              v-if="isScreenShareWhiteboardEnabled || isImageWhiteboardEnabled || isPresentationWhiteboardEnabled"
              :is-extended-options="isPresentationWhiteboardEnabled"
              :isScreenShareWhiteboardEnabled="isScreenShareWhiteboardEnabled"
              :setupDrawerOptions="setupDrawerOptions"
              :setupScreenShareDrawerOptions="setupScreenShareDrawerOptions"
          />
        </div>

        <div class="mx-1">
          <MaskVisualizationOptions
            v-if="isWithBokehMaskEffect"
            :setupVisualizationConfig="setupMaskVisualizationConfig"
          />
        </div>

      </div>

      <div class="flex items-center">
        <RoundButton
            icon="vc-icon-background-blur-2"
            activeIcon="vc-icon-background-blur-1"
            color="active-elements"
            class="mr-2"
            :active="isWithBokehMaskEffect || isWithBgImgMaskEffect"
            :disabled="!videoOnModel"
            @click="toggleMaskEffect"
        />
        <RoundButton
            v-if="!isMobile"
            icon="vc-icon-open"
            activeIcon="vc-icon-close"
            color="active-elements"
            :active="isScreenSharing"
            class="mr-2"
            @click="enableScreenShare(!isScreenSharing)"
        />
<!--        <RoundButton
            icon="vc-icon-settings"
            color="active-elements"
            class="mr-2"
            @click="settingsModalOpen = true"
        />-->
      </div>
    </div>

    <SettingsModal v-model:modalVisible="settingsModalOpen" />
    <WhiteboardOptionsModal v-model:modalVisible="whiteboardModalOpen" />
    <MaskOptionsModal v-model:modalVisible="maskOptionsModalOpen" />
  </div>
</template>

<script setup lang="ts">
import { ref, inject } from 'vue'
//import useJanusPhoneKit from '@/composables/useJanusPhoneKit'
import useDeviceType from '@/composables/useDeviceType'
import SettingsModal from '@/components/Conferencing/SettingsModal.vue'
import WhiteboardOptionsModal from '@/components/Conferencing/WhiteboardOptionsModal.vue'
import RoundButton from '@/components/Conferencing/RoundButton.vue'
import DrawerOptions from '@/components/Conferencing/DrawerOptions.vue'
import { ConfigInjectionKey } from '@/plugins/config'
import MaskOptionsModal from '@/components/Conferencing/MaskOptionsModal.vue'
import MaskVisualizationOptions from '@/components/Conferencing/MaskVisualizationOptions.vue'

const useJanusPhoneKit = inject('useJanusPhoneKit')

/* Inject */
const stateData = inject(ConfigInjectionKey)

/* Composable */
const {
    microphoneOnModel,
    videoOnModel,
    isPresentationWhiteboardEnabled,
    isImageWhiteboardEnabled,
    isScreenShareWhiteboardEnabled,
    isWithBokehMaskEffect,
    isWithBgImgMaskEffect,
    isScreenSharing,
    hangup,
    disableMaskEffect,
    setupMaskVisualizationConfig,
    enableScreenShareWhiteboard,
    enablePresentationWhiteboard,
    enableImageWhiteboard,
    enableScreenShare,
    setupDrawerOptions,
    setupScreenShareDrawerOptions
} = useJanusPhoneKit()

const { isMobile } = useDeviceType()

/* Emit */
export interface Emit {
  (e: 'hangup'): void
}

const emit = defineEmits<Emit>()

/* Data */
const settingsModalOpen = ref(false)
const whiteboardModalOpen = ref(false)
const maskOptionsModalOpen = ref(false)

/* Methods */
const hangupMeeting = () => {
    emit('hangup')
    hangup()
}

const toggleMaskEffect = () => {
    if (isWithBokehMaskEffect.value || isWithBgImgMaskEffect.value) {
        disableMaskEffect()
    } else {
        maskOptionsModalOpen.value = true
    }
}
</script>

<style scoped>

</style>
