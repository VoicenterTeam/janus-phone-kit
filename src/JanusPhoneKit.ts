import Session from "./Session";
import { logger } from './util/logger'
import { VideoRoomPlugin } from "./plugins/VideoRoomPlugin";
import { ScreenSharePlugin } from "./plugins/ScreenSharePlugin";
import EventEmitter from "./util/EventEmitter";

type JanusPhoneKitOptions = {
  roomId?: number,
  url?: string,
}
const defaultOptions: JanusPhoneKitOptions = {
  roomId: null,
  url: null,
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

  joinConference(roomId, displayName = '') {
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

    this.registerSocketOpenHandler(displayName)
    this.registerSocketCloseHandler()

    return this.session
  }

  hangup() {
    this.session.emit('hangup')
    this.session.stop();
    this.isConnected = false
    this.websocket.close()
  }

  startVideo() {
    this.videoRoomPlugin?.startVideo()
  }

  stopVideo() {
    this.videoRoomPlugin?.stopVideo()
  }

  startAudio() {
    this.videoRoomPlugin?.startAudio()
  }

  stopAudio() {
    this.videoRoomPlugin?.stopAudio()
  }

  async startScreenShare() {
    if (!this.session.connected || this.screenSharePlugin) {
      return
    }
    this.screenSharePlugin = new ScreenSharePlugin();
    this.screenSharePlugin.room_id = this.options.roomId;
    this.screenSharePlugin.VideoRoomPlugin =  this.videoRoomPlugin;
    try {
      await this.session.attachPlugin(this.screenSharePlugin);
      logger.info(`screenSharePlugin plugin attached with handle/ID ${this.screenSharePlugin.id}`);
    } catch (err) {
      logger.error('Error during attaching of screenShare plugin', err);
    }
  }

  private registerSocketOpenHandler (displayName) {
    this.websocket.addEventListener('open', async () => {
      try {
        await this.session.create();
        logger.info(`Session with ID ${this.session.id} created.`);
      } catch (err) {
        logger.error('Error during creation of session', err);
        return;
      }

      this.videoRoomPlugin = new VideoRoomPlugin({
        displayName: displayName
      });
      if (this.options.roomId) {
        this.videoRoomPlugin.room_id = this.options.roomId;
      } else {
        this.options.roomId = this.videoRoomPlugin.room_id;
      }

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
