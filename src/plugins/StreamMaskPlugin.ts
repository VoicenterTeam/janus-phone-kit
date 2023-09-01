// @ts-nocheck
import '@tensorflow/tfjs-backend-webgl';

import * as mpSelfieSegmentation from '@mediapipe/selfie_segmentation'
import * as tfjsWasm from '@tensorflow/tfjs-backend-wasm'
import { setBackendAndEnvFlags } from '../util/tfjsBackendAndEnvFlags'

tfjsWasm.setWasmPaths(
  `https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-backend-wasm@${
    tfjsWasm.version_wasm}/dist/`)

import * as bodySegmentation from '@tensorflow-models/body-segmentation'

import { Camera } from '../util/Camera'
import { mergeConfig } from '../util/util'
import {
  CAMERA_CONFIG,
  ENV_FLAGS,
  SEGMENTER_CONFIG,
  VISUALIZATION_CONFIG
} from "../enum/tfjs.config.enum"

export class StreamMaskPlugin {
  private visualizationConfig
  private rafId: number | null = null
  private segmenter: any = null
  private camera
  private canvas
  private ctx

  constructor(options: any = {}) {
    this.visualizationConfig = mergeConfig(VISUALIZATION_CONFIG, options.visualizationConfig)

    this.canvas = document.createElement('canvas')
    this.ctx = this.canvas.getContext('2d')
  }

  /**
   * Starts stream processing to add mask effect for it
   * @param {MediaStream} stream
   * @return {MediaStream} processed stream with mask effect
   */
  async start(stream) {
    this.camera = await Camera.setupCamera(stream)
    this.canvas.width = this.camera.canvas.width
    this.canvas.height = this.camera.canvas.height

    await setBackendAndEnvFlags(ENV_FLAGS)

    this.segmenter = await this.createSegmenter()

    this.renderPrediction()

    const canvasStream = this.canvas.captureStream(CAMERA_CONFIG.targetFPS)
    return canvasStream
  }

  /**
   * Stops stream processing
   */
  stop() {
    if (this.rafId) {
      window.cancelAnimationFrame(this.rafId)
      this.rafId = null
    }
    if (this.segmenter) {
      this.segmenter.dispose()
      this.segmenter = null
    }

    if (this.camera) {
      this.camera.cleanCamera()
    }
  }

  /**
   * Starts rendering process by calling itself recursively.
   * Uses requestAnimationFrame method for recursive invoking.
   */
  async renderPrediction() {
    await this.renderResult()
    this.rafId = requestAnimationFrame(this.renderPrediction.bind(this))
  }

  /**
   * Creates Body Segmenter which is used for people segmentation and poses estimation
   * @return {segmenter} segmenter instance
   */
  async createSegmenter() {
    return bodySegmentation.createSegmenter(bodySegmentation.SupportedModels.MediaPipeSelfieSegmentation, {
      runtime: SEGMENTER_CONFIG.runtime,
      modelType: SEGMENTER_CONFIG.modelType,
      solutionPath:
        `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation@${
          mpSelfieSegmentation.VERSION}`
    })
  }

  /**
   * Render function which draws masked effect to canvas.
   */
  async renderResult() {
    // ReadyState >= 2 means that video data is ready to be played
    if (this.camera.video.readyState < 2) {
      await new Promise((resolve) => {
        this.camera.video.onloadeddata = () => {
          resolve(this.camera.video);
        }
      })
    }

    let segmentation = null

    /* Segmenter can be null if initialization failed (for example when loading
    from a URL that does not exist). */

    if (this.segmenter != null) {
      /* Detectors can throw errors, for example when using custom URLs that
      contain a model that doesn't provide the expected output. */

      try {
        if (this.segmenter.segmentPeople != null) {
          segmentation = await this.segmenter.segmentPeople(this.camera.video, {
            flipHorizontal: false,
            multiSegmentation: false,
            segmentBodyParts: true,
            segmentationThreshold: this.visualizationConfig.foregroundThreshold
          })
        } else {
          segmentation = await this.segmenter.estimatePoses(
            this.camera.video, {flipHorizontal: false})
          segmentation = segmentation.map(
            singleSegmentation => singleSegmentation.segmentation)
        }
      } catch (error) {
        this.segmenter.dispose()
        this.segmenter = null
        alert(error)
      }

      /* Code in node_modules/@mediapipe/selfie_segmentation/selfie_segmentation.js
      must be modified to expose the webgl context it uses. */

      const gl = window.exposedContext
      if (gl)
        gl.readPixels(
          0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(4))
    }

    /* The null check makes sure the UI is not in the middle of changing to a
    different model. If during model change, the result is from an old model,
    which shouldn't be rendered. */

    if (segmentation && segmentation.length > 0) {
      const options = this.visualizationConfig

      await bodySegmentation.drawBokehEffect(
        this.canvas, this.camera.video, segmentation, options.foregroundThreshold,
        options.backgroundBlur, options.edgeBlur)
    }
    this.camera.drawToCanvas(this.canvas)
  }
}
