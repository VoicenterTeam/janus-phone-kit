// @ts-ignore
import 'webrtc-adapter'
import Session from './Session'
import { logger } from './util/logger'
import { VideoRoomPlugin } from './plugins/VideoRoomPlugin'
import { ScreenSharePlugin } from './plugins/ScreenSharePlugin'
import { WhiteBoardPlugin } from './plugins/WhiteBoardPlugin'
import EventEmitter from './util/EventEmitter'
import { StunServer } from './types'
import { CONFERENCING_MODE, ConferencingModeType } from './enum/conferencing.enum'
import { EventCallbackByEventName, EventName, EventPayloadByEventName } from 'janus/types/events'

export type JanusPhoneKitOptions = {
  roomId?: number,
  url?: string,
  stunServers?: StunServer[]
}
export interface JoinRoomOptions {
    roomId: number
    displayName?: string
    mediaConstraints: MediaStreamConstraints
}
const defaultOptions: JanusPhoneKitOptions = {
    roomId: null,
    url: null,
    stunServers: [ { urls: 'stun:stun.l.google.com:19302' } ]
}

export default class JanusPhoneKit extends EventEmitter {
    private options: JanusPhoneKitOptions = {}

    private mediaConstraints = null
    private displayName = null

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

    private eventListeners: { [key: EventName]: Array<EventCallbackByEventName> } = {}

    isConnected = false

    constructor (options = {}) {
        super()
        this.options = {
            ...defaultOptions,
            ...options
        }
    }

    on <Event extends EventName, Fn extends EventCallbackByEventName<Event>> (event: EventName, fn: Fn) {
        const functions: Array<EventCallbackByEventName> = this.eventListeners[event] || []
        this.eventListeners[event] = [ ...functions, fn ]

        /*this.session.on(event, (...params) => {
            fn.apply(this, params)
        })*/
    }

    emit (...params) {
        this.session?.emit.apply(this, params)
    }

    connectToServer() {
        this.session = new Session()

        this.websocket = new WebSocket(this.options.url, 'janus-protocol')

        this.session.on('output', (msg) => {
            this.websocket.send(JSON.stringify(msg))
        })

        this.websocket.addEventListener('message', (event) => {
            this.session.receive(JSON.parse(event.data))
        })

        this.registerSocketOpenHandler() // displayName, mediaConstraints
        this.registerSocketCloseHandler()

        this.applySessionListeners()
    }

    private applySessionListeners () {
        if (!this.session) {
            return
        }

        Object.keys(this.eventListeners).forEach((event) => {
            const fns = this.eventListeners[event] || []
            fns.forEach(fn => {
                this.session.on(event, (...params) => {
                    fn.apply(this, params)
                })
            })

        })
    }

    public joinRoom ({ roomId, displayName = '', mediaConstraints }: JoinRoomOptions) {
        if (!this.options.url) {
            throw new Error('Could not create websocket connection because url parameter is missing')
        }
        this.options.roomId = roomId

        if (!this.options.roomId) {
            throw new Error('A roomId is required in order to join a room')
        }

        this.displayName = displayName
        this.mediaConstraints = mediaConstraints

        this.connectToServer()

        /*this.websocket.addEventListener('close', (event) => {
          setTimeout(() => {
            this.connectToServer() // Reconnect after a delay
          }, 3000);
        });*/

        /*this.websocket.addEventListener('close', (event) => {
            console.log('ON SOCKET CLOSE', event)
        })*/

        /*this.session = new Session()

        this.websocket = new WebSocket(this.options.url, 'janus-protocol')
        this.session.on('output', (msg) => {
            this.websocket.send(JSON.stringify(msg))
        })

        this.websocket.addEventListener('message', (event) => {
            console.log('SOCKET MESSAGE ', event)
            this.session.receive(JSON.parse(event.data))
        })

        this.websocket.addEventListener('close', (event) => {
            console.log('WEBSOCKET EVENT CLOSE', event)
        })

        this.websocket.addEventListener('error', (msg) => {
            console.log('WEBSOCKET EVENT ERROR', msg)
            //this.websocket.close()
        })

        window.addEventListener('offline', (e) => {
            console.log('YOU ARE OFFLINE', e)
        });

        window.addEventListener('online', (e) => {
            console.log('YOU ARE ONLINE', e)
        });

        this.registerSocketOpenHandler(displayName, mediaConstraints)
        this.registerSocketCloseHandler()*/

        return this.session
    }

    public hangup () {
        this.session.emit('hangup')
        this.session.stop()
        this.isConnected = false
        this.websocket.close()

        this.mediaConstraints = null
        this.displayName = null
    }

    public startVideo () {
        this.videoRoomPlugin?.startVideo()
    }

    public stopVideo () {
        this.videoRoomPlugin?.stopVideo()
    }

