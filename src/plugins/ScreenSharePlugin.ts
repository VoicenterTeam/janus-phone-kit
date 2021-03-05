import {BasePlugin} from "./BasePlugin";
import {logger} from '../util/logger'
import {randomString, retryPromise} from '../util/util'
import {StunServer} from "../types";
import {addRtcSimulcastTrack} from "../util/rtcUtil";

export class ScreenSharePlugin extends BasePlugin {
  name = 'janus.plugin.videoroomjs'
  memberList = {}
  videoElement = null
  room_id = 1234
  stunServers: StunServer[]
  rtcConnection: any = null
  stream: MediaStream;
  sessionInfo = {}
  private simulcastSettings: any = {}
  // private onSlowlink = onceInTimeoutClosure(() => disableSimulcastTopLayer(this.rtcConnection, this.session), 5000, 3);

  /**
   * @type {VideoRoomPlugin}
   */
  VideoRoomPlugin = null

  constructor(options: any = {}) {
    super()

    this.opaqueId = `videoroomtest-${randomString(12)}`;
    this.room_id = options.roomId
    this.VideoRoomPlugin = options.videoRoomPlugin
    this.stream = options.stream
    this.sessionInfo = options.sessionInfo
    this.simulcastSettings = options.simulcastSettings

    logger.debug('Init plugin', this);
    this.stunServers = options.stunServers
    this.rtcConnection = new RTCPeerConnection({
      iceServers: this.stunServers,
    });
    // Send ICE events to Janus.
    this.rtcConnection.onicecandidate = (event) => {
      this.sendTrickle(event.candidate || null)
        .catch((err) => {
          logger.warn(err)
        });
    };
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
    return this.sendMessage({ request: 'bitrate', bitrate });
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
/*    if (msg.janus === 'slowlink') {
      if (!msg.uplink) {
        await this.onSlowlink();
      }
      this.session.emit('slowlink', msg);
    }*/
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
    try {
      this.stream.getVideoTracks()[0].onended = () => this.detachSharing();
      logger.info('Got local user Screen .');

      logger.info('Got local user Screen  localMedia:', this.stream);
    } catch (e) {
      console.error('No screen share on this browser ...');
      await this.detachSharing();
      return;
    }

    const joinResult = await this.sendMessage({
      request: 'join',
      room: this.room_id,
      ptype: 'publisher',
      display: 'Screen Share',
      opaque_id: this.opaqueId,
      customInfo: {
        ...this.sessionInfo,
        screenShare: true,
      }
    });

    logger.info('Adding local user media to RTCPeerConnection.');
    this.stream.getVideoTracks().forEach(track => {
      addRtcSimulcastTrack(this.rtcConnection, track, this.simulcastSettings, { high: true })
    });
    logger.info('Creating SDP offer. Please wait...');

    const options: any = {
      audio: false,
      video: true,
    }
    const jsepOffer = await this.rtcConnection.createOffer(options);


    logger.info('SDP offer created.');

    logger.info('Setting SDP offer on RTCPeerConnection');
    await this.rtcConnection.setLocalDescription(jsepOffer);

    logger.info('Getting SDP answer from Janus to our SDP offer. Please wait...');

    let confResult
    try {
      confResult = await retryPromise(
        () => this.sendMessage({
          request: 'configure',
          audio: false,
          video: true,
        }, jsepOffer)
      )
    } catch (e) {
      this.session.emit('disconnected');
      this.session.offAll()
      return
    }
    logger.info('Received SDP answer from Janus for ScreenShare.', confResult);
    logger.debug('Setting the SDP answer on RTCPeerConnection. The `onaddstream` event will fire soon.');

    // @ts-ignore
    await this.rtcConnection.setRemoteDescription(confResult.jsep);
    this.session.emit('screenShare:started', this.stream)
  }

  async stopSharing() {
    this.stream?.getVideoTracks().forEach(track => track.stop());
    this.stream = null;
    await this.detachSharing();
  }

  async detachSharing() {
    await this.send({janus: 'hangup'});
    await this.detach();
    this.session.emit('screenShare:stopped')
    if (this.rtcConnection) {
      this.rtcConnection.close();
      this.rtcConnection = null;
    }
  }

  close() {
    if (this.rtcConnection) {
      this.rtcConnection.close();
      this.rtcConnection = null;
    }
  }

}
