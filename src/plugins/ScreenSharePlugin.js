import { BasePlugin } from "./BasePlugin";
import { logger } from '../util/logger'
import { randomString } from '../util/util'

export class ScreenSharePlugin extends BasePlugin {
  name = 'janus.plugin.videoroom'
  memberList = {}
  videoElement = null
  room_id = 1234
  
  #rtcConnection = new RTCPeerConnection();

  constructor() {
    super()

    this.opaqueId = `videoroomtest-${randomString(12)}`;
    logger.debug('Init plugin', this);

    this.#rtcConnection = new RTCPeerConnection();
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
    // const that = this;
    logger.info('on receive ScreenSharePlugin', msg);
    if (msg.plugindata && msg.plugindata.data.error_code) {
      logger.error('plugindata.data ScreenSharePlugin error :', msg.plugindata.data);
    } else if (msg.plugindata && msg.plugindata.data.videoroom === 'joined') {
      logger.info('Self Joiend event ', msg.plugindata.data.id);

      // TODO a plugin shouldn't depend on another plugin
      if (this.VideoRoomPlugin) {
        logger.info('VideoRoomPlugin ', this.VideoRoomPlugin);
        this.VideoRoomPlugin.myFeedList.push(msg.plugindata.data.id);
      }
    }
    logger.info('Received  message from Janus ScreenSharePlugin', msg);
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
    logger.info('onAttached ScreenSharePlugin !!!!!!!!!!!!!!!!!!!!!!');
    logger.info('Asking user to share media. Please wait...');

    let localMedia;

    try {
      localMedia = await navigator.mediaDevices.getDisplayMedia();
      logger.info('Got local user Screen .');

      logger.info('Got local user Screen  localMedia:', localMedia);
    } catch (e) {
      console.error('No screen share on this browser ...');
      return;
    }

    const joinResult = await this.sendMessage({
      request: 'join', room: this.room_id, ptype: 'publisher', display: 'Screen Share', opaque_id: this.opaqueId,
    });
    this.playVideo(localMedia, joinResult)

    logger.info('Adding local user media to RTCPeerConnection.');
    this.#rtcConnection.addStream(localMedia);
    logger.info('Creating SDP offer. Please wait...');

    const jsepOffer = await this.#rtcConnection.createOffer({
      audio: false,
      video: true,
    });


    logger.info('SDP offer created.');

    logger.info('Setting SDP offer on RTCPeerConnection');
    await this.#rtcConnection.setLocalDescription(jsepOffer);

    logger.info('Getting SDP answer from Janus to our SDP offer. Please wait...');

    const confResult = await this.sendMessage({ request: 'configure', audio: false, video: true }, jsepOffer);
    logger.info('Received SDP answer from Janus for ScreenShare.', confResult);
    logger.debug('Setting the SDP answer on RTCPeerConnection. The `onaddstream` event will fire soon.');
    await this.#rtcConnection.setRemoteDescription(confResult.jsep);
  }

}
