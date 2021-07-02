import get from 'lodash/get';
import SimulcastSubscriberStrategy from "./SimulcastSubscriberStrategy";
import SimulcastPublisherStrategy from "./SimulcastPublisherStrategy";
import {SimulcastSettings} from "../util/rtcUtil";
import Session from "../Session";
import VideoRoomSimulcastFacade from "./VideoRoomSimulcastFacade";

export default class VideoRoomSimulcastFacadeImpl implements VideoRoomSimulcastFacade {
  private rtcConnection: RTCPeerConnection;
  private session: Session;
  private memberList: any;
  private simulcastSettings: SimulcastSettings;
  private publisherStrategy: SimulcastPublisherStrategy;
  private subscriberStrategy: SimulcastSubscriberStrategy;

  constructor(rtcConnection, session, simulcastSettings, memberList) {
    this.rtcConnection = rtcConnection;
    this.session = session;
    this.memberList = memberList;
    this.simulcastSettings = simulcastSettings;
    this.publisherStrategy = new SimulcastPublisherStrategy(rtcConnection, session, simulcastSettings);
    this.subscriberStrategy = new SimulcastSubscriberStrategy(session, memberList, simulcastSettings);
    this.session.on('screenShare:started', () => this.switchToThumbnail());
    this.session.on('member:join', member => {
      if (member.info.screenShare) {
        this.switchToThumbnail();
      }
    });
    this.session.on('screenShare:stopped', () => this.restoreFromThumbnail());
    this.session.on('member:hangup', member => {
      if (get(member, 'info.customInfo.screenShare')) {
        this.restoreFromThumbnail();
      }
    });
  }

  public adjustBandwidth(): void {
    const substream = this.getSubstreamForMembersAmount();
    const publishingAdjusted = this.publisherStrategy.adjustPublishingBandwidth(substream);
    if (!publishingAdjusted) {
      this.session.emit('info', `Failed to publish substream ${substream}. Upgrade locked due to previous network issues`);
    }
/*    const subscribersAdjusted = this.subscriberStrategy.adjustSubscriberBandwidth(substream);
    if (!subscribersAdjusted) {
      this.session.emit('info', `Failed to subscribe substream ${substream}. Upgrade locked due to previous network issues`);
    }*/
  }

  private getSubstreamForMembersAmount(): number {
    const membersAmount = Object.keys(this.memberList).length;
    const {maxDownlinkKbps, high, medium, low} = this.simulcastSettings;
    const substreams = [high, medium, low];
    const rid = substreams.find(
      (rid: any) => rid.maxBitrateKbps * membersAmount <= maxDownlinkKbps
    ) || low;
    return substreams.length - substreams.indexOf(rid) - 1;
  }

  public reduceDownlink(): void {
    const isReduced = this.subscriberStrategy.reduceDownlink();
    if (isReduced) {
      this.session.emit('info', 'Downlink reduced due to network issues');
    } else {
      this.session.emit('poor-connection', {type: 'downlink'});
    }
  }

  public reduceUplink(): void {
    const isReduced = this.publisherStrategy.reduceUplink();
    if (isReduced) {
      this.session.emit('info', 'Uplink reduced due to network issues');
    } else {
      this.session.emit('poor-connection', {type: 'uplink'});
    }
  }

  getActiveDownlinkSubstream(): number {
    return this.subscriberStrategy.getSubstream();
  }

  private switchToThumbnail(): void {
    this.publisherStrategy.switchToThumbnail();
    // this.subscriberStrategy.switchToThumbnail();
  }

  private restoreFromThumbnail(): void {
    const substream = this.getSubstreamForMembersAmount();
    this.publisherStrategy.restoreFromThumbnail(substream);
    // this.subscriberStrategy.restoreFromThumbnail();
  }

  addVideoSimulcastTrack(track: MediaStreamTrack): void {
    const substream = this.getSubstreamForMembersAmount();
    this.publisherStrategy.addVideoSimulcastTrack(substream, track);
  }
}
