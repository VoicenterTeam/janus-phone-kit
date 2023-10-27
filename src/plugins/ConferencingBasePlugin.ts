import { BasePlugin } from './BasePlugin'
import { logger } from '../util/logger'
import { StunServer } from '../types'

export class ConferencingBasePlugin extends BasePlugin {
    room_id = 1234
    stunServers: StunServer[]
    rtcConnection: any = null

    /**
   * @type {VideoRoomPlugin}
   */
    VideoRoomPlugin = null

    constructor () {
        super()
    }

    /**
   * Receive an asynchronous ('pushed') message sent by the Janus core.
   *
   * @public
   * @override
   */
    async receive (msg) {
    // const that = this;
        logger.info('on receive ScreenSharePlugin', msg)
        if (msg.plugindata && msg.plugindata.data.error_code) {
            logger.error('plugindata.data ScreenSharePlugin error :', msg.plugindata.data)
        } else if (msg.plugindata && msg.plugindata.data.videoroom === 'joined') {
            logger.info('Self Joiend event ', msg.plugindata.data.id)

            // TODO a plugin shouldn't depend on another plugin
            if (this.VideoRoomPlugin) {
                logger.info('VideoRoomPlugin ', this.VideoRoomPlugin)
                this.VideoRoomPlugin.myFeedList.push(msg.plugindata.data.id)
            }
        }
        logger.info('Received  message from Janus ScreenSharePlugin', msg)
    }

    close () {
        if (this.rtcConnection) {
            this.rtcConnection.close()
            this.rtcConnection = null
        }
    }

}
