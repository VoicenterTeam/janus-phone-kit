import { logger } from './util/logger'

export class Member {

  #plugin = {}

  constructor(memberInfo, plugin) {
    this.Info = memberInfo;
    this.#plugin = plugin;
    this.HandleId = 0;
    this.Video = null;
    this.RTCPeer = null;
  }

  async attachMember() {
    // eslint-disable-next-line no-await-in-loop
    const attachResult = await this.#plugin.send({
      janus: 'attach',
      opaque_id: this.#plugin.opaqueId,
      plugin: 'janus.plugin.videoroom'
    });
    logger.debug('attach member Result ', attachResult);
    this.HandleId = attachResult.data.id;

    // eslint-disable-next-line no-await-in-loop
    const joinResult = await this.#plugin.sendMessage({
      request: 'join',
      room: this.#plugin.room_id,
      feed: this.Info.id,
      ptype: 'subscriber',
      private_id: this.#plugin.private_id,
    }, undefined, { handle_id: this.HandleId });

    logger.debug('joinResult', joinResult);
    this.Video = document.createElement('video');
    this.Video.controls = true;
    this.Video.muted = true;
    document.body.appendChild(this.Video);
  }

  async answerAttachedStream(attachedStreamInfo) {
    const that = this;

    async function RTCPeerOnAddStream(event) {
      logger.debug('on add stream Member', event);
      const answerSdp = await that.RTCPeer.createAnswer({
        audio: true,
        video: true,
      });
      await that.RTCPeer.setLocalDescription(answerSdp);
      // Send the answer to the remote peer through the signaling server.
      await that.Plugin.sendMessage({
        request: 'start',
        room: that.Plugin.room_id
      }, answerSdp, { handle_id: that.HandleId });
      that.Video.srcObject = event.stream;
      await that.Video.play();
    }

    // Send ICE events to Janus.
    function RTCPeerOnIceCandidate(event) {
      if (that.RTCPeer.signalingState !== 'stable') return;
      that.Plugin.sendTrickle(event.candidate || null);
    }

    this.RTCPeer = new RTCPeerConnection();
    this.RTCPeer.onaddstream = RTCPeerOnAddStream;
    this.RTCPeer.onicecandidate = RTCPeerOnIceCandidate;
    logger.debug('attachedStreamInfo', attachedStreamInfo);
    this.RTCPeer.sender = attachedStreamInfo.sender;
    await this.RTCPeer.setRemoteDescription(attachedStreamInfo.jsep);
  }

  hangup() {
    logger.debug('hangup', this.Info);
    this.RTCPeer.close();
    this.RTCPeer = null;
    this.Video.pause();
    this.Video.removeAttribute('src'); // empty source
    this.Video.load();
    this.Video.disabled = true;
  }
}
