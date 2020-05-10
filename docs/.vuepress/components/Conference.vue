<template>
  <div :class="{'conference-content fixed top-0 left-0 w-screen z-50 bg-black': mainSource}">
    <template v-if="mainSource">
      <video :srcObject.prop="mainSource.stream"
             class="main-video"
             :class="{'publisher-video': mainSource.type === 'publisher'}"
             :controls="false"
             :muted="mainSource.type === 'publisher'"
             :volume="mainSource.type === 'publisher' ? 0: 0.9"
             autoplay
      >
      </video>
      <div class="fixed top-0 left-0 flex justify-center items-center opacity-25 text-white bg-gray-700 rounded-br px-4 text-xl font-semibold">
        {{mainSource.name || mainSource.sender}}
      </div>
      <bottom-actions/>
    </template>

    <div class="fixed top-0 right-0 other-videos">
      <div v-for="(streamSource, index) in sourcesExceptMain"
           :key="index"
           @click="mainSource = streamSource"
           class="mr-2 mb-2 relative border-2 border-blue-700 rounded cursor-pointer">
        <div class="absolute top-0 left-0 flex justify-center items-center opacity-25 text-white bg-gray-700 rounded-br px-4 text-xl font-semibold">
          {{streamSource.name || streamSource.sender}}
        </div>
        <video :srcObject.prop="streamSource.stream"
               class="member-video"
               :class="{'publisher-video': mainSource.type === 'publisher'}"
               poster="https://cdn.pixabay.com/photo/2017/08/30/01/05/milky-way-2695569_960_720.jpg"
               :controls="false"
               :muted="mainSource.type === 'publisher'"
               :volume="mainSource.type === 'publisher' ? 0: 0.9"
               width="200"
               height="150"
               autoplay
        >
        </video>
      </div>
    </div>
  </div>
</template>
<script lang="ts">
  import Vue from 'vue'
  import {DeviceManager} from "../../../src";

  export default Vue.extend({
    props: {
      streamSources: {
        type: Array,
        default: () => []
      }
    },
    data() {
      return {
        mainSource: null
      }
    },
    computed: {
      sourcesExceptMain() {
        if (!this.mainSource) {
          return this.streamSources
        }
        return this.streamSources.filter(s => s.id !== this.mainSource.id)
      }
    },
    watch: {
      streamSources: {
        immediate: true,
        handler(newVal) {
          if (newVal.length > 0 && (!this.mainSource || this.mainSource.type == 'publisher' || newVal.length === 1)) {
            this.mainSource = this.streamSources.find(source => source.type === 'subscriber')
            if (!this.mainSource) {
              this.mainSource = this.streamSources.find(source => source.type === 'publisher')
            }
          } else if (newVal.length === 0 && this.mainSource) {
            DeviceManager.stopStreamTracks(this.mainSource.stream)
            this.mainSource = null
          }
        }
      }
    },
  })
</script>
<style>
  .main-video {
    min-width: 100%;
    height: 100%;
  }
  .conference-content {
    height: calc(100% - 80px);
  }
  .other-videos {
    max-height: 100vh;
    overflow-y: auto;
  }
  .member-video {
    min-height: 150px;
    object-fit: cover;
  }
</style>
