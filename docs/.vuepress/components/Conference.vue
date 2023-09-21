<template>
  <div :class="{'conference-content fixed top-0 left-0 w-screen z-50 bg-black': mainSource}">
    <template v-if="mainSource">
<!--      <div class="flex">
        <div class="w-1/2">-->
          <video :srcObject.prop="mainSource.stream"
                 v-if="!isScreenShareWhiteboardEnable && !isPresentationWhiteboardEnable && !isImageWhiteboardEnable"
                 id="main-video-id"
                 class="main-video"
                 :class="{'publisher-video': mainSource.type === 'publisher' /*&& mainSource.name !== 'Screen Share'*/}"
                 :controls="false"
                 :muted="mainSource.type === 'publisher'"
                 :volume="mainSource.type === 'publisher' ? 0: 0.9"
                 autoplay
          >
          </video>
<!--        </div>-->
<!--        </div>-->
<!--        <div class="w-1/2">-->
          <div v-else-if="isScreenShareWhiteboardEnable"
               id="screen-share-video-container"
               class="main-video flex justify-center"
          >
  <!--          <canvas id="drawingCanvas"></canvas>-->
            <div id="composite-canvas-container" class="relative">
              <canvas id="composite-canvas"></canvas>
            </div>
            <div id="container" class="flex items-center"></div>
          </div>

          <div v-else-if="isPresentationWhiteboardEnable || isImageWhiteboardEnable"
               id="presentation-video-container"
               class="main-video"
          >
            <!--          <canvas id="drawingCanvas"></canvas>-->
<!--            <canvas id="presentationCanvas"></canvas>-->
            <div id="presentationCanvasWrapper"></div>
          </div>
<!--        </div>
      </div>-->
<!--        <div class="w-1/3">
          <video id="screen-share-video"
                 class="main-video"
                 :controls="false"
                 autoplay
          >
          </video>
        </div>
      </div>-->
