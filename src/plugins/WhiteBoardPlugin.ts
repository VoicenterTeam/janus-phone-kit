// @ts-nocheck

import Konva from "konva";
import {randomString} from "../util/util";
import {logger} from "../util/logger";
import {BasePlugin} from "./BasePlugin";
import {v4 as uuidv4} from 'uuid';
import {StunServer} from "../types";

export class WhiteBoardPlugin extends BasePlugin {
  private visualizationConfig = {}
  private rafId: number | null = null
  private video: HTMLVideoElement | null = null
  private wrapperEl: HTMLDivElement | null = null
  private initialStream: MediaStream | null = null
  rtcConnection: any = null
  name = 'janus.plugin.videoroomjs'
  stunServers: StunServer[]

  VideoRoomPlugin = null
  //ScreenSharePlugin = null

  constructor(options: any = {}) {
    super()

    const video = document.createElement('video');
    video.setAttribute("id", 'whiteboard-source-video')
    video.setAttribute("autoplay", '')
    // Uncomment to flip horizontally as the image from camera is mirrored.
    /*video.style.setProperty('-webkit-transform', 'scaleX(-1)')
    video.style.setProperty('transform', 'scaleX(-1)')*/
    video.style.setProperty('visibility', 'hidden')
    video.style.setProperty('width', 'auto')
    video.style.setProperty('height', 'auto')
    this.video = video

    /*const canvas = document.createElement('canvas')
    canvas.setAttribute('id', 'whiteboard-output-canvas')
    canvas.style.setProperty('visibility', 'hidden')
    this.canvas = canvas*/

    const divWrapper = document.createElement('div')
    divWrapper.classList.add('whiteboard-wrapper')
    divWrapper.style.setProperty('display', 'none')
    divWrapper.appendChild(video)
    //divWrapper.appendChild(canvas)
    this.wrapperEl = divWrapper

    document.body.appendChild(divWrapper)

    this.rtcConnection = new RTCPeerConnection({
      iceServers: this.stunServers,
    });
    // Send ICE events to Janus.
    this.rtcConnection.onicecandidate = (event) => {

      if (this.rtcConnection.signalingState !== 'stable') {
        return;
      }
      this.sendTrickle(event.candidate || null)
        .catch((err) => {
          logger.warn(err)
        });
    };

    this.room_id = options.roomId
    this.VideoRoomPlugin = options.videoRoomPlugin
    //this.ScreenSharePlugin = options.screenSharePlugin

    this.stunServers = options.stunServers
    this.opaqueId = `videoroomtest-${randomString(12)}`;
  }

  async receive(msg) {
    // const that = this;
    logger.info('on receive ScreenSharePlugin', msg);
    if (msg.plugindata && msg.plugindata.data.error_code) {
      logger.error('plugindata.data ScreenSharePlugin error :', msg.plugindata.data);
    } else if (msg.plugindata && msg.plugindata.data.videoroom === 'joined') {
      logger.info('Self Joiend event ', msg.plugindata.data.id);

      // TODO a plugin shouldn't depend on another plugin
      if (this.VideoRoomPlugin) {
        logger.info('VideoRoomPlugin ', this.VideoRoomPlugin);
        this.VideoRoomPlugin.myFeedList.push(msg.plugindata.data.id);
      }
    }
    logger.info('Received  message from Janus ScreenSharePlugin', msg);
  }

