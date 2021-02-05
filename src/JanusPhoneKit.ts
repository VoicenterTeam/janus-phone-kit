import 'webrtc-adapter'
import Session from "./Session";
import {logger} from './util/logger'
import {VideoRoomPlugin} from "./plugins/VideoRoomPlugin";
import {ScreenSharePlugin} from "./plugins/ScreenSharePlugin";
import EventEmitter from "./util/EventEmitter";
import {StunServer} from "./types";

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
      logger.info(`screenSharePlugin plugin attached with handle/ID ${this.screenSharePlugin.id}`);
    } catch (err) {
      logger.error('Error during attaching of screenShare plugin', err);
    }
  }

  public async sendStateMessage(data = {}) {
    await this.videoRoomPlugin.sendStateMessage(data)
  }

  public async setSubstream(n) {
    let sessionIds = Object.keys(this.videoRoomPlugin.memberList);
    for (let i = 0; i < sessionIds.length; i++) {
      console.log(this.videoRoomPlugin.memberList[i]);
      this.videoRoomPlugin.sendMessage({
        request: "configure",
        substream: n,
        subId: parseInt(sessionIds[i])
      });
    }
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
