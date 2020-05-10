<template>
  <div>
    <base-button @click="conferenceStarted ? hangup() : joinConference()">
      {{conferenceStarted ? 'Stop': 'Join Conference'}}
    </base-button>

    <conference v-if="conferenceStarted" :stream-sources="streamSources"/>

  </div>
</template>
<script lang="ts">
  import Vue from 'vue'
  import MessageBox from 'element-ui/packages/message-box'
  import ElDialog from 'element-ui/packages/dialog'
  import 'element-ui/packages/theme-chalk/lib/dialog.css'
  import 'element-ui/packages/theme-chalk/lib/message-box.css'

  import PhoneKit from '../../../src';
  export default Vue.extend({
    components: {
      ElDialog
    },
    data() {
      return {
        conferenceStarted: false,
        PhoneKit: null,
        roomId: 1234,
        streamSources: [],
      }
    },
    methods: {
      async joinConference() {
        try {
          const displayName = await MessageBox.prompt(`What's your name ?`, {
            confirmButtonText: 'OK',
            cancelButtonText: 'Cancel',
          })
          this.PhoneKit.joinConference(this.roomId, displayName.value)
          this.initListeners()
          this.conferenceStarted = true
        } catch (err) {
          console.warn(err)
        }
      },
      hangup() {
        this.PhoneKit.hangup()
        this.afterHangup()
      },
      afterHangup() {
        this.conferenceStarted = false
        this.streamSources = []
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
