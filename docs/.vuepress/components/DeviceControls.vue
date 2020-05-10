<template>
  <div class="flex flex-col w-full">
    <div class="flex flex-col mb-3">
      <label class="font-semibold mb-2" for="audioinput">Microhpone</label>
      <select id="audioinput"
              class="block form-select w-full transition duration-150 ease-in-out sm:text-sm sm:leading-5"
              v-model="model.audioInput">
        <option v-for="option in microphoneList"
                :value="option.deviceId"
                :key="option.deviceId">
          {{option.label}}
        </option>
      </select>
    </div>
    <div class="flex flex-col mb-3">
      <label class="font-semibold mb-2" for="audiooutput">Speakers</label>
      <select id="audiooutput" v-model="model.audioOutput">
        <option v-for="option in speakerList"
                :value="option.deviceId"
                :key="option.deviceId">
          {{option.label}}
        </option>
      </select>
    </div>

    <div class="flex flex-col mb-3">
      <label class="font-semibold mb-2" for="videoinput">Camera</label>
      <select id="videoinput" v-model="model.videoInput">
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
        model: {
          audioInput: 'default',
          audioOutput: 'default',
          videoInput: 'default',
        },
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
  select {
    background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23a0aec0'%3e%3cpath d='M15.3 9.3a1 1 0 0 1 1.4 1.4l-4 4a1 1 0 0 1-1.4 0l-4-4a1 1 0 0 1 1.4-1.4l3.3 3.29 3.3-3.3z'/%3e%3c/svg%3e");
    appearance: none;
    color-adjust: exact;
    background-repeat: no-repeat;
    background-color: #fff;
    border-color: #e2e8f0;
    border-width: 1px;
    border-radius: 0.25rem;
    padding: 0.5rem 2.5rem 0.5rem 0.75rem;
    font-size: 1rem;
    line-height: 1.5;
    background-position: right 0.5rem center;
    background-size: 1.5em 1.5em;
  }
</style>
