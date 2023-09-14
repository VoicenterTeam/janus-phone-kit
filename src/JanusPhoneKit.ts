// @ts-ignore
import 'webrtc-adapter'
import Session from "./Session";
import {logger} from './util/logger'
import {VideoRoomPlugin} from "./plugins/VideoRoomPlugin";
import {ScreenSharePlugin} from "./plugins/ScreenSharePlugin";
import {WhiteBoardPlugin} from "./plugins/WhiteBoardPlugin";
import EventEmitter from "./util/EventEmitter";
import {StunServer} from "./types";
import {CONFERENCING_MODE, ConferencingModeType} from "./enum/conferencing.enum";

type JanusPhoneKitOptions = {
  roomId?: number,
  url?: string,
  stunServers?: StunServer[]
}
const defaultOptions: JanusPhoneKitOptions = {
  roomId: null,
  url: null,
  stunServers: [{urls: "stun:stun.l.google.com:19302"}]
}

export default class JanusPhoneKit extends EventEmitter {
  private options: JanusPhoneKitOptions = {}

  private session: Session = null
  /**
   * Websocket connection
   * @type {WebSocket}
   */
  private websocket = null
  /**
   * Video room plugin
   * @type {VideoRoomPlugin}
   */
  private videoRoomPlugin = null
  /**
   * Screen share plugin
   * @type {ScreenSharePlugin}
   */
  private screenSharePlugin = null

  private whiteboardPlugin = null

  isConnected = false

  constructor(options = {}) {
    super()
    this.options = {
      ...defaultOptions,
      ...options
    }
  }

  on(event, fn) {
    this.session.on(event, (...params) => {
      fn.apply(this, params)
    })
  }

  emit(...params) {
    this.session?.emit.apply(this, params)
  }

  public joinRoom({roomId, displayName = '', mediaConstraints}) {
    if (!this.options.url) {
      throw new Error('Could not create websocket connection because url parameter is missing')
    }
    this.options.roomId = roomId

    if (!this.options.roomId) {
      throw new Error('A roomId is required in order to join a room')
    }

    this.session = new Session()

    this.websocket = new WebSocket(this.options.url, 'janus-protocol');
    this.session.on('output', (msg) => {
      this.websocket.send(JSON.stringify(msg))
    });

    this.websocket.addEventListener('message', (event) => {
      this.session.receive(JSON.parse(event.data))
    });

    this.registerSocketOpenHandler(displayName, mediaConstraints)
    this.registerSocketCloseHandler()

    return this.session
  }

  public hangup() {
    this.session.emit('hangup')
    this.session.stop();
    this.isConnected = false
    this.websocket.close()
  }

  public startVideo() {
    this.videoRoomPlugin?.startVideo()
  }

  public stopVideo() {
    this.videoRoomPlugin?.stopVideo()
  }

  public enableMask(state: boolean) {
    return this.videoRoomPlugin?.enableMask(state)
  }

  public startAudio() {
    this.videoRoomPlugin?.startAudio()
  }

  public stopAudio() {
    this.videoRoomPlugin?.stopAudio()
  }

  public startNoiseFilter() {
    this.videoRoomPlugin?.startNoiseFilter();
  }

  public stopNoiseFilter() {
    this.videoRoomPlugin?.stopNoiseFilter();
  }

  public setBitrate(bitrate) {
    this.videoRoomPlugin?.setBitrate(bitrate);
    this.screenSharePlugin?.setBitrate(bitrate);
  }

  async changePublisherStream(newSource) {
    return this.videoRoomPlugin?.changePublisherStream(newSource);
  }

  public async enableWhiteboard(enable: boolean, stream?: MediaStream) {
    /*if (!this.whiteboardPlugin) {
      this.whiteboardPlugin = new WhiteBoardPlugin({
        roomId: this.options.roomId,
        videoRoomPlugin: this.videoRoomPlugin,
        stunServers: this.options.stunServers
      })
    }*/
    if (enable) {

      //const whiteBoardStream = await this.whiteboardPlugin?.startScreenShareWhiteboard(stream)

      const whiteBoardStream = await WhiteBoardPlugin.startScreenShareWhiteboard(stream)


      /*const senders = this.screenSharePlugin.rtcConnection.getSenders()
      senders.forEach((sender) => {
        sender.replaceTrack()
      })*/
      this.screenSharePlugin.overrideSenderTracks(whiteBoardStream)
      //console.log('SSSSSS senders', senders)
    } else {
      console.log('disable whiteboard')
      const initialStream = await WhiteBoardPlugin.stopScreenShareWhiteboard()
      this.screenSharePlugin.overrideSenderTracks(initialStream)
    }
  }