    public enableMask (state: boolean) {
        return this.videoRoomPlugin?.enableMask(state)
    }

    public startAudio () {
        this.videoRoomPlugin?.startAudio()
    }

    public stopAudio () {
        this.videoRoomPlugin?.stopAudio()
    }

    public startNoiseFilter () {
        this.videoRoomPlugin?.startNoiseFilter()
    }

    public stopNoiseFilter () {
        this.videoRoomPlugin?.stopNoiseFilter()
    }

    public setBitrate (bitrate) {
        this.videoRoomPlugin?.setBitrate(bitrate)
        this.screenSharePlugin?.setBitrate(bitrate)
    }

    async changePublisherStream (newSource) {
        return this.videoRoomPlugin?.changePublisherStream(newSource)
    }

    public async enableScreenShareWhiteboard (enable: boolean, stream?: MediaStream) {
        if (enable) {
            const whiteBoardStream = await WhiteBoardPlugin.startScreenShareWhiteboard(stream)

            this.screenSharePlugin.overrideSenderTracks(whiteBoardStream)
        } else {
            const initialStream = WhiteBoardPlugin.stopScreenShareWhiteboard()
            this.screenSharePlugin.overrideSenderTracks(initialStream)
        }
    }

    public async enableWhiteboard (mode: ConferencingModeType, enable: boolean) {
        if (!this.whiteboardPlugin) {
            this.whiteboardPlugin = new WhiteBoardPlugin({
                mode: mode,
                roomId: this.options.roomId,
                videoRoomPlugin: this.videoRoomPlugin,
                stunServers: this.options.stunServers
            })
        }
        if (enable) {
            await this.session.attachPlugin(this.whiteboardPlugin)

            //this.screenSharePlugin.overrideSenderTracks(whiteBoardStream)
        } else {
            console.log('disable whiteboard')
            //const stream = await this.whiteboardPlugin?.stop()
            await this.whiteboardPlugin?.stopPresentationWhiteboard()
            this.whiteboardPlugin = null
            //this.screenSharePlugin.overrideSenderTracks(stream)
        }
    }

    public async startScreenShare () {
        if (!this.session.connected || this.screenSharePlugin && this.screenSharePlugin.rtcConnection) {
            return
        }

        this.screenSharePlugin = new ScreenSharePlugin({
            roomId: this.options.roomId,
            videoRoomPlugin: this.videoRoomPlugin,
            stunServers: this.options.stunServers,
        })

        try {
            await this.session.attachPlugin(this.screenSharePlugin)

            logger.info(`screenSharePlugin plugin attached with handle/ID ${this.screenSharePlugin.id}`)
        } catch (err) {
            logger.error('Error during attaching of screenShare plugin', err)
        }
    }

    stopScreenShare () {
        if (!this.screenSharePlugin) {
            return
        }

        this.screenSharePlugin.stop()
    }

    public async sendStateMessage (data = {}) {
        await this.videoRoomPlugin.sendStateMessage(data)
    }

    public async syncParticipants () {
        await this.videoRoomPlugin?.syncParticipants()
    }

    private registerSocketOpenHandler () {
        const displayName = this.displayName
        const mediaConstraints = this.mediaConstraints
        this.websocket.addEventListener('open', async () => {
            try {
                await this.session.create()
                logger.info(`Session with ID ${this.session.id} created.`)
            } catch (err) {
                logger.error('Error during creation of session', err)
                return
            }

            this.videoRoomPlugin = new VideoRoomPlugin({
                displayName: displayName,
                roomId: this.options.roomId,
                stunServers: this.options.stunServers,
                mediaConstraints,
            })

            this.videoRoomPlugin.rtcConnection?.addEventListener('connectionstatechange', () => {
                if (this.videoRoomPlugin.rtcConnection.connectionState === 'failed') {
                    this.websocket.close()
                    this.reconnect()
                }
            })

            try {
                await this.session.attachPlugin(this.videoRoomPlugin)
                this.isConnected = true
                await this.syncParticipants()
                logger.info(`Echotest plugin attached with handle/ID ${this.videoRoomPlugin.id}`)
            } catch (err) {
                logger.error('Error during attaching of plugin', err)
            }
        })
    }

    private registerSocketCloseHandler () {
        this.websocket.addEventListener('close', async () => {
            await this.reconnect()
        })
    }

    private async reconnect () {
        //this.isConnected = false
        logger.warn('No connection to Janus')
        //this.emit('reconnect')
        this.session.emit('reconnect')

        this.session.stop()

        if (this.isConnected) {
            await this.session.destroy()
            this.session = null

            this.websocket.close()
            this.websocket = null
            // TODO: maybe set isConnected = false here

            setTimeout(() => {
                this.connectToServer()
            }, 5000)
        }
    }
}