<!--      <video :srcObject.prop="mainSource.stream"
             class="main-video"
             :class="{'publisher-video': mainSource.type === 'publisher'}"
             :controls="false"
             :muted="mainSource.type === 'publisher'"
             :volume="mainSource.type === 'publisher' ? 0: 0.9"
             autoplay
      >
      </video>-->
      <div class="fixed top-0 left-0 flex justify-center items-center bg-opacity-25 bg-gray-700 rounded-br px-4 text-xl font-semibold">
        <div v-if="mainSource.state.audio === false" class="mr-2">
          <el-tooltip placement="top" content="Muted">
              <vue-feather type="mic-off" class="w-5 h-5 text-red-500" />
          </el-tooltip>
        </div>
        <div class="text-gray-100">
          {{mainSource.name || mainSource.sender}}
        </div>
      </div>
      <client-only>
        <bottom-actions
          @update-publisher-stream="onUpdatePublisherStream"
          @enable-whiteboard="enableWhiteboard"
          @enable-presentation-whiteboard="enablePresentationWhiteboard"
          @enable-image-whiteboard="enableImageWhiteboard"
          @enable-screen-sharing="enableScreenShare"
        />
      </client-only>
    </template>

    <div class="fixed top-0 right-0 other-videos">
      <div v-for="(streamSource, index) in sourcesExceptMain"
           :key="index"
           @click="mainSource = streamSource"
           class="mr-2 mb-2 relative border-2 border-blue-700 rounded cursor-pointer">
        <video :srcObject.prop="streamSource.stream"
               class="member-video"
               :class="{'publisher-video': streamSource.type === 'publisher'/*&& streamSource.name !== 'Screen Share'*/}"
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
                <vue-feather type="mic-off" class="w-5 h-5 text-red-500" />
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
  import { defineComponent } from 'vue'
  import {DeviceManager} from "../../../src";
  import {CONFERENCING_MODE} from "../../../src/enum/conferencing.enum";
  import VueFeather from 'vue-feather'

  export default defineComponent({
    components: {
      VueFeather
    },
    props: {
      streamSources: {
        type: Array,
        default: () => []
      }
    },
    data() {
      return {
        mainSource: null,
        isScreenShareWhiteboardEnable: false,
        isPresentationWhiteboardEnable: false,
        isImageWhiteboardEnable: false
      }
    },
    computed: {
      sourcesExceptMain() {
        if (!this.mainSource) {
          return this.streamSources
        }
        const scs = this.streamSources.filter(s => s.id !== this.mainSource.id)
        console.log('sourcesExceptMain', scs)
        return scs
      }
    },
    methods: {
      onUpdatePublisherStream(newStream) {
        const streamSource = this.streamSources.find(source => source.type === 'publisher' && source.name !== 'Screen Share')
        if (!streamSource) {
          return
        }
        streamSource.stream = newStream
      },
      async enableWhiteboard(enable) {
        this.isScreenShareWhiteboardEnable = enable

        await this.$nextTick()
        if (enable) {
          let sharingSource
          if (this.mainSource.type === 'publisher' && this.mainSource.name === 'Screen Share') {
            sharingSource = this.mainSource
          } else {
            sharingSource = this.streamSources.find(source => source.type === 'publisher' && source.name === 'Screen Share')
          }
          window.PhoneKit.enableWhiteboard(enable, sharingSource.stream)
        } else {
          window.PhoneKit.enableWhiteboard(enable)
        }
      },
      async enableScreenShare(enable) {
        if (enable) {
          await window.PhoneKit.startScreenShare()
        } else {
          if (this.isScreenShareWhiteboardEnable) {
            await this.enableWhiteboard(false)
          }
          window.PhoneKit.stopScreenShare()
        }
      },
      enablePresentationWhiteboard(enable) {
        this.isPresentationWhiteboardEnable = enable
        this.$nextTick(() => {
          window.PhoneKit.enablePresentationWhiteboard(CONFERENCING_MODE.WHITEBOARD, enable)
        })
      },
      enableImageWhiteboard (enable) {
        this.isImageWhiteboardEnable = enable
        this.$nextTick(() => {
          window.PhoneKit.enablePresentationWhiteboard(CONFERENCING_MODE.IMAGE_WHITEBOARD, enable)
        })
      },
      selectMainSource(streamSource) {
        if (!this.isScreenShareWhiteboardEnable) {
          this.mainSource = streamSource
        }
      },
      async addScreenTrack(track) {
        //console.log('screenStream', track)
        const screenStream = new MediaStream([track]);
        //this.mainSource.stream = screenStream
        //const videoElement = document.getElementById('screen-share-video') as HTMLVideoElement

        //videoElement.srcObject = screenStream //new MediaStream([track]);
      }
    },
    watch: {
      streamSources: {
        immediate: true,
        handler(newVal, oldVal) {
          console.log('watch newVal', JSON.stringify(newVal))
          console.log('watch oldVal', JSON.stringify(oldVal))
          const newParticipant = newVal.find((newSource) => !oldVal.some((oldSource) => oldSource.id === newSource.id))
          console.log('newParticipant', newParticipant)
          const talkingStream = newVal.find(source => source.state && source.state.isTalking)
          if (newVal.length > 0 && newParticipant && newParticipant.name === 'Screen Share') {
            this.mainSource = newParticipant
          } else if (newVal.length > 0 && (!this.mainSource || this.mainSource.type == 'publisher'/* && this.mainSource.name !== 'Screen Share'*/ || newVal.length === 1)) {
            this.mainSource = this.streamSources.find(source => source.type === 'subscriber')
            if (!this.mainSource) {
              this.mainSource = this.streamSources.find(source => source.type === 'publisher' /*&& source.name !== 'Screen Share'*/)
            }
          } else if (talkingStream) {
            this.mainSource = talkingStream
          } else if (newVal.length === 0 && this.mainSource) {
            DeviceManager.stopStreamTracks(this.mainSource.stream)
            this.mainSource = null
          }
        }
      },
      mainSource: {
        deep: true,
        handler(newV) {
          console.log('watch mainSource', JSON.stringify(newV))
        }
      }
    },
    mounted() {
      /*setTimeout(() => {
        this.addScreenTrack()
      }, 10000)*/

    }
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
  #screen-share-video-container {
    position: relative;
  }
  /*#drawingCanvas {
    position: absolute;
    top: 0;
    left: 0;
  }*/
  #container canvas {
    position: absolute;
    top: 0;
    left: 0;
  }

  #composite-canvas-container {
    margin: auto 0;
  }

  #composite-canvas {
    position: absolute;
    top: 0;
    left: 0;
  }

  #container {
    z-index: 11;
  }

  .video-hidden {
    /*position: absolute;
    z-index: 1;*/
    //visibility: hidden;
    /*left: -9999px;
    top: -9999px;*/
  }
</style>
