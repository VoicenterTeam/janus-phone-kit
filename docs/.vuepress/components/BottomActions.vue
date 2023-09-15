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
        <button v-if="isScreenSharing && !isPresentationWhiteboardEnabled && !isImageWhiteboardEnabled"
                @click="enableWhiteboard"
                class="p-4 mr-2 rounded-full cursor-pointer border border-gray-300 hover:shadow focus:outline-none">
          <trash2-icon v-if="isWhiteboardEnabled" class="w-5 h-5"></trash2-icon>
          <edit2-icon v-else class="w-5 h-5"></edit2-icon>
<!--          {{ isWhiteboardEnabled ? 'Remove drawing' : 'Draw over screen share' }}-->
        </button>
        <button v-if="!isScreenSharing && !isImageWhiteboardEnabled"
                @click="enablePresentationWhiteboard"
                class="p-4 mr-2 rounded-full cursor-pointer border border-gray-300 hover:shadow focus:outline-none">
          <trash2-icon v-if="isPresentationWhiteboardEnabled" class="w-5 h-5"></trash2-icon>
          <edit2-icon v-else class="w-5 h-5"></edit2-icon>
<!--          {{ isPresentationWhiteboardEnabled ? 'Stop drawing' : 'Enable drawing' }}-->
        </button>
        <button v-if="!isScreenSharing && !isPresentationWhiteboardEnabled"
                @click="enableImageWhiteboard"
                class="p-4 mr-2 rounded-full cursor-pointer border border-gray-300 hover:shadow focus:outline-none">
          <trash2-icon v-if="isImageWhiteboardEnabled" class="w-5 h-5"></trash2-icon>
          <edit-icon v-else class="w-5 h-5"></edit-icon>
<!--          {{ isImageWhiteboardEnabled ? 'Stop image drawing' : 'Enable image drawing' }}-->
        </button>
      </div>
      <div class="flex items-center">
        <button v-if="!isScreenSharing"
                @click="enableScreenShare"
                class="px-10 h-full border border-transparent cursor-pointer hover:bg-gray-200 focus:outline-none mr-2">
          <monitor-icon class="w-5 h-5"></monitor-icon>
        </button>
        <button v-else
                @click="stopScreenShare"
                class="px-10 h-full border border-transparent cursor-pointer hover:bg-gray-200 focus:outline-none mr-2">
          <x-square-icon class="w-5 h-5"></x-square-icon>
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
  import { MicIcon, MicOffIcon, VideoIcon, VideoOffIcon, PhoneIcon, MonitorIcon, SettingsIcon, XSquareIcon, Edit2Icon, Trash2Icon, EditIcon } from 'vue-feather-icons'
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
      SettingsIcon,
      XSquareIcon,
      Edit2Icon,
      Trash2Icon,
      EditIcon
    },
    data() {
      return {
        isMicOn: true,
        isVideoOn: true,
        settingsDialog: false,
        isScreenSharing: false,
        isWithMaskEffect: false,
        isWhiteboardEnabled: false,
        isPresentationWhiteboardEnabled: false,
        isImageWhiteboardEnabled: false,
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
      setListeners() {
        window.PhoneKit.on('screenShare:stop', () => {
          this.isScreenSharing = false
          if (this.isWhiteboardEnabled) {
            this.enableWhiteboard()
          }
        })

        window.PhoneKit.on('screenShare:start', () => {
          this.isScreenSharing = true
        })
      },
      enableScreenShare() {
        this.$emit('enable-screen-sharing', true)
      },
      async stopScreenShare() {
        if (this.isWhiteboardEnabled) {
          this.isWhiteboardEnabled = false
        }
        this.$emit('enable-screen-sharing', false)
      },
      enableWhiteboard() {
        this.isWhiteboardEnabled = !this.isWhiteboardEnabled
        this.$emit('enable-whiteboard', this.isWhiteboardEnabled)
        /*this.$nextTick(() => {
          this.isWhiteboardEnabled = enable
          window.PhoneKit.enableWhiteboard(enable, s)
        })*/
      },
      enablePresentationWhiteboard() {
        this.isPresentationWhiteboardEnabled = !this.isPresentationWhiteboardEnabled
        this.$emit('enable-presentation-whiteboard', this.isPresentationWhiteboardEnabled)
        /*this.$nextTick(() => {
          this.isWhiteboardEnabled = enable
          window.PhoneKit.enableWhiteboard(enable, s)
        })*/
      },
      enableImageWhiteboard () {
        this.isImageWhiteboardEnabled = !this.isImageWhiteboardEnabled
        this.$emit('enable-image-whiteboard', this.isImageWhiteboardEnabled)
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
    },
    mounted() {
      this.setListeners()
    }
  }
</script>
<style>
</style>
