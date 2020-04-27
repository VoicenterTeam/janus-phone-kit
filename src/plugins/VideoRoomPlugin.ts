import { BasePlugin } from "./BasePlugin";
import { randomString } from "../util/util";
import { logger } from "../util/logger";
import { Member } from "../Member";

export class VideoRoomPlugin extends BasePlugin {
  name = 'janus.plugin.videoroom'
  memberList: any = {}
  videoElement = null
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

    this.createVideoElement()
  }

  /**
   * Creates html video element
   * @return {null}
   */
  createVideoElement() {
    this.videoElement = document.createElement('video')
    this.videoElement.width = 320;
    this.videoElement.controls = true;
    this.videoElement.muted = true;
    document.body.appendChild(this.videoElement);

    return this.videoElement
  }

  playVideo(media, joinResult) {
    logger.info('Playing local user media in video element.', joinResult);
    if (!media) {
      return
    }
    this.videoElement.srcObject = media;
    this.videoElement.play();
  }

  /**
   * Start or stop echoing video.
   * @public
   * @param {Boolean} enabled
   * @return {Object} The response from Janus
   */
  async enableVideo(enabled) {
    return this.sendMessage({ video: enabled });
  }

  /**
   * Start or stop echoing audio.
   *
   * @public
   * @param {Boolean} enabled
   * @return {Object} The response from Janus
   */
  async enableAudio(enabled) {
    return this.sendMessage({ audio: enabled });
  }

  /**
   * Send a REMB packet to the browser to set the media submission bandwidth.
   *
   * @public
   * @param {Number} bitrate - Bits per second
   * @return {Object} The response from Janus
   */
  async setBitrate(bitrate) {
    return this.sendMessage({ bitrate });
  }

  /**
   * Receive an asynchronous ('pushed') message sent by the Janus core.
   *
   * @public
   * @override
   */
  async receive(msg) {
    logger.info('Received message from Janus', msg);

    if (msg.plugindata && msg.plugindata.data.error_code) {
      logger.error('plugindata.data error :', msg.plugindata.data);
      return
    }

    if (msg.plugindata && msg.plugindata.data.videoroom === 'attached') {
      if (this.memberList[msg.plugindata.data.id]) {
        this.memberList[msg.plugindata.data.id].answerAttachedStream(msg);
      } else {
        this.answerAttachedStream(msg);
      }
      return
    }

    if (msg.janus === 'hangup') {
      const members = Object.values(this.memberList)
      const hangupMember: any = members.find((member: any) => member.HandleId === msg.sender);
      hangupMember.hangup();
      return

    }
    if (msg.plugindata && msg.plugindata.data.publishers) {

      msg.plugindata.data.publishers.forEach((publisher) => {
        console.log('plugindata.data.publishers', publisher);

        if (!this.memberList[publisher.id] && !this.myFeedList.includes(publisher.id)) {
          this.memberList[publisher.id] = new Member(publisher, this);
          this.memberList[publisher.id].attachMember();
        }
      });

      this.publishers = msg.plugindata.data.publishers;
      this.private_id = msg.plugindata.data.private_id;
    }
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
    console.log('onAttached !!!!!!!!!!!!!!!!!!!!!!');
    logger.info('Asking user to share media. Please wait...');
    let localMedia;
    try {
      localMedia = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true,
      });
      logger.info('Got local user media.');

      console.log('Lets Join a room localMedia:', localMedia);
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
    const joinResult = await this.sendMessage({
      request: 'join',
      room: this.room_id,
      ptype: 'publisher',
      display: '33333',
      opaque_id: this.opaqueId,
    });

    this.playVideo(localMedia, joinResult)

    logger.info('Adding local user media to RTCPeerConnection.');
    this.#rtcConnection.addStream(localMedia);

    logger.info('Creating SDP offer. Please wait...');
    const options: any = {
      audio: true,
      video: true,
    }
    const jsepOffer = await this.#rtcConnection.createOffer(options);


    logger.info('SDP offer created.');

    logger.info('Setting SDP offer on RTCPeerConnection');
    await this.#rtcConnection.setLocalDescription(jsepOffer);

    logger.info('Getting SDP answer from Janus to our SDP offer. Please wait...');

    const confResult = await this.sendMessage({
      request: 'configure',
      audio: true,
      video: true
    }, jsepOffer);

    console.log('Received SDP answer from Janus.', confResult);
    logger.debug('Setting the SDP answer on RTCPeerConnection. The `onaddstream` event will fire soon.');
    await this.#rtcConnection.setRemoteDescription(confResult.jsep);
  }

  answerAttachedStream(attachedStreamInfo) {
    console.log('attachedStreamInfo for non memeber WTF ???', attachedStreamInfo);
  }
}
