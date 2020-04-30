<template>
  <div>
    <base-button @click="videoStarted ? stopVideo() : startVideo()">
      {{videoStarted ? 'Stop video': 'Start Video'}}
    </base-button>
    <base-button @click="startScreenShare"
                 :disabled="streamSources.length === 0">
      {{screenShareStarted ? 'Stop screen share': 'Start screen share'}}
    </base-button>

    <div class="flex flex-wrap mt-10">
      <div v-for="(streamSource, index) in streamSources"
           :key="index"
           class="mr-2">
        <span class="mb-2">{{streamSource.joinResult.session_id}}</span>
        <video :srcObject.prop="streamSource.stream"
               :controls="true"
               width="400"
               autoplay
        >
        </video>
      </div>
    </div>

  </div>
</template>
<script lang="ts">
  import Vue from 'vue'
  import JanusPhoneKit from '../../../src';

  export default Vue.extend({
    data() {
      return {
        videoStarted: false,
        screenShareStarted: false,
        janusSdk: null,
        streamSources: []
      }
    },
    methods: {
      startVideo() {
        this.janusSdk.startVideoConference()
        this.initListeners()
        this.videoStarted = true
      },
      stopVideo() {
        this.janusSdk.stopVideConference()
        const index = this.streamSources.findIndex(s => s.type === 'publisher')

        if (index !== -1) {
          this.streamSources.splice(index, 1)
          this.videoStarted = false
        }
      },
      startScreenShare() {
        this.janusSdk.startScreenShare()
        this.screenShareStarted = true
      },
      initListeners() {
        const session = this.janusSdk.getSession()
        session.on('member:join', data => {
          this.streamSources.push(data)
        })
        session.on('member:hangup', info => {
          const index = this.streamSources.findIndex(s => s.sender === info.sender)
          if (index !== -1) {
            this.streamSources.splice(index, 1)
          }
        })
      }
    },
    mounted() {
      this.janusSdk = new JanusPhoneKit({
        roomId: 1234,
        url: 'wss://webconf.officering.net/janus'
      })
    }
  })
</script>
<style>
  .theme-default-content.content__default {
    max-width: 1400px;
  }
</style>
