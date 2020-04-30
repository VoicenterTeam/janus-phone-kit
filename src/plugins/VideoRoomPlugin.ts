import {BasePlugin} from "./BasePlugin";
import {randomString} from "../util/util";
import {logger} from "../util/logger";
import {Member} from "../Member";

export class VideoRoomPlugin extends BasePlugin {
  name = 'janus.plugin.videoroom'
  memberList: any = {}
  room_id = 1234
  publishers = null
  #rtcConnection: any = new RTCPeerConnection();

  constructor() {
    super()
    this.opaqueId = `videoroomtest-${randomString(12)}`;
    logger.debug('Init plugin', this);
    // Send ICE events to Janus.
    this.#rtcConnection.onicecandidate = (event) => {

      if (this.#rtcConnection.signalingState !== 'stable') {
        return;
      }
      this.sendTrickle(event.candidate || null)
        .catch((err) => {
          logger.warn(err)
        });
    };
  }

  /**
   * Start or stop echoing video.
   * @public
   * @param {Boolean} enabled
   * @return {Object} The response from Janus
   */
  async enableVideo(enabled) {
    return this.sendMessage({video: enabled});
  }

  /**
   * Start or stop echoing audio.
   *
   * @public
   * @param {Boolean} enabled
   * @return {Object} The response from Janus
   */
  async enableAudio(enabled) {
    return this.sendMessage({audio: enabled});
  }

  /**
   * Send a REMB packet to the browser to set the media submission bandwidth.
   *
   * @public
   * @param {Number} bitrate - Bits per second
   * @return {Object} The response from Janus
   */
  async setBitrate(bitrate) {
    return this.sendMessage({bitrate});
  }

  /**
   * Receive an asynchronous ('pushed') message sent by the Janus core.
   *
   * @public
   * @override
   */
  async receive(msg) {
    logger.info('Received message from Janus', msg);
    const {plugindata} = msg
    if (plugindata?.data?.error_code) {
      logger.error('plugindata.data error :', msg.plugindata.data);
      return
    }

    if (plugindata?.data?.videoroom === 'attached') {
      this.onVideoRoomAttached(msg)
      return
    }

    if (msg?.janus === 'hangup') {
      this.onHangup(msg.sender)
      return

    }
    if (msg?.plugindata?.data?.publishers) {
      this.onReceivePublishers(msg)
    }
  }

  private onHangup(sender) {
    const members = Object.values(this.memberList)
    const hangupMember: any = members.find((member: any) => member.handleId === sender);

    if (!hangupMember) {
      return
    }
    hangupMember.hangup();
  }

  private onVideoRoomAttached(message) {
    if (this.memberList[message?.plugindata?.data?.id]) {
      this.memberList[message?.plugindata?.data?.id].answerAttachedStream(message);
    }
  }

  private onReceivePublishers(msg) {
    msg?.plugindata?.data?.publishers.forEach((publisher) => {

      if (!this.memberList[publisher.id] && !this.myFeedList.includes(publisher.id)) {
        this.memberList[publisher.id] = new Member(publisher, this);
        this.memberList[publisher.id].attachMember();
      }
    });

    this.publishers = msg?.plugindata?.data?.publishers;
    this.private_id = msg?.plugindata?.data?.private_id;
  }

  async requestAudioAndVideoPermissions() {
    logger.info('Asking user to share media. Please wait...');
    let localMedia;
    try {
      localMedia = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true,
      });
      logger.info('Got local user media.');

    } catch (e) {
      try {
        console.log('Can get Video Lets try audio only ...');
        localMedia = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: false,
        });
      } catch (ex) {
        console.log('Can get audio as well Lets try no input ...', ex);
        localMedia = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: false,
        });
      }
    }
    return localMedia
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
  async onAttached() {
    let localMedia = await this.requestAudioAndVideoPermissions();

    const joinResult = await this.sendMessage({
      request: 'join',
      room: this.room_id,
      ptype: 'publisher',
      display: '33333',
      opaque_id: this.opaqueId,
    });

    this.session.emit('member:join', {
      stream: localMedia,
      joinResult,
      sender: 'me',
      type: 'publisher',
    })

    logger.info('Adding local user media to RTCPeerConnection.');
    this.#rtcConnection.addStream(localMedia);

    const options: any = {
      audio: true,
      video: true,
    }
    const jsepOffer = await this.#rtcConnection.createOffer(options);
    await this.#rtcConnection.setLocalDescription(jsepOffer);

    const confResult = await this.sendMessage({
      request: 'configure',
      audio: true,
      video: true
    }, jsepOffer);

    console.log('Received SDP answer from Janus.', confResult);
    logger.debug('Setting the SDP answer on RTCPeerConnection. The `onaddstream` event will fire soon.');
    await this.#rtcConnection.setRemoteDescription(confResult.jsep);
  }
}
