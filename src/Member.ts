import {logger} from './util/logger'
import {onceInTimeoutClosure, retryPromise} from "./util/util";
import {VideoRoomPlugin} from "./plugins/VideoRoomPlugin";
import delay from 'lodash/delay';

export class Member {

  private plugin: VideoRoomPlugin = null
  private rtcpPeer: any = null
  handleId = 0
  subscriberId = 0
  private readonly info = null
  private joinResult = null
  private state = {}
  private stream = null
  public onSlowlinkHandler = onceInTimeoutClosure(
    // () => this.plugin.reduceDownlink(),
    () => delay(() => !this.slowLinkLock && this.plugin.reduceDownlink(), 1000),
    5000, 3
  );
  private slowLinkLock: boolean = false;
  private slowLinkTimer: NodeJS.Timeout
  private static slowLinkLockTimeout: number = 15000;

  constructor(memberInfo, plugin: VideoRoomPlugin) {
    this.info = memberInfo
    this.plugin = plugin;
    this.rtcpPeer = new RTCPeerConnection({
      iceServers: this.plugin.stunServers,
    })
    this.state = {};
    this.plugin?.session.emit('member:join', this.memberInfo)
  }

  async attachMember() {
    // eslint-disable-next-line no-await-in-loop
    const attachResult = await this.plugin.send({
      janus: 'attach',
      opaque_id: this.plugin.opaqueId,
      plugin: 'janus.plugin.videoroomjs'
    });
    this.handleId = attachResult.data.id;
    this.subscriberId = attachResult.data.subscriberId

    // eslint-disable-next-line no-await-in-loop
    this.joinResult = await this.plugin.sendMessage({
      request: 'join',
      room: this.plugin.room_id,
      feed: this.info.id,
      ptype: 'subscriber',
      private_id: this.plugin.private_id,
      initialSubstream: this.plugin.getActiveDownlinkSubstream(),
    }, undefined, {handle_id: this.handleId});
  }

  async answerAttachedStream(attachedStreamInfo) {
    const RTCPeerOnAddStream = async (event) => {
      if (!this.rtcpPeer) {
        return
      }
      logger.debug('on add stream Member', event);
      const options: any = {
        audio: true,
        video: true,
      }
      const answerSdp = await this.rtcpPeer.createAnswer(options);
      await this.rtcpPeer.setLocalDescription(answerSdp);
      // Send the answer to the remote peer through the signaling server.
      try {
        await retryPromise(
          () => this.plugin.sendMessage({
            request: 'start',
            room: this.plugin.room_id
          }, answerSdp, {handle_id: this.handleId})
        )
      } catch (e) {
        this.plugin?.session.emit('disconnected');
        this.plugin.session.offAll()
        return
      }

      this.stream = event.stream;

      this.plugin?.session.emit('member:update', this.memberInfo)
    }

    // Send ICE events to Janus.
    const RTCPeerOnIceCandidate = (event) => {
      if (event.candidate) {
        this.plugin.sendTrickle(event.candidate);
      }
    }

    const RTCPeerOnConnectionStateChange = async () => {
      if (this.rtcpPeer.iceConnectionState === 'disconnected') {
        this.plugin.session.emit('member:disconnected', this.memberInfo)
        delete this.plugin.memberList[this.memberInfo.id]
        try {
          await this.plugin.syncParticipants()
        } catch (e) {
          this.plugin.session.emit('disconnected')
          this.plugin.session.offAll()
        }
      }
    };

    this.rtcpPeer.onaddstream = RTCPeerOnAddStream;
    this.rtcpPeer.onicecandidate = RTCPeerOnIceCandidate;
    this.rtcpPeer.onconnectionstatechange = RTCPeerOnConnectionStateChange;
    this.rtcpPeer.sender = attachedStreamInfo.sender;
    await this.rtcpPeer.setRemoteDescription(attachedStreamInfo.jsep);
  }

  private get memberInfo() {
    return {
      stream: this.stream,
      joinResult: this.joinResult,
      sender: this.handleId,
      type: 'subscriber',
      name: this.info.display,
      state: this.state,
      id: this.handleId,
      info: this.info.customInfo,
      rtcPeer: this.rtcpPeer,
      setSubstream: substream => this.setSubstream(substream),
      setTemporal: temporal => this.setTemporal(temporal),
    }
  }

  updateMemberState(newState) {
    this.state = {
      ...this.state,
      ...newState || {}
    }

    this.plugin?.session.emit('member:update', this.memberInfo)
  }

  updateMemberStateFromMessage(message) {
    const publisherId = message?.plugindata?.data?.newStatePublisher
    const allPublishers = message?.plugindata?.data?.publisher_state
    const publisherInfo = allPublishers.find(p => p.id === publisherId)
    this.updateMemberState(publisherInfo?.state)
  }

  hangup() {
    if (this.rtcpPeer) {
      this.rtcpPeer.close();
      this.rtcpPeer = null;
    }

    this.plugin.session.emit('member:hangup', {
      info: this.info,
      sender: this.handleId
    })
    this.plugin.send({janus: 'detach'}, {handle_id: this.handleId});
  }

  public isSharedScreen() {
    return this.info.customInfo.screenShare;
  }

  public async setSubstream(substream) {
      await this.plugin.sendMessage({substream}, null, {handle_id: this.handleId});
  }

  public async setTemporal(temporal) {
      await this.plugin.sendMessage({temporal}, null, { handle_id: this.handleId });
  }

  /**
   * Once publisher uplink problem detected, janus sends slowlink to that publisher and all subscribers
   * To prevent reducing downlink on subscriber side we lock slowlink handling
   */
  public lockSlowLink() {
    this.slowLinkLock = true;
    clearTimeout(this.slowLinkTimer);
    this.slowLinkTimer = setTimeout(() => {
      this.slowLinkLock = false;
    }, Member.slowLinkLockTimeout);
  }

  public onSlowlink() {
    if (!this.slowLinkLock) {
      this.onSlowlinkHandler();
    }
  }
}
