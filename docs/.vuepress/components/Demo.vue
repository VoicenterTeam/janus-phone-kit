<template>
    <div>
      Test
      <button @click="startVideo">Start video</button>
      <button @click="startScreenShare">Start screen share</button>
    </div>
</template>
<script lang="ts">
  import Vue from 'vue'
  import JanusPhoneKit from '../../../src';

  export default Vue.extend({
    data() {
      return {
        janusSdk: null
      }
    },
    methods: {
      startVideo() {
        this.janusSdk.startVideoConference()
      },
      startScreenShare() {
        this.janusSdk.startScreenShare()
      }
    },
    mounted() {
      this.janusSdk = new JanusPhoneKit({
        roomId: parseInt((new URLSearchParams(window.location.search)).get('room')),
        url: 'wss://webconf.officering.net/janus'
      })
    }
  })
</script>
<style>
</style>
