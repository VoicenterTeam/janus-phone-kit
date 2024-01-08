import { BasePlugin } from './BasePlugin'
import { randomString, stringToBase64 } from '../util/util'
import { logger } from '../util/logger'
import { Member } from '../Member'
import DeviceManager from '../util/DeviceManager'
import { v4 as uuidv4 } from 'uuid'
import { VolumeMeter } from '../util/SoundMeter'
import { StunServer } from '../types'
import { StreamMaskPlugin } from './StreamMaskPlugin'
import { Metrics } from '../util/Metrics'
import {
    MaskEffectTypeConfigType,
    MASK_EFFECT_TYPE_CONFIG,
    StartMaskEffectOptions,
    VisualizationConfigType
} from '../enum/tfjs.config.enum'
import { RECORDING_PATH } from '../enum/conferencing.enum'

export class VideoRoomPlugin extends BasePlugin {
    name = 'janus.plugin.videoroom'
    memberList: any = {}
    room_id = 'abcd'
    stunServers: StunServer[]
    iceCandidates: any[] = []
    publishers = null
    displayName: string = ''
    rtcConnection: any = null
    clientID: string = ''
    userID: string = ''
    created: number | null = null

    stream: MediaStream
    offerOptions: any = {}
    isVideoOn: boolean = true
    isAudioOn: boolean = true
    isNoiseFilterOn: boolean = false
    isTalking: boolean = false
    mediaConstraints: any = {}
    private volumeMeter: VolumeMeter

    streamMask: any = null
    isActiveMask: boolean = false
    maskEffectType: MaskEffectTypeConfigType | null = null
    base64BackgroundImgEffect: string | null = null

    private metrics: any = null

