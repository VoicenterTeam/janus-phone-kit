import SimulcastPublisherStrategy from '../SimulcastPublisherStrategy.ts';
import { toggleSelectedSimulcastLayer, disableSimulcastTopLayer } from '../../util/rtcUtil.ts';
import { SIMULCAST } from '../../util/rtcUtil.ts';

jest.mock('../../util/rtcUtil.ts', () => ({
  ...jest.requireActual('../../util/rtcUtil.ts'),
  toggleSelectedSimulcastLayer: jest.fn(),
  disableSimulcastTopLayer: jest.fn(),
}));

beforeEach(() => {
  toggleSelectedSimulcastLayer.mockReset();
});

describe('SimulcastPublisherStrategy', () => {
  test('It should adjust publishing bandwidth to publish only allowed maximum substream', () => {
    const rtcConnectionMock = { connectionState: 'connected' };
    const strategy = new SimulcastPublisherStrategy(rtcConnectionMock, {})

    strategy.adjustPublishingBandwidth(2);
    expect(toggleSelectedSimulcastLayer).toHaveBeenCalledTimes(1);
    expect(toggleSelectedSimulcastLayer.mock.calls[0][0]).toBe(rtcConnectionMock);
    expect(toggleSelectedSimulcastLayer.mock.calls[0][1].high).toBeTruthy();
    expect(toggleSelectedSimulcastLayer.mock.calls[0][1].medium).toBeTruthy();

    strategy.adjustPublishingBandwidth(1);
    expect(toggleSelectedSimulcastLayer).toHaveBeenCalledTimes(2);
    expect(toggleSelectedSimulcastLayer.mock.calls[1][0]).toBe(rtcConnectionMock);
    expect(toggleSelectedSimulcastLayer.mock.calls[1][1].high).toBeFalsy();
    expect(toggleSelectedSimulcastLayer.mock.calls[1][1].medium).toBeTruthy();

    strategy.adjustPublishingBandwidth(0);
    expect(toggleSelectedSimulcastLayer).toHaveBeenCalledTimes(3);
    expect(toggleSelectedSimulcastLayer.mock.calls[2][0]).toBe(rtcConnectionMock);
    expect(toggleSelectedSimulcastLayer.mock.calls[2][1].high).toBeFalsy();
    expect(toggleSelectedSimulcastLayer.mock.calls[2][1].medium).toBeFalsy();
  });

  test('It should reduce uplink and remember bandwidth limit', () => {
    const encodings = [
      { rid: 'h', active: true },
      { rid: 'm', active: true },
      { rid: 'l', active: true },
    ];
    const rtcConnectionMock = {
      getSenders: () => [{
        track: {
          kind: 'video'
        },
        getParameters: () => ({ encodings })
      }]
    };
    disableSimulcastTopLayer.mockReturnValue(true);
    const strategy = new SimulcastPublisherStrategy(rtcConnectionMock, {})

    strategy.reduceUplink();
    expect(disableSimulcastTopLayer).toHaveBeenCalledTimes(1)
    expect(disableSimulcastTopLayer.mock.calls[0][0]).toBe(rtcConnectionMock);
    expect(strategy.bandwidthLimit).toBe(SIMULCAST.high);

    encodings[0].active = false;
    strategy.reduceUplink();
    expect(strategy.bandwidthLimit).toBe(SIMULCAST.medium);

    encodings[1].active = false;
    strategy.reduceUplink();
    expect(strategy.bandwidthLimit).toBe(SIMULCAST.low);
  });

  test('it should not restore substream if it is disabled by bandwidth previously', () => {
    const encodings = [
      { rid: 'h', active: false },
      { rid: 'm', active: true },
      { rid: 'l', active: true },
    ];
    const rtcConnectionMock = {
      getSenders: () => [{
        track: {
          kind: 'video'
        },
        getParameters: () => ({ encodings })
      }]
    };
    disableSimulcastTopLayer.mockReturnValue(true);
    const strategy = new SimulcastPublisherStrategy(rtcConnectionMock, {})

    strategy.reduceUplink();
    expect(strategy.bandwidthLimit).toBe(SIMULCAST.medium);

    const result = strategy.adjustPublishingBandwidth(SIMULCAST.high);
    expect(result).toBeFalsy();
    expect(toggleSelectedSimulcastLayer).not.toHaveBeenCalled();
  });

  test('It should publish only low quality video if smb is sharing and restore previous settings when screen share stops', () => {
    const encodings = [
      { rid: 'h', active: false },
      { rid: 'm', active: true },
      { rid: 'l', active: true },
    ];
    const rtcConnectionMock = {
      connectionState: 'connected',
      getSenders: () => [{
        track: {
          kind: 'video'
        },
        getParameters: () => ({ encodings })
      }]
    };
    disableSimulcastTopLayer.mockReturnValue(true);
    const strategy = new SimulcastPublisherStrategy(rtcConnectionMock, {})

    strategy.switchToThumbnail();
    expect(strategy.memento).toEqual({
      bandwidthLimit: SIMULCAST.high,
    });
    expect(strategy.bandwidthLimit).toBe(SIMULCAST.low);
    expect(toggleSelectedSimulcastLayer).toHaveBeenCalledTimes(1);
    expect(toggleSelectedSimulcastLayer.mock.calls[0][0]).toBe(rtcConnectionMock);
    expect(toggleSelectedSimulcastLayer.mock.calls[0][1].high).toBeFalsy();
    expect(toggleSelectedSimulcastLayer.mock.calls[0][1].medium).toBeFalsy();

    strategy.restoreFromThumbnail(SIMULCAST.medium);
    expect(strategy.memento).toBeNull();
    expect(strategy.bandwidthLimit).toBe(SIMULCAST.high);
    expect(toggleSelectedSimulcastLayer).toHaveBeenCalledTimes(2);
    expect(toggleSelectedSimulcastLayer.mock.calls[1][0]).toBe(rtcConnectionMock);
    expect(toggleSelectedSimulcastLayer.mock.calls[1][1].high).toBeFalsy();
    expect(toggleSelectedSimulcastLayer.mock.calls[1][1].medium).toBeTruthy();
  });
});
