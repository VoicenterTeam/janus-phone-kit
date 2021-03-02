import VideoRoomSimulcastFacadeImpl from "../VideoRoomSimulcastFacadeImpl.ts";
import SimulcastPublisherStrategy from '../SimulcastPublisherStrategy.ts';
import { SIMULCAST } from '../../util/rtcUtil.ts';

jest.mock('../SimulcastSubscriberStrategy.ts', () => ({
  __esModule: true,
  default: class MockSubscriberStrategy {
    static switchToThumbnail = jest.fn();
    static restoreFromThumbnail = jest.fn();
    static adjustSubscriberBandwidth = jest.fn();

    constructor() {
      this.switchToThumbnail = MockSubscriberStrategy.switchToThumbnail;
      this.restoreFromThumbnail = MockSubscriberStrategy.restoreFromThumbnail;
      this.adjustSubscriberBandwidth = MockSubscriberStrategy.adjustSubscriberBandwidth;
    }
  },
}));

jest.mock('../SimulcastPublisherStrategy.ts', () => ({
  __esModule: true,
  default: class MockPublisherStrategy {
    static switchToThumbnail = jest.fn();
    static restoreFromThumbnail = jest.fn();
    static adjustPublishingBandwidth = jest.fn();

    constructor() {
      this.switchToThumbnail = MockPublisherStrategy.switchToThumbnail;
      this.restoreFromThumbnail = MockPublisherStrategy.restoreFromThumbnail;
      this.adjustPublishingBandwidth = MockPublisherStrategy.adjustPublishingBandwidth;
    }
  }
}));

const session = {
  callbacks: {},
  on: function (key, callback) {
    this.callbacks[key] = callback
  },
  emit: function (key, arg) {
    this.callbacks[key] && this.callbacks[key](arg)
  },
};

beforeEach(() => {
  SimulcastPublisherStrategy.switchToThumbnail.mockReset();
  SimulcastPublisherStrategy.restoreFromThumbnail.mockReset();
  session.callbacks = {};
});

describe('VideoRoomSimulcastFacadeImpl', () => {
  test('It should publish only video when smb starts sharing screen', () => {

    const facade = new VideoRoomSimulcastFacadeImpl({}, session, {
      maxDownlinkKbps: 2048,
      high: {
        maxBitrateKbps: 400,
      },
      medium: {
        maxBitrateKbps: 200,
      },
      low: {
        maxBitrateKbps: 80,
      },
    }, {});

    session.emit('screenShare:started');
    expect(SimulcastPublisherStrategy.switchToThumbnail).toHaveBeenCalledTimes(1);

    session.emit('screenShare:stopped');
    expect(SimulcastPublisherStrategy.restoreFromThumbnail).toHaveBeenCalledTimes(1);

    const ordinaryMember = { info: {} };
    const screenShareMember = { info: { screenShare: true } };
    const screenShareMemberHangup = { info: { customInfo: { screenShare: true } } };
    session.emit('member:join', ordinaryMember);
    expect(SimulcastPublisherStrategy.switchToThumbnail).toHaveBeenCalledTimes(1);

    session.emit('member:join', screenShareMember);
    expect(SimulcastPublisherStrategy.switchToThumbnail).toHaveBeenCalledTimes(2);

    session.emit('member:hangup', ordinaryMember)
    expect(SimulcastPublisherStrategy.restoreFromThumbnail).toHaveBeenCalledTimes(1);

    session.emit('member:hangup', screenShareMemberHangup);
    expect(SimulcastPublisherStrategy.restoreFromThumbnail).toHaveBeenCalledTimes(2);
  })

  test('It should calculate maximum allowed substream based on provided limit', () => {
    const memberList = { 1: {}, 2: {}, 3: {}, 4: {}, 5: {} };
    const facade = new VideoRoomSimulcastFacadeImpl(
      {},
      session,
      {
        maxDownlinkKbps: 2048,
        high: {
          maxBitrateKbps: 400,
        },
        medium: {
          maxBitrateKbps: 200,
        },
        low: {
          maxBitrateKbps: 80,
        },
      },
      memberList,
    );

    facade.adjustBandwidth();
    expect(SimulcastPublisherStrategy.adjustPublishingBandwidth).toHaveBeenCalledTimes(1);
    expect(SimulcastPublisherStrategy.adjustPublishingBandwidth.mock.calls[0][0]).toBe(SIMULCAST.high);

    memberList[6] = {};
    facade.adjustBandwidth();
    expect(SimulcastPublisherStrategy.adjustPublishingBandwidth).toHaveBeenCalledTimes(2);
    expect(SimulcastPublisherStrategy.adjustPublishingBandwidth.mock.calls[1][0]).toBe(SIMULCAST.medium);

    for (let i = 7; i <= 30; i++) {
      memberList[i] = {};
    }
    facade.adjustBandwidth();
    expect(SimulcastPublisherStrategy.adjustPublishingBandwidth).toHaveBeenCalledTimes(3);
    expect(SimulcastPublisherStrategy.adjustPublishingBandwidth.mock.calls[2][0]).toBe(SIMULCAST.low);

    for (let i = 7; i <= 30; i++) {
      delete memberList[i];
    }
    facade.adjustBandwidth();
    expect(SimulcastPublisherStrategy.adjustPublishingBandwidth).toHaveBeenCalledTimes(4);
    expect(SimulcastPublisherStrategy.adjustPublishingBandwidth.mock.calls[3][0]).toBe(SIMULCAST.medium);

    delete memberList[6]
    facade.adjustBandwidth()
    expect(SimulcastPublisherStrategy.adjustPublishingBandwidth).toHaveBeenCalledTimes(5);
    expect(SimulcastPublisherStrategy.adjustPublishingBandwidth.mock.calls[4][0]).toBe(SIMULCAST.high);
  });

});
