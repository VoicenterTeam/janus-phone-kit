<template>
  <div>
    <base-button @click="conferenceStarted ? hangup() : openJoinModal()">
      {{conferenceStarted ? 'Stop': 'Join Conference'}}
    </base-button>

    <el-dialog :visible.sync="joinDialogVisible">
      <el-form ref="form"
               label-position="top"
               :rules="rules"
               :model="joinForm"
               @submit.native.prevent="joinRoom"
      >
        <el-form-item label="Room Id" prop="roomId">
          <el-input placeholder="Room Id" v-model="joinForm.roomId"></el-input>
        </el-form-item>
        <el-form-item label="Display Name" prop="displayName">
          <el-input placeholder="Your name..." v-model="joinForm.displayName"></el-input>
        </el-form-item>

        <div class="flex justify-center">
          <base-button type="submit">
            Join Conference
          </base-button>
        </div>
      </el-form>
    </el-dialog>
    <conference v-if="conferenceStarted"
                :talking-stream="talkingStream"
                :stream-sources="streamSources"/>

    <audio v-if="audioSource" :srcObject.prop="audioSource" autoplay></audio>
  </div>
</template>
<script lang="ts">
  import Vue from 'vue'

  import PhoneKit, {DeviceManager} from '../../../src';

  export default Vue.extend({
    data() {
      return {
        conferenceStarted: false,
        joinDialogVisible: false,
        PhoneKit: null,
        streamSources: [],
        // for js sip only
        audioSource: null,
        talkingStream: null,
        joinForm: {
          displayName: 'Test',
          roomId: 1236,
        },
        rules: {
          roomId: [
            {
              required: true,
              message: 'Room Id name is required',
              trigger: 'blur'
            },
          ],
          displayName: [
            {required: true, message: 'Display name is required', trigger: 'blur'},
          ],
        }
      }
    },
    methods: {
      openJoinModal() {
        this.joinDialogVisible = true
      },
      async joinRoom() {
        try {
          await this.$refs.form.validate()
          await this.PhoneKit.joinRoom({
            roomId: this.joinForm.roomId,
            displayName: this.joinForm.displayName,
            mediaConstraints: {
              audio: true,
              video: true,
            }
          })
          this.initListeners()
          this.conferenceStarted = true
          this.joinDialogVisible = false
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
        this.streamSources.forEach(source => {
          DeviceManager.stopStreamTracks(source.stream)
        })
        this.streamSources = []
      },
      playJoinSound() {
        const audio = new Audio('/join.mp3');
        audio.play();
      },
      initListeners() {
        this.PhoneKit.on('member:join', data => {
          this.streamSources.push(data)
          this.playJoinSound()
        })

        this.PhoneKit.on('member:hangup', info => {
          const index = this.streamSources.findIndex(s => s.sender === info.sender)
          if (index !== -1) {
            DeviceManager.stopStreamTracks(this.streamSources[index].stream)
            this.streamSources.splice(index, 1)
          }
        })

        this.PhoneKit.on('member:update', data => {
          const index = this.streamSources.findIndex(s => s.sender === data.sender)
          if (index !== -1) {
            const source = this.streamSources[index]
            this.$set(source, 'state', data.state)
          }
          this.talkingStream = this.streamSources.find(source => source?.state?.isTalking)
        })

        this.PhoneKit.on('sip:init', data => {
          this.audioSource = data.stream;
        })

        this.PhoneKit.on('hangup', this.afterHangup)
      }
    },
    async mounted() {
      this.PhoneKit = new PhoneKit({
        url: 'wss://webconf.officering.net/janus',
        audio: 'sip',
        jsSipConfig: {
          socketUrl: 'wss://webrtc.officering.net:8888',
          token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNjE2MjM5MDIyLCJ0YWciOiJ2bGFkIiwiYXBwX2RhdGEiOnsiYXBwX2ludml0ZV9pZCI6MSwiYXBwX3RhcmdldF9pZCI6NjU2LCJhcHBfdHlwZSI6Imp3dCIsImFwcF9uYW1lIjoiQ29uZmVyZW5jZSJ9fQ.-ParTBD5afxIiNe2k6UvRWwERJMkXQeck1hENbK9yzY',
          sipUrl: 'sip:alex1@c7594.ratetel.com:8888',
          password: '',
        }
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
