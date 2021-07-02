import {logger} from "./logger";

export const SIMULCAST = {
  high: 2,
  medium: 1,
  low: 0,
};

export type SimulcastSubstreamSettings = {
  scale: number,
  maxBitrateKbps: number,
};

export type SimulcastSettings = {
  maxDownlinkKbps: number,
  high: SimulcastSubstreamSettings,
  medium: SimulcastSubstreamSettings,
  low: SimulcastSubstreamSettings,
  forceSubstream?: number
};

export type SimulcastActiveState = {
  high?: boolean,
  medium?: boolean,
  low?: boolean,
}

/**
 * Adds video track to webrtc connection with 3 simulcast encodings
 * @param rtcConnection webRtcConenction
 * @param track video
 * @param simulcastSettings layers bitrate and resolution settings
 * @param state defines initially active substreams
 */
export const addRtcSimulcastTrack = (rtcConnection, track, simulcastSettings: SimulcastSettings, state: SimulcastActiveState): void => {
  const {high, medium, low} = simulcastSettings;
  const encodings = [];
  if (high) {
    encodings.push({rid: 'h', active: !!state.high, maxBitrate: high.maxBitrateKbps * 1000})
  }
  if (medium) {
    encodings.push({
      rid: 'm',
      active: !!state.medium,
      maxBitrate: medium.maxBitrateKbps * 1000,
      scaleResolutionDownBy: medium.scale
    })
  }
  if (low) {
    encodings.push({
      rid: 'l',
      active: !!state.low,
      maxBitrate: low.maxBitrateKbps * 1000,
      scaleResolutionDownBy: low.scale
    })
  }
  rtcConnection.addTransceiver(track, {
    direction: 'sendonly',
    sendEncodings: encodings,
  });
}

/**
 * Disables currently highest quality active substream
 * @param rtcConnection webRtcConnection
 * @return true if disable was done or video is not present
 */
export const disableSimulcastTopLayer = (rtcConnection): boolean => {
  const videoRtpSender = findVideoSender(rtcConnection);
  if (videoRtpSender) {
    const params = videoRtpSender.getParameters();
    const encodings = params.encodings;
    const activeEncodings = encodings.filter(encoding => encoding.active);
    if (activeEncodings.length > 1) {
      activeEncodings[0].active = false;
      videoRtpSender.setParameters(params);
      return true;
    }
    return false;
  }
  return false;
};

export const toggleSimulcastLayer = (rtcRtpSender, rid, active) => {
  const params = rtcRtpSender.getParameters();
  const encodings = params.encodings;
  const targetLayer = encodings.find(encoding => encoding.rid === rid);
  if (targetLayer) {
    targetLayer.active = active;
    rtcRtpSender.setParameters(params);
  }
};

export const toggleSelectedSimulcastLayer = (rtcConnection, state: SimulcastActiveState) => {
  const videoRtpSender = findVideoSender(rtcConnection);
  if (videoRtpSender) {
    toggleSimulcastLayer(videoRtpSender, 'h', state.high);
    toggleSimulcastLayer(videoRtpSender, 'm', state.medium);
  }
};

export const getActiveEncodingsState = (substream: number): SimulcastActiveState => {
  switch (substream) {
    case SIMULCAST.high:
      return {high: true, medium: true, low: true};
    case SIMULCAST.medium:
      return {high: false, medium: true, low: true};
    case SIMULCAST.low:
      return {high: false, medium: false, low: true};
    default:
      logger.error('Unrecognised simulcast substream');
      return null;
  }
}

export const findVideoSender = rtcConnection => {
  return rtcConnection.getSenders().find(rtcRtpSender => rtcRtpSender.track && rtcRtpSender.track.kind === 'video');
};
