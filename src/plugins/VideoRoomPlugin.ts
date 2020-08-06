import {BasePlugin} from "./BasePlugin";
import {randomString} from "../util/util";
import {logger} from "../util/logger";
import {Member} from "../Member";
import DeviceManager from "../util/DeviceManager";
import {v4 as uuidv4} from 'uuid';
import {VolumeMeter} from "../util/SoundMeter";
import {StunServer} from "../types";

export class VideoRoomPlugin extends BasePlugin {
  name = 'janus.plugin.videoroomjs'
  memberList: any = {}
  room_id = 1234
  stunServers: StunServer[]
  iceCandidates: any[] = []
  publishers = null
  displayName: string = ''
  rtcConnection: any = null;

  stream: MediaStream;
  offerOptions: any = {}
  isVideoOn: boolean = true
  isAudioOn: boolean = true
  isNoiseFilterOn: boolean = false
  isTalking: boolean = false
  private volumeMeter: VolumeMeter;

  constructor(options: any = {}) {
    super()
    this.opaqueId = `videoroomtest-${randomString(12)}`;
    this.displayName = options.displayName
    this.room_id = options.roomId
    this.stunServers = options.stunServers
    this.rtcConnection = new RTCPeerConnection({
      iceServers: this.stunServers,
    })
    logger.debug('Init plugin', this);
    // Send ICE events to Janus.
    this.rtcConnection.onicecandidate = (event) => {

      if (this.rtcConnection.signalingState !== 'stable') {
        return;
      }
      if (!event.candidate) {
        return
      }
      this.sendTrickle(event.candidate)
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

    const pluginData = msg?.plugindata?.data

    if (pluginData?.error_code) {
      return
    }

    if (msg.janus === 'trickle') {
      await this.onTrickle(msg)
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
      this.onHangup(msg.sender)
      return

    }

    if (pluginData?.publishers) {
      this.onReceivePublishers(msg)
    }

    if (pluginData?.videoroom === 'joined') {
      this.onPublisherInitialStateUpdate(msg)
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

  private async onTrickle(message) {
    const candidate = message?.candidate?.completed ? null : message?.candidate
    if (this.rtcConnection.remoteDescription) {
      await this.rtcConnection.addIceCandidate(candidate)
      return
    }
    this.iceCandidates.push(candidate)
  }

  private async processIceCandidates() {
    for(let i = 0; i < this.iceCandidates.length; i++) {
      await this.rtcConnection.addIceCandidate(this.iceCandidates[i])
    }
    this.iceCandidates = []
  }

  private onVideoRoomAttached(message) {
    if (this.memberList[message?.plugindata?.data?.id]) {
      this.memberList[message?.plugindata?.data?.id].answerAttachedStream(message);
    }
  }

  private onPublisherStateUpdate(message) {
    if (this.memberList[message?.plugindata?.data?.newStatePublisher]) {
      this.memberList[message?.plugindata?.data?.newStatePublisher].updateMemberStateFromMessage(message);
    }
  }

  private onPublisherInitialStateUpdate(message) {
    const publishers = message?.plugindata?.data?.publishers
    publishers.forEach(publisher => {
      if (this.memberList[publisher?.id]) {
        this.memberList[publisher?.id].updateMemberState(publisher?.state);
      }
    })
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
    let options: any = {
      audio: true,
      video: {
        facingMode: "user",
        width: {min: 480, ideal: 1280, max: 1920},
        height: {min: 320, ideal: 720, max: 1080}
      },
    }
    try {
      this.stream = await navigator.mediaDevices.getUserMedia(options);
      logger.info('Got local user media.');

    } catch (e) {
      try {
        options.video = false
        this.stream = await navigator.mediaDevices.getUserMedia(options);
      } catch (ex) {
        options.audio = false
        options.video = false
        this.stream = await navigator.mediaDevices.getUserMedia(options);
      }
    }
    this.trackMicrophoneVolume()

    return {
      stream: this.stream,
      options
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
    const {options} = await this.requestAudioAndVideoPermissions();

    const joinResult = await this.sendMessage({
      request: 'join',
      room: this.room_id,
      ptype: 'publisher',
      display: this.displayName,
      opaque_id: this.opaqueId,
    });

    this.session.emit('member:join', {
      stream: this.stream,
      joinResult,
      sender: 'me',
      type: 'publisher',
      name: this.displayName,
      state: {},
      id: uuidv4(),
    })

    logger.info('Adding local user media to RTCPeerConnection.');
    // pass through audio context
    this.addTracks(this.stream.getVideoTracks());
    this.addTracks(this.volumeMeter.getOutputStream().getTracks());

    await this.sendConfigureMessage({
      audio: true,
      video: true,
    })
    await this.sendInitialState()
  }

  trackMicrophoneVolume() {
    const volumeMeter = new VolumeMeter(this.stream)
    volumeMeter.onAudioProcess(async (newValue, oldValue) => {
      if (newValue >= 20 && oldValue < 20) {
        this.isNoiseFilterOn && volumeMeter.unmute();
        this.isTalking = true;
        await this.sendStateMessage({ isTalking: true });
      } else if (newValue <= 20 && oldValue > 20) {
        this.isNoiseFilterOn && volumeMeter.mute();
        this.isTalking = false;
        await this.sendStateMessage({ isTalking: false });
      }
    });
    this.volumeMeter = volumeMeter;
  }

  async startVideo() {
    DeviceManager.toggleVideoMute(this.stream)
    await this.enableVideo(true)
    this.isVideoOn = true
    await this.sendStateMessage({
      video: true
    })
  }

  async stopVideo() {
    DeviceManager.toggleVideoMute(this.stream)
    await this.enableVideo(false)
    this.isVideoOn = false
    await this.sendStateMessage({
      video: false
    })
  }

  async startAudio() {
    DeviceManager.toggleAudioMute(this.stream)
    await this.enableAudio(true)
    this.isAudioOn = true
    await this.sendStateMessage({
      audio: true
    })
  }

  async stopAudio() {
    DeviceManager.toggleAudioMute(this.stream)
    await this.enableAudio(false)
    this.isAudioOn = false
    await this.sendStateMessage({
      audio: false
    })
  }

  startNoiseFilter() {
    this.isNoiseFilterOn = true;
    if (!this.isTalking) {
      this.volumeMeter.mute();
    }
  }

  stopNoiseFilter() {
    this.isNoiseFilterOn = false;
    this.volumeMeter.unmute();
  }

  async changePublisherStream(stream) {
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
        sender.replaceTrack(track);
      })
    });

    this.stream = stream
  }

