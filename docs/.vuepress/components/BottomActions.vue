<template>
  <div>
    <div class="fixed bottom-0 h-20 bg-white shadow-lg w-full border-t border-gray-200 flex justify-between">
      <div class="w-56"></div>
      <div class="flex items-center">
        <button v-if="isMicOn"
                @click="toggleMicrophone(false)"
                class="p-4 mr-2 rounded-full cursor-pointer border border-gray-300 hover:shadow focus:outline-none">
          <mic-icon class="w-5 h-5"></mic-icon>
        </button>
        <button v-if="!isMicOn"
                @click="toggleMicrophone(true)"
                class="p-4 rounded-full bg-red-600 cursor-pointer border border-red-600 hover:shadow hover:bg-red-700 focus:outline-none mr-2">
          <mic-off-icon class="w-5 h-5 text-white"></mic-off-icon>
        </button>

        <button @click="hangup" class="p-4 mr-2 rounded-full cursor-pointer border border-gray-300 hover:shadow focus:outline-none">
          <phone-icon class="w-5 h-5 transform text-red-600 rotate-90"></phone-icon>
        </button>

        <button v-if="isVideoOn"
                @click="toggleCamera(false)"
                class="p-4 rounded-full cursor-pointer border border-gray-300 hover:shadow focus:outline-none mr-2">
          <video-icon class="w-5 h-5"></video-icon>
        </button>
        <button v-if="!isVideoOn"
                @click="toggleCamera(true)"
                class="p-4 rounded-full bg-red-600 cursor-pointer border border-red-600 hover:bg-red-700 hover:shadow focus:outline-none mr-2">
          <video-off-icon class="w-5 h-5 text-white"></video-off-icon>
        </button>
        <button @click="enableMaskEffect"
                :disabled="!isVideoOn"
                class="p-4 mr-2 rounded-full cursor-pointer border border-gray-300 hover:shadow focus:outline-none">
          {{ isWithMaskEffect ? 'Remove mask' : 'Use mask' }}
        </button>
      </div>
      <div class="flex items-center">
        <button @click="enableScreenShare()"
                class="px-10 h-full border border-transparent cursor-pointer hover:bg-gray-200 focus:outline-none mr-2">
          <monitor-icon class="w-5 h-5"></monitor-icon>
        </button>
        <button @click="settingsDialog = true"
                class="px-10 h-full border border-transparent cursor-pointer hover:bg-gray-200 focus:outline-none mr-2">
          <settings-icon class="w-5 h-5"></settings-icon>
        </button>
      </div>
    </div>
    <el-dialog :visible.sync="settingsDialog"
               append-to-body
    >
      <device-controls ref="deviceControls"/>
      <template v-slot:footer>
        <div class="flex w-full justify-center">
          <base-button @click="saveSettings">Save Settings</base-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>
<script>
  import { MicIcon, MicOffIcon, VideoIcon, VideoOffIcon, PhoneIcon, MonitorIcon, SettingsIcon } from 'vue-feather-icons'
  import ElDialog from 'element-ui/packages/dialog'
  import 'element-ui/packages/theme-chalk/lib/dialog.css'
  import { DeviceManager } from "../../../src";

  export default {
    components: {
      ElDialog,
      MicIcon,
      MicOffIcon,
      VideoOffIcon,
      VideoIcon,
      PhoneIcon,
      MonitorIcon,
      SettingsIcon
    },
    data() {
      return {
        isMicOn: true,
        isVideoOn: true,
        settingsDialog: false,
        isWithMaskEffect: false,
      }
    },
    methods: {
      toggleCamera(value) {
        if (value) {
          window.PhoneKit.startVideo()
        } else {
          window.PhoneKit.stopVideo()
        }
        this.isVideoOn = value
      },
      toggleMicrophone(value) {
        if (value) {
          window.PhoneKit.startAudio()
        } else {
          window.PhoneKit.stopAudio()
        }
        this.isMicOn = value
      },
      hangup() {
        window.PhoneKit.hangup()
      },
      enableScreenShare() {
        window.PhoneKit.startScreenShare()
      },
      async saveSettings() {
        const data = this.$refs.deviceControls.model
        const inputsChanged = data.audioInput !== 'default' || data.videoInput !== 'default'
        const videoElements = document.querySelectorAll('video')
        if (data.audioOutput && videoElements.length) {
          videoElements.forEach(element => {
            DeviceManager.changeAudioOutput(element, data.audioOutput)
          })
        }
        if (!inputsChanged) {
          this.settingsDialog = false
          return
        }
        await this.tryChangeStreamSource(data)
        this.settingsDialog = false
      },
      async tryChangeStreamSource(data) {
        const { videoInput, audioInput } = data
        const stream = await window.PhoneKit.changePublisherStream({ videoInput, audioInput })
        this.$emit('update-publisher-stream', stream)
      },
      async enableMaskEffect() {
        if (!this.isVideoOn) {
          return
        }
        try {
          const stream = await window.PhoneKit.enableMask(!this.isWithMaskEffect)
          this.isWithMaskEffect = !this.isWithMaskEffect
          this.$emit('update-publisher-stream', stream)
        } catch(err) {
          console.error('Error when enabling mask effect:', err)
        }

      }
    }
  }
</script>
<style>
</style>
