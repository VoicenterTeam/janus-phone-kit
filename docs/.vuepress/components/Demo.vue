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
        talkingStream: null,
        joinForm: {
          displayName: 'Test',
          roomId: 1236,
          validate : true

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
          console.log(" joining roomId,displayName",this.joinForm.roomId,this.joinForm.displayName)

          if(this.joinForm.validate)await this.$refs.form.validate()
          this.PhoneKit.joinRoom({
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
          console.log('ON member:join')
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
          console.log('ON member:update')
          const index = this.streamSources.findIndex(s => s.sender === data.sender)
          if (index !== -1) {
            const source = this.streamSources[index]
            this.$set(source, 'state', data.state)
          }
          this.talkingStream = this.streamSources.find(source => source?.state?.isTalking)
        })

        this.PhoneKit.on('hangup', this.afterHangup)
      }
    },
    async mounted() {
      this.PhoneKit = new PhoneKit({
        url: 'wss://jnwss.voicenter.co/janus'
      })
      // @ts-ignore
      window.PhoneKit = this.PhoneKit


      if(this.$route.query.roomId)this.joinForm.roomId=this.$route.query.roomId;
      if(this.$route.query.displayName)this.joinForm.displayName=this.$route.query.displayName;
      if(this.$route.query.room)this.joinForm.roomId=this.$route.query.room;
      if(this.$route.query.name)this.joinForm.displayName=this.$route.query.name;
      console.log("roomId,displayName",this.joinForm.roomId,this.joinForm.displayName);
      if(this.$route.query.roomId||this.$route.query.displayName||this.$route.query.roomId||this.$route.query.name){
        this.joinForm.validate =false;
        await this.joinRoom();
      }
    }

  })

</script>
<style>
  .theme-default-content.content__default {
    max-width: 1400px;
  }
</style>
