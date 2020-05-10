import { logger } from './util/logger'
import {BasePlugin} from "./plugins/BasePlugin";
import { v4 as uuidv4 } from 'uuid';

export class Member {

  #plugin: BasePlugin = null
  #videoElement: any = document.createElement('video')
  #rtcpPeer: any = new RTCPeerConnection()
  handleId = 0
  #info = null
  #joinResult = null

  constructor(memberInfo, plugin: BasePlugin) {
    this.#info = memberInfo
    this.#plugin = plugin;
  }

  async attachMember() {
    // eslint-disable-next-line no-await-in-loop
    const attachResult = await this.#plugin.send({
      janus: 'attach',
      opaque_id: this.#plugin.opaqueId,
      plugin: 'janus.plugin.videoroom'
    });
    this.handleId = attachResult.data.id;

    // eslint-disable-next-line no-await-in-loop
    this.#joinResult = await this.#plugin.sendMessage({
      request: 'join',
      room: this.#plugin.room_id,
      feed: this.#info.id,
      ptype: 'subscriber',
      private_id: this.#plugin.private_id,
    }, undefined, { handle_id: this.handleId });
  }

  async answerAttachedStream(attachedStreamInfo) {
    const RTCPeerOnAddStream = async (event) => {
      logger.debug('on add stream Member', event);
      const options: any = {
        audio: true,
        video: true,
      }
      const answerSdp = await this.#rtcpPeer.createAnswer(options);
      await this.#rtcpPeer.setLocalDescription(answerSdp);
      // Send the answer to the remote peer through the signaling server.
      await this.#plugin.sendMessage({
        request: 'start',
        room: this.#plugin.room_id
      }, answerSdp, { handle_id: this.handleId });
      this.#videoElement.srcObject = event.stream;

      this.#plugin?.session.emit('member:join', {
        stream: event.stream,
        joinResult: this.#joinResult,
        sender: this.handleId,
        type: 'subscriber',
        name: this.#info.display,
        id: uuidv4(),
      })
    }

    // Send ICE events to Janus.
    const RTCPeerOnIceCandidate = (event) => {
      if (this.#rtcpPeer.signalingState !== 'stable') return;
      this.#plugin.sendTrickle(event.candidate || null);
    }

    this.#rtcpPeer = new RTCPeerConnection();
    this.#rtcpPeer.onaddstream = RTCPeerOnAddStream;
    this.#rtcpPeer.onicecandidate = RTCPeerOnIceCandidate;
    logger.debug('attachedStreamInfo', attachedStreamInfo);
    this.#rtcpPeer.sender = attachedStreamInfo.sender;
    await this.#rtcpPeer.setRemoteDescription(attachedStreamInfo.jsep);
  }

  hangup() {
    this.#rtcpPeer.close();
    this.#rtcpPeer = null;

    this.#plugin.session.emit('member:hangup', {
      info: this.#info,
      sender: this.handleId
    })
  }
}