  async sendConfigureMessage(options) {
    const jsepOffer = await this.rtcConnection.createOffer(this.offerOptions);
    await this.rtcConnection.setLocalDescription(jsepOffer);

    const confResult = await this.sendMessage({
      request: 'configure',
      ...options,
    }, jsepOffer);

    await this.rtcConnection.setRemoteDescription(confResult.jsep);
    await this.processIceCandidates()

    return confResult
  }

  public async sendStateMessage(data = {}) {
    await this.sendMessage({
      request: 'state',
      data,
    })
  }

  private async sendInitialState() {
    await this.sendMessage({
      request: 'state',
      data: {
        status: 'online',
        name: this.displayName
      },
    })
  }

  addTracks(tracks: MediaStreamTrack[]) {
    tracks.forEach((track) => {
      this.rtcConnection.addTrack(track);
    });
  }

  async hangup() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => {
        track.stop()
      })
    }
    if (this.rtcConnection) {
      this.rtcConnection.close();
      this.rtcConnection = null;
    }

    await this.send({janus: 'hangup'});
  }

  close() {
    if (this.rtcConnection) {
      this.rtcConnection.close();
      this.rtcConnection = null;
    }
    const members = Object.values(this.memberList);
    members.forEach((member: any) => member.hangup());
  }
}
