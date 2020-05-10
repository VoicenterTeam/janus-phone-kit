<template>
  <div class="flex w-full">
    <div class="w-1/3 mr-4 flex flex-col">
      <label for="audioinput">Microhpone</label>
      <select id="audioinput" v-model="audioInput">
        <option v-for="option in microphoneList"
                :value="option.deviceId"
                :key="option.deviceId">
          {{option.label}}
        </option>
      </select>
    </div>
    <div class="w-1/3 mr-4 flex flex-col">
      <label for="audiooutput">Speakers</label>
      <select id="audiooutput" v-model="audioOutput">
        <option v-for="option in speakerList"
                :value="option.deviceId"
                :key="option.deviceId">
          {{option.label}}
        </option>
      </select>
    </div>

    <div class="w-1/3 flex flex-col">
      <label for="videoinput">Camera</label>
      <select id="videoinput" v-model="videoInput">
        <option v-for="option in cameraList"
                :value="option.deviceId"
                :key="option.deviceId">
          {{option.label}}
        </option>
      </select>
    </div>
  </div>
</template>
<script>
  import { DeviceManager } from "../../../src";

  export default {
    data() {
      return {
        audioInput: 'default',
        audioOutput: 'default',
        videoInput: 'default',
        cameraList: [],
        speakerList: [],
        microphoneList: [],
      }
    },
    async created() {
      this.speakerList = await DeviceManager.getSpeakerList()
      this.microphoneList = await DeviceManager.getMicrophoneList()
      this.cameraList = await DeviceManager.getCameraList()

      if (this.cameraList.length) {
        this.videoInput = this.cameraList[0].deviceId
      }
    }
  }
</script>
<style>
</style>
