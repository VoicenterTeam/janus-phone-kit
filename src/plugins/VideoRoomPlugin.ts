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

  subscriberId: any = null;

  stream: MediaStream;
  offerOptions: any = {}
  isVideoOn: boolean = true
  isAudioOn: boolean = true
  isNoiseFilterOn: boolean = false
  isTalking: boolean = false
  mediaConstraints: any = {
    video: {
      width: { min: 320, ideal: 640, max: 1280 },
      height: { min: 180, ideal: 360, max: 720 },
      aspectRatio: { ideal: 1.7777777778 }
    },
    audio: {
      sampleSize: 16,
      channelCount: 2
    }
  }
  private volumeMeter: VolumeMeter;

  constructor(options: any = {}) {
    super()
    this.opaqueId = `videoroomtest-${randomString(12)}`;
    this.displayName = options.displayName
    this.room_id = options.roomId
    this.stunServers = options.stunServers
    this.mediaConstraints = options.mediaConstraints;
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

    if(msg.janus === 'webrtcup') {
      this.session.emit('webrtcup');
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

    if (pluginData?.videoroom === 'joined') {
      this.onPublisherInitialStateUpdate(msg)
    }
    if (pluginData?.videoroom === 'event') {
      // Check if we got a simulcast-related event from this publisher
      var substream = pluginData.substream;
      var temporal = pluginData.temporal;
      if((substream !== null && substream !== undefined) || (temporal !== null && temporal !== undefined)) {
        this.onSimulcastUpdate(pluginData);
      }
      return;
    }
  }

  private onHangup(unpublished) {
    const hangupMember = this.memberList[unpublished];

    if (!hangupMember) {
      return
    }
    hangupMember.hangup();
    delete this.memberList[unpublished];
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

  private onSimulcastUpdate(pluginData) {
    console.log('onSimulcastUpdate call=========================')
    // if(!remoteFeed.simulcastStarted) {
    //   remoteFeed.simulcastStarted = true;
    //   // Add some new buttons
    //   addSimulcastButtons(remoteFeed.rfindex, remoteFeed.videoCodec === "vp8" || remoteFeed.videoCodec === "h264");
    // }
    // // We just received notice that there's been a switch, update the buttons
    // updateSimulcastButtons(remoteFeed.rfindex, substream, temporal);
  }

  private onReceivePublishers(msg) {
    const unprocessedMembers = { ...this.memberList };
    msg?.plugindata?.data?.publishers.forEach((publisher) => {

      delete unprocessedMembers[publisher.id];
      if (!this.memberList[publisher.id] && !this.myFeedList.includes(publisher.id)) {
        this.memberList[publisher.id] = new Member(publisher, this);
        this.memberList[publisher.id].attachMember();
      }
    });

    if (msg?.plugindata?.data?.videoroom === 'synced') {
      Object.keys(unprocessedMembers).forEach(key => {
        unprocessedMembers[key].hangup();
        delete this.memberList[key];
      });
    }
    this.publishers = msg?.plugindata?.data?.publishers;
    this.private_id = msg?.plugindata?.data?.private_id;
  }

  async loadStream() {
    const options = {...this.mediaConstraints};
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
    this.trackMicrophoneVolume();
    return {
      stream: this.stream,
      options
    }
  }

  async requestAudioAndVideoPermissions() {
    logger.info('Asking user to share media. Please wait...');
    return  await this.loadStream();
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
      audioRecv: false,
      audioSend: true,
      keepAudio: false,
      keepVideo: false,
      update: false,
      video: "hires",
      videoRecv: false,
      videoSend: true
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

  async changePublisherStream({ audioInput, videoInput }) {
    if(videoInput) {
      this.mediaConstraints.video.deviceId = { exact: videoInput };
    }
    if(audioInput) {
      this.mediaConstraints.audio = {deviceId: {exact: audioInput}};
    }
    const { stream } = await this.loadStream();
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
    return stream;
  }

  async sendConfigureMessage(options) {
    const jsepOffer = await this.rtcConnection.createOffer(this.offerOptions);
    jsepOffer.sdp = this.mungeSdpForSimulcasting(jsepOffer.sdp);
    await this.rtcConnection.setLocalDescription(jsepOffer.sdp);
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
    // tracks.forEach((track) => {
    //   this.rtcConnection.addTrack(track);
    // });
    for(let i = 0; i < tracks.length; i++) {
      let track = tracks[i];
      if (track.kind === 'video') {
        // let videoStream = this.stream.getVideoTracks();
        let transceiver = this.rtcConnection.addTransceiver(track, {
          direction: 'sendonly',
          streams: [this.stream]//,
          // sendEncodings: [
          //   { rid: "h", active: true, maxBitrate:  900000 },
          //   { rid: "m", active: true, maxBitrate: 600000, scaleResolutionDownBy: 2 },
          //   { rid: "l", active: true, maxBitrate: 100000, scaleResolutionDownBy: 4 }
          // ]
        });
      } else {
        //  this.rtcConnection.addTrack(track, this.stream);
        let transceiver = this.rtcConnection.addTransceiver(track, {
          direction: 'sendonly',
          streams: [this.stream]
        });
      }
    }
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

  public async syncParticipants() {
    await this.sendMessage({
      request: 'sync'
    });
  }

  close() {
    if (this.rtcConnection) {
      this.rtcConnection.close();
      this.rtcConnection = null;
    }
    const members = Object.values(this.memberList);
    members.forEach((member: any) => member.hangup());
  }

  mungeSdpForSimulcasting(sdp) {
    // Let's munge the SDP to add the attributes for enabling simulcasting
    // (based on https://gist.github.com/ggarber/a19b4c33510028b9c657)
    var lines = sdp.split("\r\n");
    var video = false;
    var ssrc = [ -1 ], ssrc_fid = [ -1 ];
    var cname = null, msid = null, mslabel = null, label = null;
    var insertAt = -1;
    for(var i=0; i<lines.length; i++) {
      var mline = lines[i].match(/m=(\w+) */);
      if(mline) {
        var medium = mline[1];
        if(medium === "video") {
          // New video m-line: make sure it's the first one
          if(ssrc[0] < 0) {
            video = true;
          } else {
            // We're done, let's add the new attributes here
            insertAt = i;
            break;
          }
        } else {
          // New non-video m-line: do we have what we were looking for?
          if(ssrc[0] > -1) {
            // We're done, let's add the new attributes here
            insertAt = i;
            break;
          }
        }
        continue;
      }
      if(!video)
        continue;
      var fid = lines[i].match(/a=ssrc-group:FID (\d+) (\d+)/);
      if(fid) {
        ssrc[0] = fid[1];
        ssrc_fid[0] = fid[2];
        lines.splice(i, 1); i--;
        continue;
      }
      if(ssrc[0]) {
        var match = lines[i].match('a=ssrc:' + ssrc[0] + ' cname:(.+)')
        if(match) {
          cname = match[1];
        }
        match = lines[i].match('a=ssrc:' + ssrc[0] + ' msid:(.+)')
        if(match) {
          msid = match[1];
        }
        match = lines[i].match('a=ssrc:' + ssrc[0] + ' mslabel:(.+)')
        if(match) {
          mslabel = match[1];
        }
        match = lines[i].match('a=ssrc:' + ssrc[0] + ' label:(.+)')
        if(match) {
          label = match[1];
        }
        if(lines[i].indexOf('a=ssrc:' + ssrc_fid[0]) === 0) {
          lines.splice(i, 1); i--;
          continue;
        }
        if(lines[i].indexOf('a=ssrc:' + ssrc[0]) === 0) {
          lines.splice(i, 1); i--;
          continue;
        }
      }
      if(lines[i].length == 0) {
        lines.splice(i, 1); i--;
        continue;
      }
    }
    if(ssrc[0] < 0) {
      // Couldn't find a FID attribute, let's just take the first video SSRC we find
      insertAt = -1;
      video = false;
      for(var i=0; i<lines.length; i++) {
        var mline = lines[i].match(/m=(\w+) */);
        if(mline) {
          var medium = mline[1];
          if(medium === "video") {
            // New video m-line: make sure it's the first one
            if(ssrc[0] < 0) {
              video = true;
            } else {
              // We're done, let's add the new attributes here
              insertAt = i;
              break;
            }
          } else {
            // New non-video m-line: do we have what we were looking for?
            if(ssrc[0] > -1) {
              // We're done, let's add the new attributes here
              insertAt = i;
              break;
            }
          }
          continue;
        }
        if(!video)
          continue;
        if(ssrc[0] < 0) {
          var value = lines[i].match(/a=ssrc:(\d+)/);
          if(value) {
            ssrc[0] = value[1];
            lines.splice(i, 1); i--;
            continue;
          }
        } else {
          var match = lines[i].match('a=ssrc:' + ssrc[0] + ' cname:(.+)')
          if(match) {
            cname = match[1];
          }
          match = lines[i].match('a=ssrc:' + ssrc[0] + ' msid:(.+)')
          if(match) {
            msid = match[1];
          }
          match = lines[i].match('a=ssrc:' + ssrc[0] + ' mslabel:(.+)')
          if(match) {
            mslabel = match[1];
          }
          match = lines[i].match('a=ssrc:' + ssrc[0] + ' label:(.+)')
          if(match) {
            label = match[1];
          }
          if(lines[i].indexOf('a=ssrc:' + ssrc_fid[0]) === 0) {
            lines.splice(i, 1); i--;
            continue;
          }
          if(lines[i].indexOf('a=ssrc:' + ssrc[0]) === 0) {
            lines.splice(i, 1); i--;
            continue;
          }
        }
        if(lines[i].length === 0) {
          lines.splice(i, 1); i--;
          continue;
        }
      }
    }
    if(ssrc[0] < 0) {
      // Still nothing, let's just return the SDP we were asked to munge
      // Janus.warn("Couldn't find the video SSRC, simulcasting NOT enabled");
      return sdp;
    }
    if(insertAt < 0) {
      // Append at the end
      insertAt = lines.length;
    }
    // Generate a couple of SSRCs (for retransmissions too)
    // Note: should we check if there are conflicts, here?
    ssrc[1] = Math.floor(Math.random()*0xFFFFFFFF);
    ssrc[2] = Math.floor(Math.random()*0xFFFFFFFF);
    ssrc_fid[1] = Math.floor(Math.random()*0xFFFFFFFF);
    ssrc_fid[2] = Math.floor(Math.random()*0xFFFFFFFF);
    // Add attributes to the SDP
    for(var i=0; i<ssrc.length; i++) {
      if(cname) {
        lines.splice(insertAt, 0, 'a=ssrc:' + ssrc[i] + ' cname:' + cname);
        insertAt++;
      }
      if(msid) {
        lines.splice(insertAt, 0, 'a=ssrc:' + ssrc[i] + ' msid:' + msid);
        insertAt++;
      }
      if(mslabel) {
        lines.splice(insertAt, 0, 'a=ssrc:' + ssrc[i] + ' mslabel:' + mslabel);
        insertAt++;
      }
      if(label) {
        lines.splice(insertAt, 0, 'a=ssrc:' + ssrc[i] + ' label:' + label);
        insertAt++;
      }
      // Add the same info for the retransmission SSRC
      if(cname) {
        lines.splice(insertAt, 0, 'a=ssrc:' + ssrc_fid[i] + ' cname:' + cname);
        insertAt++;
      }
      if(msid) {
        lines.splice(insertAt, 0, 'a=ssrc:' + ssrc_fid[i] + ' msid:' + msid);
        insertAt++;
      }
      if(mslabel) {
        lines.splice(insertAt, 0, 'a=ssrc:' + ssrc_fid[i] + ' mslabel:' + mslabel);
        insertAt++;
      }
      if(label) {
        lines.splice(insertAt, 0, 'a=ssrc:' + ssrc_fid[i] + ' label:' + label);
        insertAt++;
      }
    }
    lines.splice(insertAt, 0, 'a=ssrc-group:FID ' + ssrc[2] + ' ' + ssrc_fid[2]);
    lines.splice(insertAt, 0, 'a=ssrc-group:FID ' + ssrc[1] + ' ' + ssrc_fid[1]);
    lines.splice(insertAt, 0, 'a=ssrc-group:FID ' + ssrc[0] + ' ' + ssrc_fid[0]);
    lines.splice(insertAt, 0, 'a=ssrc-group:SIM ' + ssrc[0] + ' ' + ssrc[1] + ' ' + ssrc[2]);
    sdp = lines.join("\r\n");
    if(!sdp.endsWith("\r\n"))
      sdp += "\r\n";
    return sdp;
  }
}
