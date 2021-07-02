import {
  addRtcSimulcastTrack,
  disableSimulcastTopLayer,
  findVideoSender,
  getActiveEncodingsState,
  SIMULCAST,
  SimulcastActiveState,
  SimulcastSettings,
  toggleSelectedSimulcastLayer
} from "../util/rtcUtil";
import Session from "../Session";

type PublisherMemento = {
  bandwidthLimit: number,
};

export default class SimulcastPublisherStrategy {
  private rtcConnection: RTCPeerConnection;
  private session: Session;
  private simulcastSettings: SimulcastSettings;
  private bandwidthLimit: number = SIMULCAST.high;
  private memento: PublisherMemento;

  constructor(rtcConnection: RTCPeerConnection, session: Session, simulcastSettings: SimulcastSettings) {
    this.rtcConnection = rtcConnection;
    this.session = session;
    this.simulcastSettings = simulcastSettings;
  }

  public addVideoSimulcastTrack(substream: number, track: MediaStreamTrack): void {
    const effectiveSubstream = Math.min(substream, this.bandwidthLimit);
    const encodingsState = getActiveEncodingsState(effectiveSubstream);
    addRtcSimulcastTrack(this.rtcConnection, track, this.simulcastSettings, encodingsState);
  }

  public adjustPublishingBandwidth(substream: number): boolean {
    const {bandwidthLimit} = this;
    if (substream <= bandwidthLimit) {
      const encodingState = getActiveEncodingsState(substream);
      if (encodingState) {
        this.requestChangeSimulcastPublishing(encodingState);
        return true;
      }
    } else {
      return false;
    }
  }

  public reduceUplink(): boolean {
    const result = disableSimulcastTopLayer(this.rtcConnection);
    if (result) {
      const videoRtpSender = findVideoSender(this.rtcConnection);
      if (videoRtpSender) {
        const params = videoRtpSender.getParameters();
        const activeEncodings = params.encodings
          .filter(encoding => encoding.active)
          .map(encoding => encoding.rid);
        if (activeEncodings.includes('h')) {
          this.bandwidthLimit = SIMULCAST.high;
          return true;
        }
        if (activeEncodings.includes('m')) {
          this.bandwidthLimit = SIMULCAST.medium;
          return true;
        }
        this.bandwidthLimit = SIMULCAST.low;
        return true;
      }
    }
    return false;
  }

  public switchToThumbnail(): void {
    this.saveMemento();
    this.bandwidthLimit = SIMULCAST.low;
    this.adjustPublishingBandwidth(SIMULCAST.low);
  }

  public restoreFromThumbnail(substream: number): void {
    this.loadMemento();
    const effectiveSubstream = Math.min(substream, this.bandwidthLimit);
    const encodingState = getActiveEncodingsState(effectiveSubstream);
    this.requestChangeSimulcastPublishing(encodingState);
  }

  private saveMemento(): void {
    this.memento = {
      bandwidthLimit: this.bandwidthLimit,
    }
  }

  private loadMemento(): void {
    const {memento} = this;
    if (memento) {
      this.bandwidthLimit = memento.bandwidthLimit;
      this.memento = null;
    }
  }

  private requestChangeSimulcastPublishing = (state: SimulcastActiveState) => {
    if (this.rtcConnection.connectionState === 'connected') {
      toggleSelectedSimulcastLayer(this.rtcConnection, state);
    } else {
      const handler = event => {
        if (event.type === 'publisher') {
          toggleSelectedSimulcastLayer(this.rtcConnection, state);
          this.session.off('webrtcup', handler);
        }
      }
      this.session.on('webrtcup', handler);
    }
  }
}
