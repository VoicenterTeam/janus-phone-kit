import Session from "./Session";
import { logger } from './util/logger'
import { VideoRoomPlugin } from "./plugins/VideoRoomPlugin";
import { ScreenSharePlugin } from "./plugins/ScreenSharePlugin";

type JanusPhoneKitOptions = {
  roomId?: number,
  url?: string,
}
const defaultOptions: JanusPhoneKitOptions = {
  roomId: null,
  url: null,
}

export default class JanusPhoneKit {
  #options: JanusPhoneKitOptions = {}

  #session: Session = null
  /**
   * Websocket connection
   * @type {WebSocket}
   */
  #websocket = null
  /**
   * Video room plugin
   * @type {VideoRoomPlugin}
   */
  #videoRoomPlugin = null
  /**
   * Screen share plugin
   * @type {ScreenSharePlugin}
   */
  #screenSharePlugin = null

  isConnected = false

  constructor(options = {}) {
    this.#options = {
      ...defaultOptions,
      ...options
    }
  }

  startVideoConference() {
    if (!this.#options.url) {
      throw new Error('Could not create websocket connection because url parameter is missing')
    }
    this.#session = new Session()

    this.#websocket = new WebSocket(this.#options.url, 'janus-protocol');
    this.#session.on('output', (msg) => {
      debugger
      this.#websocket.send(JSON.stringify(msg))
    });
    // Incoming communications from Janus.
    this.#websocket.addEventListener('message', (event) => {
      this.#session.receive(JSON.parse(event.data))
    });

    this.#registerSocketOpenHandler()
    this.#registerSocketCloseHandler()
  }

  async startScreenShare() {
    if (!this.#session.connected || this.#screenSharePlugin) {
      return
    }
    console.log("Start to load screen share ...");
    this.#screenSharePlugin = new ScreenSharePlugin();
    this.#screenSharePlugin.room_id = this.#options.roomId;
    this.#screenSharePlugin.VideoRoomPlugin =  this.#videoRoomPlugin;
    try {
      await this.#session.attachPlugin(this.#screenSharePlugin);
      logger.info(`screenSharePlugin plugin attached with handle/ID ${this.#screenSharePlugin.id}`);
      console.log(`screenSharePlugin plugin attached with handle/ID ${this.#screenSharePlugin.id}`)
    } catch (err) {
      logger.error('Error during attaching of screenShare plugin', err);
    }
  }

  #registerSocketOpenHandler = () => {
    this.#websocket.addEventListener('open', async () => {
      try {
        await this.#session.create();
        logger.info(`Session with ID ${this.#session.id} created.`);
      } catch (err) {
        logger.error('Error during creation of session', err);
        return;
      }

      this.#videoRoomPlugin = new VideoRoomPlugin();
      if (this.#options.roomId) {
        this.#videoRoomPlugin.room_id = this.#options.roomId;
      } else {
        this.#options.roomId = this.#videoRoomPlugin.room_id;
      }

      try {
        await this.#session.attachPlugin(this.#videoRoomPlugin);
        this.isConnected = true;
        logger.info(`Echotest plugin attached with handle/ID ${this.#videoRoomPlugin.id}`);
      } catch (err) {
        logger.error('Error during attaching of plugin', err);
      }
    })
  };

  #registerSocketCloseHandler = () => {
    this.#websocket.addEventListener('close', () => {
      this.isConnected = false;
      logger.warn('No connection to Janus');

      this.#session.stop();
    })
  };

}
