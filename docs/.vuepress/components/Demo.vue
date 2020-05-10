<template>
  <div>
    <base-button @click="conferenceStarted ? stopConference() : startConference()">
      {{conferenceStarted ? 'Stop': 'Start'}}
    </base-button>
    <base-button @click="startScreenShare"
                 :disabled="streamSources.length === 0">
      {{screenShareStarted ? 'Stop screen share': 'Start screen share'}}
    </base-button>

    <conference v-if="conferenceStarted" :stream-sources="streamSources"/>

  </div>
</template>
<script lang="ts">
  import Vue from 'vue'
  import ElDialog from 'element-ui/packages/dialog'
  import 'element-ui/packages/theme-chalk/lib/dialog.css'

  import PhoneKit from '../../../src';
  export default Vue.extend({
    components: {
      ElDialog
    },
    data() {
      return {
        conferenceStarted: false,
        screenShareStarted: false,
        PhoneKit: null,
        roomId: 1234,
        streamSources: [],
      }
    },
    methods: {
      startConference() {
        this.PhoneKit.joinConference(this.roomId)
        this.initListeners()
        this.conferenceStarted = true
      },
      stopConference() {
        this.PhoneKit.hangup()
        this.afterHangup()
      },
      afterHangup() {
        this.conferenceStarted = false
        this.streamSources = []
      },
      startScreenShare() {
        this.PhoneKit.startScreenShare()
        this.screenShareStarted = true
      },
      initListeners() {
        this.PhoneKit.on('member:join', data => {
          this.streamSources.push(data)
        })

        this.PhoneKit.on('member:hangup', info => {
          const index = this.streamSources.findIndex(s => s.sender === info.sender)
          if (index !== -1) {
            this.streamSources.splice(index, 1)
          }
        })
        this.PhoneKit.on('hangup', this.afterHangup)
      }
    },
    async mounted() {
      this.PhoneKit = new PhoneKit({
        url: 'wss://webconf.officering.net/janus'
      })
      // @ts-ignore
      window.PhoneKit = this.PhoneKit
    }
  })
</script>
<style>
  .theme-default-content.content__default {
    max-width: 1400px;
  }
</style>