  async onAttached() {
    const wrapperEl = document.getElementById('presentation-video-container')
    // console.log('wrapperEl', wrapperEl)


    let width = wrapperEl.clientWidth;
    let height = wrapperEl.clientHeight //- 55;//25;

    // first we need Konva core things: stage and layer
    let stage = new Konva.Stage({
      container: 'presentationCanvasWrapper',
      width: width,
      height: height,
    });

    let layer = new Konva.Layer();
    stage.add(layer);

    // Create a white background rectangle
    let backgroundRect = new Konva.Rect({
      width: width,
      height: height,
      fill: 'white', // Set the fill color to white
    });
    layer.add(backgroundRect);

    let isPaint = false;
    let mode = 'brush';
    let lastLine;

    stage.on('mousedown touchstart', function (e) {
      isPaint = true;
      let pos = stage.getPointerPosition();
      lastLine = new Konva.Line({
        stroke: '#df4b26',
        strokeWidth: 5,
        globalCompositeOperation:
          mode === 'brush' ? 'source-over' : 'destination-out',
        // round cap for smoother lines
        lineCap: 'round',
        lineJoin: 'round',
        // add point twice, so we have some drawings even on a simple click
        points: [pos.x, pos.y, pos.x, pos.y],
      });
      layer.add(lastLine);
    });

    stage.on('mouseup touchend', function () {
      isPaint = false;
    });

    // and core function - drawing
    stage.on('mousemove touchmove', function (e) {
      if (!isPaint) {
        return;
      }

      // prevent scrolling on touch devices
      e.evt.preventDefault();

      const pos = stage.getPointerPosition();
      let newPoints = lastLine.points().concat([pos.x, pos.y]);
      lastLine.points(newPoints);
    });

    /*let select = document.getElementById('tool');
    select.addEventListener('change', function () {
      mode = select.value;
    });*/

    const container = document.getElementById('presentationCanvasWrapper')
    const canvas = container.querySelector('canvas')

    const presentationCtx = canvas.getContext("2d");
    //presentationCtx.fillStyle = "white";
    function draw() {
      // Draw the video frame
      //compositeCtx.drawImage(screenVideo, 0, 0, compositeCanvas.width, compositeCanvas.height);

      // Draw the drawing canvas
      //presentationCtx.drawImage(canvas, 0, 0, compositeCanvas.width, compositeCanvas.height);
      presentationCtx.fillRect(0,0,1,1)

      requestAnimationFrame(draw);
    }

    draw();

    const presentationCanvasStream = canvas.captureStream(30); // 30 FPS

    const joinResult = await this.sendMessage({
      request: 'join',
      room: this.room_id,
      ptype: 'publisher',
      display: 'Screen Share',
      opaque_id: this.opaqueId,
    });

    this.session.emit('member:join', {
      stream: presentationCanvasStream,
      joinResult,
      sender: 'me',
      type: 'publisher',
      name: 'Screen Share',
      //clientID: this.clientID,
      state: {},
      id: uuidv4(),
    })

    //this.session.emit('screenShare:start')

    logger.info('Adding local user media to RTCPeerConnection.');
    //this.rtcConnection.addStream(compositeStream); //(localMedia); //compositeStream
    presentationCanvasStream.getTracks().forEach(track => {
      this.rtcConnection.addTrack(track, presentationCanvasStream);
    });
    logger.info('Creating SDP offer. Please wait...');

    const options: any = {
      audio: false,
      video: true,
    }
    const jsepOffer = await this.rtcConnection.createOffer(options);


    logger.info('SDP offer created.');

    logger.info('Setting SDP offer on RTCPeerConnection');
    await this.rtcConnection.setLocalDescription(jsepOffer);

    logger.info('Getting SDP answer from Janus to our SDP offer. Please wait...');

    const confResult = await this.sendMessage({ request: 'configure', audio: false, video: true }, jsepOffer);
    logger.info('Received SDP answer from Janus for ScreenShare.', confResult);
    logger.debug('Setting the SDP answer on RTCPeerConnection. The `onaddstream` event will fire soon.');
    await this.rtcConnection.setRemoteDescription(confResult.jsep);
  }

  stopPresentationWhiteboard() {
    this.session.emit('screenShare:stop')
  }

  /**
   * Starts stream processing to add mask effect for it
   * @param {MediaStream} stream
   * @return {MediaStream} processed stream with mask effect
   */
  async start(stream) {
    // console.log('memberList', this.ScreenSharePlugin.memberList)
    this.initialStream = stream
    this.video.srcObject = stream
    const wrapperEl = document.getElementById('screen-share-video-container')
    console.log('wrapperEl', wrapperEl)


    let width = wrapperEl.clientWidth;
    let height = wrapperEl.clientHeight - 55;//25;

    // first we need Konva core things: stage and layer
    let stage = new Konva.Stage({
      container: 'container',
      width: width,
      height: height,
    });

    let layer = new Konva.Layer();
    stage.add(layer);

    let isPaint = false;
    let mode = 'brush';
    let lastLine;

    stage.on('mousedown touchstart', function (e) {
      isPaint = true;
      let pos = stage.getPointerPosition();
      lastLine = new Konva.Line({
        stroke: '#df4b26',
        strokeWidth: 5,
        globalCompositeOperation:
          mode === 'brush' ? 'source-over' : 'destination-out',
        // round cap for smoother lines
        lineCap: 'round',
        lineJoin: 'round',
        // add point twice, so we have some drawings even on a simple click
        points: [pos.x, pos.y, pos.x, pos.y],
      });
      layer.add(lastLine);
    });

    stage.on('mouseup touchend', function () {
      isPaint = false;
    });

    // and core function - drawing
    stage.on('mousemove touchmove', function (e) {
      if (!isPaint) {
        return;
      }

      // prevent scrolling on touch devices
      e.evt.preventDefault();

      const pos = stage.getPointerPosition();
      let newPoints = lastLine.points().concat([pos.x, pos.y]);
      lastLine.points(newPoints);
    });

    /*let select = document.getElementById('tool');
    select.addEventListener('change', function () {
      mode = select.value;
    });*/

    const container = document.getElementById('container')
    const canvas = container.querySelector('canvas')
    //const canvasStream = canvas.captureStream(30);

    const compositeCanvas = document.getElementById("compositeCanvas") as HTMLCanvasElement
    const compositeCtx = compositeCanvas.getContext("2d");

    // Set dimensions similar to the drawing canvas or screen capture
    compositeCanvas.width = width; // window.innerWidth;
    compositeCanvas.height = height; // window.innerHeight;

    const screenVideo = this.video //document.getElementById('main-video-id') as HTMLVideoElement

    function draw() {
      // Draw the video frame
      compositeCtx.drawImage(screenVideo, 0, 0, compositeCanvas.width, compositeCanvas.height);

      // Draw the drawing canvas
      compositeCtx.drawImage(canvas, 0, 0, compositeCanvas.width, compositeCanvas.height);

      requestAnimationFrame(draw);
    }

    draw();

    const compositeStream = compositeCanvas.captureStream(30); // 30 FPS
    return compositeStream
  }

  /**
   * Stops stream processing
   */
  stop() {
    const stream = this.initialStream
    this.initialStream = null
    return stream
    //const screenVideo = document.getElementById('main-video-id') as HTMLVideoElement
    /*if (screenVideo) {
      const stream = screenVideo.captureStream()
      return stream
    }*/
  }
}