  public async enablePresentationWhiteboard(mode: ConferencingModeType, enable: boolean) {
    if (!this.whiteboardPlugin) {
      this.whiteboardPlugin = new WhiteBoardPlugin({
        mode: mode,
        roomId: this.options.roomId,
        videoRoomPlugin: this.videoRoomPlugin,
        stunServers: this.options.stunServers
      })
    }
    if (enable) {
      //const whiteBoardStream = await this.whiteboardPlugin?.startPresentationWhiteboard()
      /*const senders = this.screenSharePlugin.rtcConnection.getSenders()
      senders.forEach((sender) => {
        sender.replaceTrack()
      })*/
      await this.session.attachPlugin(this.whiteboardPlugin);

      //this.screenSharePlugin.overrideSenderTracks(whiteBoardStream)
      //console.log('SSSSSS senders', senders)
    } else {
      console.log('disable whiteboard')
      //const stream = await this.whiteboardPlugin?.stop()
      await this.whiteboardPlugin?.stopPresentationWhiteboard()
      this.whiteboardPlugin = null
      //let stream
      //this.screenSharePlugin.overrideSenderTracks(stream)
    }
  }

  public async startScreenShare() {
    if (!this.session.connected || this.screenSharePlugin && this.screenSharePlugin.rtcConnection) {
      return
    }

    this.screenSharePlugin = new ScreenSharePlugin({
      roomId: this.options.roomId,
      videoRoomPlugin: this.videoRoomPlugin,
      stunServers: this.options.stunServers,
    });

    try {
      await this.session.attachPlugin(this.screenSharePlugin);

      console.log('this.screenSharePlugin.rtcConnection', this.screenSharePlugin.rtcConnection)

      this.screenSharePlugin.rtcConnection.addEventListener("track", (event) => {
        const senders = this.screenSharePlugin.rtcConnection.getSenders()
        console.log('senders', senders)
        senders.forEach((sender) => {
          const track = sender.track;
          //const videoElement = document.getElementById('screen-share-video') as HTMLVideoElement
          //videoElement.srcObject = new MediaStream([track]);
          //this.session.emit('member:join')
          //cb(track)
          //console.log('Sender Track:', track);
        });
      });

      logger.info(`screenSharePlugin plugin attached with handle/ID ${this.screenSharePlugin.id}`);
    } catch (err) {
      logger.error('Error during attaching of screenShare plugin', err);
    }
  }

  public async sendStateMessage(data = {}) {
    await this.videoRoomPlugin.sendStateMessage(data)
  }

  public async syncParticipants() {
    await this.videoRoomPlugin?.syncParticipants();
  }

  private registerSocketOpenHandler(displayName, mediaConstraints) {
    this.websocket.addEventListener('open', async () => {
      try {
        await this.session.create();
        logger.info(`Session with ID ${this.session.id} created.`);
      } catch (err) {
        logger.error('Error during creation of session', err);
        return;
      }

      this.videoRoomPlugin = new VideoRoomPlugin({
        displayName: displayName,
        roomId: this.options.roomId,
        stunServers: this.options.stunServers,
        mediaConstraints,
      });

      try {
        await this.session.attachPlugin(this.videoRoomPlugin);
        this.isConnected = true;
        await this.syncParticipants();
        logger.info(`Echotest plugin attached with handle/ID ${this.videoRoomPlugin.id}`);
      } catch (err) {
        logger.error('Error during attaching of plugin', err);
      }
    })
  };

  private registerSocketCloseHandler() {
    this.websocket.addEventListener('close', () => {
      this.isConnected = false;
      logger.warn('No connection to Janus');

      this.session.stop();
    })
  };

}
