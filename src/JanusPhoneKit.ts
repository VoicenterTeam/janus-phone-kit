import 'webrtc-adapter'
import Session from './Session'
import { logger } from './util/logger'
import { VideoRoomPlugin } from './plugins/VideoRoomPlugin'
import { ScreenSharePlugin } from './plugins/ScreenSharePlugin'
import { WhiteBoardPlugin } from './plugins/WhiteBoardPlugin'
import EventEmitter from './util/EventEmitter'
import { StunServer } from './types'
import { CONFERENCING_MODE, ConferencingModeType } from './enum/conferencing.enum'
import { EventCallbackByEventName, EventName, EventPayloads } from 'janus/types/events'
import { KonvaDrawerOptions, KonvaScreenShareDrawerOptions } from './types/konvaDrawer'
import { MASK_EFFECT_TYPE_CONFIG, MaskEffectTypeConfigType, StartMaskEffectOptions } from "./enum/tfjs.config.enum";

export type JanusPhoneKitOptions = {
  roomId?: number,
  url?: string,
    isAudioOn?: boolean,
    isVideoOn?: boolean,
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
    isAudioOn: true,
    isVideoOn: true,
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

    private reconnectAttempt = 0

    private eventListeners: { [K in EventName]: Array<EventCallbackByEventName<K>> } = {
        'member:join': [],
        'member:update': [],
        'member:hangup': [],
        hangup: [],
        plugin_attached: [],
        output: [],
        attached: [],
        detached: [],
        keepalive_timout: [],
        'screenShare:stop': [],
        'screenShare:start': [],
        webrtcup: [],
        reconnect: [],
        'metrics:report': [],
        'metrics:stop': [],
    }

    isConnected = false

    constructor (options = {}) {
        super()
        this.options = {
            ...defaultOptions,
            ...options
        }
    }

    on<Event extends EventName> (event: Event, fn: EventCallbackByEventName<Event>) {
        const functions = this.eventListeners[event]

        functions.push(fn)

        /*this.session.on(event, (...params) => {
            fn.apply(this, params)
        })*/
    }

    emit (...params) {
        this.session?.emit.apply(this, params)
    }

    private connectToServer () {
        this.reconnectAttempt++
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
                this.session.on(event as keyof EventPayloads, (...params) => {
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
        this.options.isVideoOn = true
        this.videoRoomPlugin?.startVideo()
    }

    public stopVideo () {
        this.options.isVideoOn = false
        this.videoRoomPlugin?.stopVideo()
    }

    public enableBokehEffectMask () {
        return this.videoRoomPlugin?.enableMask(MASK_EFFECT_TYPE_CONFIG.bokehEffect)
    }

    public enableBackgroundImgEffectMask (base64Image) {
        const options: StartMaskEffectOptions = {
            base64Image
        }
        return this.videoRoomPlugin?.enableMask(MASK_EFFECT_TYPE_CONFIG.backgroundImageEffect, options)
    }

    public disableMask () {
        return this.videoRoomPlugin?.disableMask()
    }

    public startAudio () {
        this.options.isAudioOn = true
        this.videoRoomPlugin?.startAudio()
    }

    public stopAudio () {
        this.options.isAudioOn = false
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

    public async enableWhiteboard (mode: ConferencingModeType, enable: boolean, base64Image?: string) {
        if (!this.whiteboardPlugin) {
            const params = {
                mode: mode,
                roomId: this.options.roomId,
                videoRoomPlugin: this.videoRoomPlugin,
                stunServers: this.options.stunServers
            }

            if (mode === CONFERENCING_MODE.IMAGE_WHITEBOARD && base64Image) {
                params['imageSrc'] = base64Image
            }

            this.whiteboardPlugin = new WhiteBoardPlugin(params)
        }
        if (enable) {
            await this.session.attachPlugin(this.whiteboardPlugin)

            //this.screenSharePlugin.overrideSenderTracks(whiteBoardStream)
        } else {
            //const stream = await this.whiteboardPlugin?.stop()
            await this.whiteboardPlugin?.stopPresentationWhiteboard()
            this.whiteboardPlugin = null
            //this.screenSharePlugin.overrideSenderTracks(stream)
        }
    }

    public setupDrawerOptions (options: KonvaDrawerOptions) {
        if (this.whiteboardPlugin) {
            this.whiteboardPlugin.setupDrawerOptions(options)
        }
    }

    public setupScreenShareDrawerOptions (options: KonvaScreenShareDrawerOptions) {
        WhiteBoardPlugin.setupScreenShareDrawerOptions(options)
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

    public stopScreenShare () {
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
                this.reconnectAttempt = 0
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
                isAudioOn: this.options.isAudioOn,
                isVideoOn: this.options.isVideoOn,
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

            const reconnectDelay = this.reconnectAttempt > 12 ? 5000 : 0
            setTimeout(() => {
                this.connectToServer()
            }, reconnectDelay)
        }
    }
}
