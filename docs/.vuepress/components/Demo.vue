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
    <conference v-if="conferenceStarted" :stream-sources="streamSources"/>

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
            { required: true, message: 'Display name is required', trigger: 'blur' },
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
          this.PhoneKit.joinRoom({ roomId: this.joinForm.roomId, displayName: this.joinForm.displayName })
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