    constructor (options: any = {}) {
        super()
        // @ts-ignore
        this.clientID =([ 1e7 ]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
            (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
        )
        this.opaqueId = `videoroomtest-${randomString(12)}`
        this.displayName = options.displayName
        this.room_id = options.roomId
        this.stunServers = options.stunServers
        this.mediaConstraints = options.mediaConstraints
        this.isAudioOn = options.isAudioOn
        this.isVideoOn = options.isVideoOn
        this.userID = uuidv4()

        if (options.maskEffectType) {
            this.maskEffectType = options.maskEffectType
            if (options.base64BackgroundImgEffect) {
                this.base64BackgroundImgEffect = options.base64BackgroundImgEffect
            }
        }

        console.log('VIDEOPLUGIN CONSTRUCTOR')

        const config = {
            iceServers: this.stunServers,
            sdpSemantics: 'unified-plan',
        }

        this.rtcConnection = new RTCPeerConnection(config)
        logger.debug('Init plugin', this)
        this.setupMetrics()

        this.rtcConnection.addEventListener('iceconnectionstatechange', () => {
            console.log('WEBSOCKET EVENT VIDEO_ROOM iceconnectionstatechange', this.rtcConnection.iceConnectionState)
            //console.log('ICE Connection State:', this.rtcConnection.iceConnectionState)
        })

        // Listen for connection state changes
        this.rtcConnection.addEventListener('connectionstatechange', () => {
            console.log('WEBSOCKET EVENT VIDEO_ROOM connectionstatechange', this.rtcConnection.connectionState)
            //console.log('Connection State:', this.rtcConnection.connectionState);
        })

        // Send ICE events to Janus.
        this.rtcConnection.onicecandidate = (event) => {

            if (this.rtcConnection.signalingState !== 'stable' && this.rtcConnection.signalingState !== 'have-local-offer') {
                console.log('skipining icecandidate event',this.rtcConnection.signalingState,event)
                return
            }
            if (!event.candidate) {
                return
            }
            this.sendTrickle(event.candidate)
                .catch((err) => {
                    logger.warn(err)
                })
        }
    }

    // TODO: Probably not needed so can be deleted (not sure, need to test)
    onDetached () {
        this.close()
    }

    /**
   * Start or stop echoing video.
   * @public
   * @param {Boolean} enabled
   * @return {Object} The response from Janus
   */
    async enableVideo (enabled) {
        return this.sendMessage({ video: enabled })
    }

    /**
   * Start or stop echoing audio.
   *
   * @public
   * @param {Boolean} enabled
   * @return {Object} The response from Janus
   */
    async enableAudio (enabled) {
        return this.sendMessage({ audio: enabled })
    }

    /**
   * Send a REMB packet to the browser to set the media submission bandwidth.
   *
   * @public
   * @param {Number} bitrate - Bits per second
   * @return {Object} The response from Janus
   */
    async setBitrate (bitrate) {
        return this.sendMessage({ bitrate })
    }

    /**
   * Receive an asynchronous ('pushed') message sent by the Janus core.
   *
   * @public
   * @override
   */
    async receive (msg) {

        const pluginData = msg?.plugindata?.data

        if (pluginData?.error_code) {
            return
        }

        if (msg.janus === 'trickle') {
            await this.onTrickle(msg)
        }

        if(msg.janus === 'webrtcup') {
            this.session.emit('webrtcup')
        }

        if (pluginData?.event === 'PublisherStateUpdate') {
            this.onPublisherStateUpdate(msg)
            return
        }

        if (pluginData?.videoroom === 'attached') {
            this.onVideoRoomAttached(msg)
            return
        }

        if (pluginData?.unpublished) {
            this.onHangup(pluginData.unpublished)
            return
        }

        if (pluginData?.publishers) {
            this.onReceivePublishers(msg)
        }

        if (pluginData?.created) {
            this.created = pluginData.created
            this.session.emit('created', this.created)
        }

        if (pluginData?.videoroom === 'joined') {
            this.onPublisherInitialStateUpdate(msg)
        }
    }

    setupMetrics () {
        this.metrics = new Metrics()
        this.metrics.start(this.rtcConnection)
        this.metrics.onReport('outbound', (report) => {
            this.session.emit('metrics:report', {
                id: this.userID,
                data: report
            })
        })
    }

    private onHangup (unpublished) {
        const hangupMember = this.memberList[unpublished]

        if (!hangupMember) {
            return
        }
        hangupMember.hangup()
        delete this.memberList[unpublished]
    }

    private async onTrickle (message) {
        const candidate = message?.candidate?.completed ? null : message?.candidate
        if (this.rtcConnection.remoteDescription) {
            await this.rtcConnection.addIceCandidate(candidate)
            return
        }
        this.iceCandidates.push(candidate)
    }

    private async processIceCandidates () {
        for(let i = 0; i < this.iceCandidates.length; i++) {
            await this.rtcConnection.addIceCandidate(this.iceCandidates[i])
        }
        this.iceCandidates = []
    }

    private onVideoRoomAttached (message) {
        if (this.memberList[message?.plugindata?.data?.id]) {
            this.memberList[message?.plugindata?.data?.id].answerAttachedStream(message)
        }
    }

    private onPublisherStateUpdate (message) {
        if (this.memberList[message?.plugindata?.data?.newStatePublisher]) {
            this.memberList[message?.plugindata?.data?.newStatePublisher].updateMemberStateFromMessage(message)
        }
    }

    private onPublisherInitialStateUpdate (message) {
        const publishers = message?.plugindata?.data?.publishers
        publishers.forEach(publisher => {
            if (this.memberList[publisher?.id]) {
                this.memberList[publisher?.id].updateMemberState(publisher?.state)
            }
        })
    }

    private onReceivePublishers (msg) {
        const unprocessedMembers = { ...this.memberList }
        msg?.plugindata?.data?.publishers.forEach((publisher) => {

            delete unprocessedMembers[publisher.id]
            if (!this.memberList[publisher.id] && !this.myFeedList.includes(publisher.id) &&  publisher.clientID !==this.clientID ) {

                console.log('onReceivePublishers publisher',publisher)
                this.memberList[publisher.id] = new Member(publisher, this)
                this.memberList[publisher.id].attachMember()
            }
        })

        if (msg?.plugindata?.data?.videoroom === 'synced') {
            Object.keys(unprocessedMembers).forEach(key => {
                unprocessedMembers[key].hangup()
                delete this.memberList[key]
            })
        }
        this.publishers = msg?.plugindata?.data?.publishers
        this.private_id = msg?.plugindata?.data?.private_id
    }

    async loadStream () {
        const options = { ...this.mediaConstraints }
        try {
            this.stream = await navigator.mediaDevices.getUserMedia(options)
            logger.info('Got local user media.')

        } catch (e) {
            try {
                options.video = false
                this.stream = await navigator.mediaDevices.getUserMedia(options)
            } catch (ex) {
                options.audio = false
                options.video = false
                this.stream = await navigator.mediaDevices.getUserMedia(options)
            }
        }
        this.trackMicrophoneVolume()
        return {
            stream: this.stream,
            options
        }
    }

    async requestAudioAndVideoPermissions () {
        logger.info('Asking user to share media. Please wait...')
        return  await this.loadStream()
    }

    /**
   * Set up a bi-directional WebRTC connection:
   *
   * 1. get local media
   * 2. create and send a SDP offer
   * 3. receive a SDP answer and add it to the RTCPeerConnection
   * 4. negotiate ICE (can happen concurrently with the SDP exchange)
   * 5. Play the video via the `onaddstream` event of RTCPeerConnection
   *
   * @private
   * @override
   */
    async onAttached () {
        const { options } = await this.requestAudioAndVideoPermissions()

        const joinResult = await this.sendMessage({
            request: 'join',
            room: this.room_id,
            ptype: 'publisher',
            display: this.displayName,
            clientID: this.clientID,
            opaque_id: this.opaqueId,
        })

        /*// Add an audio transceiver.
    const audioTransceiver = this.rtcConnection.addTransceiver('audio', {
      direction: 'sendrecv', // You can specify 'sendrecv', 'sendonly', or 'recvonly'
    })
    const audioTracks = this.stream.getAudioTracks()
    if (audioTracks.length < 1) {
      console.log('ERR no audiotracks')
    }
    const audioTrack = audioTracks[0]
    audioTransceiver.sender.replaceTrack(audioTrack)

    // Add a video transceiver.
    const videoTracks = this.stream.getVideoTracks()
    if (videoTracks.length < 1) {
      console.log('ERR no videotracks')
    }
    const videoTrack = videoTracks[0]

    const transceiver = this.rtcConnection.addTransceiver(videoTrack, {
      direction: 'sendrecv',
      streams: [this.stream],
      codecs: [
        { name: 'H264' },
        { name: 'VP8' }, // Add other preferred codecs
      ],
    })*/

        if (this.maskEffectType) {
            let maskEffectOptions: StartMaskEffectOptions = {}
            if (this.maskEffectType === MASK_EFFECT_TYPE_CONFIG.backgroundImageEffect && this.base64BackgroundImgEffect) {
                maskEffectOptions= {
                    base64Image: this.base64BackgroundImgEffect
                }
            }

            await this.enableMask(this.maskEffectType, maskEffectOptions)
            this.trackMicrophoneVolume()
        }

        console.log('MEMBER:JOIN VIDEOROOMPLUGIN', {
            stream: this.stream,
            joinResult,
            sender: 'me',
            type: 'publisher',
            name: this.displayName,
            clientID: this.clientID,
            state: {},
            id: this.userID,
        })

        this.session.emit('member:join', {
            stream: this.stream,
            joinResult,
            sender: 'me',
            type: 'publisher',
            name: this.displayName,
            clientID: this.clientID,
            state: {},
            id: this.userID,
        })

        logger.info('Adding local user media to RTCPeerConnection.')
        // pass through audio context
        this.addTracks(this.stream.getVideoTracks())
        this.addTracks(this.volumeMeter.getOutputStream().getTracks())

        await this.sendConfigureMessage({
            audio: true,
            video: true,
        })
        await this.sendInitialState()

        // TODO: rewrite this logic by passing to request media appropriate values
        if (!this.isAudioOn) {
            await this.stopAudio()
        }

        if (!this.isVideoOn) {
            await this.stopVideo()
        }
    }

    trackMicrophoneVolume () {
        const volumeMeter = new VolumeMeter(this.stream)
        volumeMeter.onAudioProcess(async (newValue, oldValue) => {
            if (newValue >= 20 && oldValue < 20) {
                this.isNoiseFilterOn && volumeMeter.unmute()
                this.isTalking = true
                await this.sendStateMessage({ isTalking: true })
            } else if (newValue <= 20 && oldValue > 20) {
                this.isNoiseFilterOn && volumeMeter.mute()
                this.isTalking = false
                await this.sendStateMessage({ isTalking: false })
            }
        })
        this.volumeMeter = volumeMeter
    }

    async startVideo () {
        DeviceManager.toggleVideoMute(this.stream)
        await this.enableVideo(true)
        this.isVideoOn = true
        await this.sendStateMessage({
            video: true
        })
    }

    async stopVideo () {
        DeviceManager.toggleVideoMute(this.stream)
        await this.enableVideo(false)
        this.isVideoOn = false
        await this.sendStateMessage({
            video: false
        })
    }

    async startAudio () {
        DeviceManager.toggleAudioMute(this.stream, true)
        await this.enableAudio(true)
        this.isAudioOn = true
        await this.sendStateMessage({
            audio: true
        })
    }

    async stopAudio () {
        DeviceManager.toggleAudioMute(this.stream, false)
        await this.enableAudio(false)
        this.isAudioOn = false
        await this.sendStateMessage({
            audio: false
        })
    }

    startNoiseFilter () {
        this.isNoiseFilterOn = true
        if (!this.isTalking) {
            this.volumeMeter.mute()
        }
    }

    stopNoiseFilter () {
        this.isNoiseFilterOn = false
        this.volumeMeter.unmute()
    }

    /**
   * Replaces tracks of RTC connection senders
   * @param {MediaStream} stream - stream whose tracks will be used in connection sender
   * @return void
   */
    overrideSenderTracks (stream) {
        stream.getTracks().forEach(track => {
            const senders = this.rtcConnection.getSenders()
            senders.forEach(sender => {
                if (sender.track.kind !== track.kind) {
                    return
                }

                if (track.kind === 'audio' && !this.isAudioOn) {
                    track.enabled = false
                }
                if (track.kind === 'video' && !this.isVideoOn) {
                    track.enabled = false
                }
                sender.replaceTrack(track)
            })
        })
    }

    async changePublisherStream ({ audioInput, videoInput }) {
        const isMaskEnabled = this.isActiveMask
        if (isMaskEnabled) {
            this.streamMask.stop()
            this.isActiveMask = false
        }

        if(videoInput) {
            this.mediaConstraints.video = {
                deviceId: { exact: videoInput },
                frameRate: {
                    ideal: 60,
                }
            }
        }
        if(audioInput) {
            this.mediaConstraints.audio = { deviceId: { exact: audioInput } }
        }

        this.session.emit('mediaConstraintsChange', this.mediaConstraints)

        let publisherStream
        if (isMaskEnabled && this.maskEffectType) {
            let maskEffectOptions: StartMaskEffectOptions = {}
            if (this.maskEffectType === MASK_EFFECT_TYPE_CONFIG.backgroundImageEffect && this.base64BackgroundImgEffect) {
                maskEffectOptions= {
                    base64Image: this.base64BackgroundImgEffect
                }
            }

            publisherStream = await this.enableMask(this.maskEffectType, maskEffectOptions)
            this.trackMicrophoneVolume()
        } else {
            const { stream } = await this.loadStream()
            publisherStream = stream
        }

        this.overrideSenderTracks(publisherStream)
        return publisherStream
    }

    /**
     * Restarts video stream mask. Usually is used when screen orientation changed
     * @return {MediaStream} processed stream with mask effect
     */
    async restartMasking () {
        this.streamMask.stop()

        const options: StartMaskEffectOptions = {}
        if (this.maskEffectType === MASK_EFFECT_TYPE_CONFIG.backgroundImageEffect) {
            this.base64BackgroundImgEffect = options.base64Image
        }

        const { stream } = await this.loadStream()
        const canvasStream = await this.streamMask.start(stream, this.maskEffectType, this.mediaConstraints, options)

        this.overrideSenderTracks(canvasStream)

        this.stream = canvasStream

        return canvasStream
    }

    /**
   * Enables or disables video stream mask.
   * @param {boolean} enable - defines if mask should be applied
   * @param {'bokehEffect' | 'backgroundImageEffect'} effect - defines the mask effect type
   * @param {object} options - additional mask effect options
   * @return {MediaStream} processed stream with mask effect
   */
    async enableMask (effect: MaskEffectTypeConfigType, options?: StartMaskEffectOptions): Promise<MediaStream> {
        if (this.isActiveMask) {
            return
        }

        if (!this.streamMask) {
            this.streamMask = new StreamMaskPlugin()
        }

        this.maskEffectType = effect
        if (effect === MASK_EFFECT_TYPE_CONFIG.backgroundImageEffect) {
            this.base64BackgroundImgEffect = options.base64Image
        }

        const { stream } = await this.loadStream()
        const canvasStream = await this.streamMask.start(stream, effect, this.mediaConstraints, options)

        this.overrideSenderTracks(canvasStream)
        this.isActiveMask = true
        this.stream = canvasStream

        return canvasStream
    }


    async disableMask () {
        if (!this.isActiveMask) {
            return
        }

        if (!this.streamMask) {
            throw new Error('Mask doesn\'t exist. Create a mask first')
        }

        this.streamMask.stop()
        this.maskEffectType = null
        this.base64BackgroundImgEffect = null

        const { stream } = await this.loadStream()
        this.overrideSenderTracks(stream)
        this.isActiveMask = false
        return stream
    }

    setupMaskVisualizationConfig (config: VisualizationConfigType) {
        if (!this.streamMask) {
            throw new Error('Mask doesn\'t exist. Enable mask first')
        }
        this.streamMask.setupVisualizationConfig(config)
    }

    getRecordFileName () {
        return RECORDING_PATH + this.room_id + stringToBase64(this.displayName) + Date.now()
    }

    async sendConfigureMessage (options) {
        this.offerOptions.offerToReceiveAudio = false
        this.offerOptions.offerToReceiveVideo = false
        const jsepOffer = await this.rtcConnection.createOffer(this.offerOptions)
        await this.rtcConnection.setLocalDescription(jsepOffer)

        const confResult = await this.sendMessage({
            request: 'configure',
            record: true,
            filename: this.getRecordFileName(),
            ...options,
        }, jsepOffer)

        await this.rtcConnection.setRemoteDescription(confResult.jsep)
        await this.processIceCandidates()

        return confResult
    }

    public async sendStateMessage (data = {}) {
        await this.sendMessage({
            request: 'state',
            data,
        })
    }

    private async sendInitialState () {
        await this.sendMessage({
            request: 'state',
            data: {
                status: 'online',
                clientID: this.clientID,
                name: this.displayName
            },
        })
    }

    addTracks (tracks: MediaStreamTrack[]) {
        tracks.forEach((track) => {
            this.rtcConnection.addTrack(track)
        })
    }

    async hangup () {
        if (this.stream) {
            this.stream.getTracks().forEach(track => {
                track.stop()
            })
        }
        if (this.rtcConnection) {
            this.rtcConnection.close()
            this.rtcConnection = null
        }
        await this.send({ janus: 'hangup' })
    }

    public async syncParticipants () {
        await this.sendMessage({
            request: 'sync'
        })
    }

    close () {
        this.metrics.stop()
        this.session.emit('metrics:stop', this.userID)

        if (this.rtcConnection) {
            this.rtcConnection.close()
            this.rtcConnection = null
        }
        const members = Object.values(this.memberList)
        members.forEach((member: any) => member.hangup())
    }
}
