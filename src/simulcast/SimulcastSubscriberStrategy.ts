import Session from "../Session";
import {Member} from "../Member";
import {SIMULCAST, SimulcastSettings} from "../util/rtcUtil";
import {logger} from "../util/logger";

type SubscriberMemento = {
  substream: number,
  bandwidthLimit: number,
};

export default class SimulcastSubscriberStrategy {
  private session: Session;
  private memberList: any;
  private substream: number;
  private temporal: number = SIMULCAST.high;
  private bandwidthLimit: number;
  private memento: SubscriberMemento

  constructor(session: Session, memberList, simulcastSettings: SimulcastSettings) {
    this.session = session;
    this.memberList = memberList;
    if (typeof simulcastSettings.forceSubstream === 'number') {
      this.substream = simulcastSettings.forceSubstream;
      this.bandwidthLimit = simulcastSettings.forceSubstream;
    } else {
      this.substream = SIMULCAST.high;
      this.bandwidthLimit = SIMULCAST.high;
    }
  }

  public adjustSubscriberBandwidth(substream: number): boolean {
    if (substream <= this.bandwidthLimit) {
      return this.setSubstream(substream);
    }
    return false;
  }

  public getSubstream(): number {
    return this.substream;
  }

  public setSubstream(substream: number): boolean {
    if (this.substream !== substream) {
      this.substream = substream;
      Object.values(this.memberList)
        .filter((member: Member) => !member.isSharedScreen())
        .forEach((member: Member) => member.setSubstream(substream));
      return true;
    }
    return false;
  }

  public setTemporal(temproral: number): boolean {
    if (this.temporal !== temproral) {
      this.temporal = temproral;
      Object.values(this.memberList)
        .filter((member: Member) => !member.isSharedScreen())
        .forEach((member: Member) => member.setTemporal(temproral));
      return true;
    }
    return false;
  }

  public reduceDownlink(): boolean {
    const reduced = this.switchToLowerSubstream();
    this.bandwidthLimit = this.substream;
    return reduced;
  }

  private switchToLowerSubstream(): boolean {
    switch (this.substream) {
      case SIMULCAST.high:
        return this.setSubstream(SIMULCAST.medium);
      case SIMULCAST.medium:
        if (this.temporal == SIMULCAST.high) {
          return this.setTemporal(SIMULCAST.low);
        } else {
          const changedSubstream = this.setSubstream(SIMULCAST.low);
          const changedTemporal = this.setTemporal(SIMULCAST.high);
          return changedSubstream || changedTemporal;
        }
      case SIMULCAST.low:
        if (this.temporal !== SIMULCAST.low) {
          return this.setSubstream(SIMULCAST.low);
        } else {
          // we have lowest quality but connection still sucks
          return false;
        }
      default: {
        logger.error('Illegal simulcast substream number', this.substream);
        return false;
      }
    }
  }

  public switchToThumbnail(): void {
    this.saveMemento();
    this.bandwidthLimit = SIMULCAST.low;
    this.setSubstream(SIMULCAST.low);
  }

  public restoreFromThumbnail(): void {
    this.loadMemento();
  }

  private saveMemento(): void {
    this.memento = {
      substream: this.substream,
      bandwidthLimit: this.bandwidthLimit,
    }
  }

  private loadMemento(): void {
    if (this.memento) {
      this.bandwidthLimit = this.memento.bandwidthLimit;
      this.setSubstream(this.memento.substream);
      this.memento = null;
    }
  }
}
