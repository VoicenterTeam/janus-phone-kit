// @ts-nocheck

import * as params from './shared/params';
import {isMobile} from './shared/util';

/*async function getDeviceIdForLabel(cameras, cameraLabel) {
  for (let i = 0; i < cameras.length; i++) {
    const camera = cameras[i];
    if (camera.label === cameraLabel) {
      return camera.deviceId;
    }
  }

  return null;
}*/

export class Camera {
  constructor() {
    this.video = document.getElementById('video');
    // TODO: use this code
    /*const video = document.createElement('video');
    video.setAttribute("id", "video");
    video.setAttribute("playsinline", "");
    video.style.setProperty('-webkit-transform', 'scaleX(-1)');
    video.style.setProperty('transform', 'scaleX(-1)');
    video.style.setProperty('visibility', 'hidden');
    video.style.setProperty('width', 'auto');
    video.style.setProperty('height', 'auto');
    this.video = video*/


    this.canvas = document.getElementById('output');
    // TODO: use this code
    /*const canvas = document.createElement('canvas');
    video.setAttribute("id", "output");
    this.canvas = canvas

    const divWrapper = document.createElement('div');
    divWrapper.classList.add('canvas-wrapper');
    divWrapper.appendChild(video)
    divWrapper.appendChild(canvas)*/

    this.ctx = this.canvas.getContext('2d');
  }

  /**
   * Initiate a Camera instance and wait for the camera stream to be ready.
   * @param cameraParam From app `STATE.camera`.
   */
  static async setupCamera(cameraParam, stream) {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error(
        'Browser API navigator.mediaDevices.getUserMedia not available');
    }

    /*const {targetFPS, sizeOption, cameraSelector} = cameraParam;
    const $size = params.VIDEO_SIZE[sizeOption];
    const deviceId = 'default' //await getDeviceIdForLabel(cameras, cameraSelector);
    const videoConfig = {
      'audio': false,
      'video': {
        deviceId,
        // Only setting the video to a specified size for large screen, on
        // mobile devices accept the default size.
        width: isMobile() ? params.VIDEO_SIZE['360 X 270'].width : $size.width,
        height: isMobile() ? params.VIDEO_SIZE['360 X 270'].height :
          $size.height,
        frameRate: {
          ideal: targetFPS,
        }
      }
    };*/

    //const stream = await navigator.mediaDevices.getUserMedia(videoConfig);

    const camera = new Camera();
    camera.video.srcObject = stream;

    await new Promise((resolve) => {
      camera.video.onloadedmetadata = () => {
        resolve(camera.video); // video // camera.video
      };
    });

    camera.video.play();

    const videoWidth = camera.video.videoWidth;
    const videoHeight = camera.video.videoHeight;
    // Must set below two lines, otherwise video element doesn't show.
    camera.video.width = videoWidth;
    camera.video.height = videoHeight;

    camera.canvas.width = videoWidth;
    camera.canvas.height = videoHeight;
    const canvasContainer = document.querySelector('.canvas-wrapper');
    canvasContainer.style = `width: ${videoWidth}px; height: ${videoHeight}px`;

    // Because the image from camera is mirrored, need to flip horizontally.
    camera.ctx.translate(camera.video.videoWidth, 0);
    camera.ctx.scale(-1, 1);

    return camera;
  }

  drawToCanvas(canvas) {
    this.ctx.drawImage(
      canvas, 0, 0, this.video.videoWidth, this.video.videoHeight);
  }

  drawFromVideo(ctx) {
    ctx.drawImage(
      this.video, 0, 0, this.video.videoWidth, this.video.videoHeight);
  }

  clearCtx() {
    this.ctx.clearRect(0, 0, this.video.videoWidth, this.video.videoHeight);
  }
}
