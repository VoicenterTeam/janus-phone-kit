<template>
  <div :class="{'conference-content fixed top-0 left-0 w-screen z-50 bg-black': mainSource}">
    <template v-if="mainSource">
<!--      <div class="w-3/4 flex">
        <div class="w-1/2">
          <video :srcObject.prop="mainSource.stream"
                 id="main-video-id"
                 class="main-video"
                 :class="{'publisher-video': mainSource.type === 'publisher'}"
                 :controls="false"
                 :muted="mainSource.type === 'publisher'"
                 :volume="mainSource.type === 'publisher' ? 0: 0.9"
                 autoplay
          >
          </video>
        </div>
        <div id="main-video-container" class="w-1/2">
          <canvas id="drawingCanvas"></canvas>
          <canvas id="compositeCanvas"></canvas>
        </div>
      </div>-->
      <video :srcObject.prop="mainSource.stream"
             class="main-video"
             :class="{'publisher-video': mainSource.type === 'publisher'}"
             :controls="false"
             :muted="mainSource.type === 'publisher'"
             :volume="mainSource.type === 'publisher' ? 0: 0.9"
             autoplay
      >
      </video>
      <div class="fixed top-0 left-0 flex justify-center items-center bg-opacity-25 bg-gray-700 rounded-br px-4 text-xl font-semibold">
        <div v-if="mainSource.state.audio === false" class="mr-2">
          <el-tooltip placement="top" content="Muted">
            <mic-off-icon class="w-5 h-5 text-red-500"></mic-off-icon>
          </el-tooltip>
        </div>
        <div class="text-gray-100">
          {{mainSource.name || mainSource.sender}}
        </div>
      </div>
      <client-only>
        <bottom-actions @update-publisher-stream="onUpdatePublisherStream"/>
      </client-only>
    </template>

    <div class="fixed top-0 right-0 other-videos">
      <div v-for="(streamSource, index) in sourcesExceptMain"
           :key="index"
           @click="mainSource = streamSource"
           class="mr-2 mb-2 relative border-2 border-blue-700 rounded cursor-pointer">
        <video :srcObject.prop="streamSource.stream"
               class="member-video"
               :class="{'publisher-video': streamSource.type === 'publisher'}"
               poster="https://cdn.pixabay.com/photo/2017/08/30/01/05/milky-way-2695569_960_720.jpg"
               :controls="false"
               :muted="streamSource.type === 'publisher'"
               :volume="streamSource.type === 'publisher' ? 0: 0.9"
               width="200"
               height="150"
               autoplay
        >
        </video>
        <div class="absolute top-0 left-0 flex justify-center items-center bg-opacity-25 bg-gray-700 rounded-br px-4 text-xl font-semibold z-10">
          <div v-if="streamSource.state.audio === false" class="mr-2">
            <el-tooltip placement="top" content="Muted">
              <mic-off-icon class="w-5 h-5 text-red-500"></mic-off-icon>
            </el-tooltip>
          </div>
          <div class="text-gray-100">
            {{streamSource.name || streamSource.sender}}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script lang="ts">
  import Vue from 'vue'
  import { MicOffIcon } from 'vue-feather-icons'
  import { Tooltip } from 'element-ui'
  import 'element-ui/packages/theme-chalk/lib/tooltip.css'
  import {DeviceManager} from "../../../src";

  export default Vue.extend({
    components: {
      MicOffIcon,
      [Tooltip.name]: Tooltip,
    },
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
    methods: {
      onUpdatePublisherStream(newStream) {
        const streamSource = this.streamSources.find(source => source.type === 'publisher')
        if (!streamSource) {
          return
        }
        streamSource.stream = newStream
      }
    },
    watch: {
      streamSources: {
        immediate: true,
        handler(newVal) {
          const talkingStream = newVal.find(source => source.state && source.state.isTalking)
          if (newVal.length > 0 && (!this.mainSource || this.mainSource.type == 'publisher' || newVal.length === 1)) {
            this.mainSource = this.streamSources.find(source => source.type === 'subscriber')
            if (!this.mainSource) {
              this.mainSource = this.streamSources.find(source => source.type === 'publisher')
            }
          } else if (talkingStream) {
            this.mainSource = talkingStream
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
  /*#main-video-container {
    position: relative;
  }
  #drawingCanvas {
    position: absolute;
    top: 0;
    left: 0;
  }

  #compositeCanvas {
    position: absolute;
    top: 0;
    left: 0;
  }

  .canvas-container {
    z-index: 11;
  }*/
</style>
