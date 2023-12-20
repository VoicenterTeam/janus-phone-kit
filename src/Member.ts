import { logger } from './util/logger'
import { BasePlugin } from './plugins/BasePlugin'
import { Metrics } from "./util/Metrics";

export class Member {

    private plugin: BasePlugin = null
    private rtcpPeer: any = null
    handleId = 0
    private readonly info = null
    private joinResult = null
    private state = {}
    private stream = null
    private metrics: any = null

    constructor (memberInfo, plugin: BasePlugin) {
        this.info = memberInfo
        this.plugin = plugin
        this.rtcpPeer = new RTCPeerConnection({
            iceServers: this.plugin.stunServers,
        })
    }

    async attachMember () {
    // eslint-disable-next-line no-await-in-loop
        console.log('MEMBER janus: attach')
        const attachResult = await this.plugin.send({
            janus: 'attach',
            opaque_id: this.plugin.opaqueId,
            plugin: 'janus.plugin.videoroomjs'
        })
        this.handleId = attachResult.data.id

        // eslint-disable-next-line no-await-in-loop
        this.joinResult = await this.plugin.sendMessage({
            request: 'join',
            room: this.plugin.room_id,
            feed: this.info.id,
            ptype: 'subscriber',
            private_id: this.plugin.private_id,
        }, undefined, { handle_id: this.handleId })
    }

    async answerAttachedStream (attachedStreamInfo) {
        const RTCPeerOnAddStream = async (event) => {
            if (!this.rtcpPeer) {
                return
            }
            logger.debug('on add stream Member', event)
            const options: any = {
                audio: true,
                video: true,
            }
            console.log('CCCC member rtcpPeer.createAnswer params', options)
            const answerSdp = await this.rtcpPeer.createAnswer(options) // TODO: gateway don't have passed params
            console.log('CCCC member rtcpPeer.createAnswer answerSdp', answerSdp)
            console.log('CCCC member rtcpPeer.setLocalDescription sdp', answerSdp)
            await this.rtcpPeer.setLocalDescription(answerSdp)
            // Send the answer to the remote peer through the signaling server.
            await this.plugin.sendMessage({
                request: 'start',
                room: this.plugin.room_id
            }, answerSdp, { handle_id: this.handleId })

            const aTracks = event.streams[0].getAudioTracks()
            const vTracks = event.streams[0].getVideoTracks()

            const mediaStream = new MediaStream([ aTracks[0], vTracks[0] ])
            this.stream = mediaStream

            //this.stream = event.stream

            console.log('answerAttachedStream member:join', this.memberInfo)
            this.plugin?.session.emit('member:join', this.memberInfo)
        }

        // Send ICE events to Janus.
        const RTCPeerOnIceCandidate = (event) => {
            if (this.rtcpPeer.signalingState !== 'stable') return
            this.plugin.sendTrickle(event.candidate || null)
        }

        this.rtcpPeer = new RTCPeerConnection()
        console.log('answerAttachedStream this.rtcpPeer', this.rtcpPeer)
        //this.rtcpPeer.onaddstream = RTCPeerOnAddStream;
        this.rtcpPeer.ontrack  = RTCPeerOnAddStream
        this.rtcpPeer.onicecandidate = RTCPeerOnIceCandidate
        this.rtcpPeer.sender = attachedStreamInfo.sender
        console.log('CCCC member rtcpPeer.setRemoteDescription jsep', attachedStreamInfo.jsep)
        await this.rtcpPeer.setRemoteDescription(attachedStreamInfo.jsep)
        this.setupMetrics()
    }

    private get memberInfo () {
        return {
            stream: this.stream,
            joinResult: this.joinResult,
            sender: this.handleId,
            type: 'subscriber',
            name: this.info.display,
            state: this.state,
            id: this.handleId,
        }
    }

    updateMemberState (newState) {
        this.state = {
            ...this.state,
            ...newState || {}
        }

        this.plugin?.session.emit('member:update', this.memberInfo)
    }

    updateMemberStateFromMessage (message) {
        const publisherId = message?.plugindata?.data?.newStatePublisher
        const allPublishers = message?.plugindata?.data?.publisher_state
        const publisherInfo = allPublishers.find(p => p.id === publisherId)
        this.updateMemberState(publisherInfo?.state)
    }

    setupMetrics () {
        this.metrics = new Metrics()
        this.metrics.start(this.rtcpPeer)
        this.metrics.onReport('inbound', (report) => {
            this.plugin?.session.emit('metrics:report', {
                id: this.handleId,
                data: report
            })
        })
    }

    hangup () {
        this.metrics.stop()
        this.plugin?.session.emit('metrics:stop', this.handleId)

        if (this.rtcpPeer) {
            this.rtcpPeer.close()
            this.rtcpPeer = null
        }

        this.plugin.session.emit('member:hangup', {
            info: this.info,
            sender: this.handleId
        })
        this.plugin.send({ janus: 'detach' }, { handle_id: this.handleId }).catch(console.log)
    }
}
