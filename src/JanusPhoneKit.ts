import 'webrtc-adapter'
import Session from "./Session";
import {logger} from './util/logger'
import {VideoRoomPlugin} from "./plugins/VideoRoomPlugin";
import {ScreenSharePlugin} from "./plugins/ScreenSharePlugin";
import EventEmitter from "./util/EventEmitter";
import {DeviceManager} from "./index";
import {StunServer} from "./types";
import JsSip from "./JsSip";

enum audioTypes {
  SIP = 'sip',
  JANUS = 'janus'
}
type JanusPhoneKitOptions = {
  roomId?: number,
  url?: string,
  stunServers?: StunServer[],
  audio?: string,
  jsSipConfig?: any
}
const defaultOptions: JanusPhoneKitOptions = {
  roomId: null,
  url: null,
  stunServers: [{urls: "stun:stun.l.google.com:19302"}],
  audio: audioTypes.JANUS,
  jsSipConfig: {}
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
  private jsSip = null
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

  private async tryInitJsSip() {
    if (this.options.audio === audioTypes.SIP) {
      const config = {
        ...this.options.jsSipConfig,
        roomId: this.options.roomId,
        session: this.session,
      }
      this.jsSip = new JsSip(config)
      await this.jsSip.register()
      setTimeout(() => {
        this.jsSip.startCall()
      }, 1000)
    }
  }

  public async joinRoom({roomId, displayName = ''}) {
    if (!this.options.url) {
      throw new Error('Could not create websocket connection because url parameter is missing')
    }
    this.options.roomId = roomId

    if (!this.options.roomId) {
      throw new Error('A roomId is required in order to join a room')
    }

    this.session = new Session()
    await this.tryInitJsSip()

    this.websocket = new WebSocket(this.options.url, 'janus-protocol');
    this.session.on('output', (msg) => {
      this.websocket.send(JSON.stringify(msg))
    });

    this.websocket.addEventListener('message', (event) => {
      this.session.receive(JSON.parse(event.data))
    });

    this.registerSocketOpenHandler(displayName)
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

  async changePublisherStream({videoInput, audioInput}) {
    const stream = await DeviceManager.getMediaFromInputs({videoInput, audioInput})
    this.videoRoomPlugin?.changePublisherStream(stream)
    return stream
  }

  public async startScreenShare() {
    if (!this.session.connected || this.screenSharePlugin) {
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

  private registerSocketOpenHandler(displayName) {
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
      });

      try {
        await this.session.attachPlugin(this.videoRoomPlugin);
        this.isConnected = true;
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
