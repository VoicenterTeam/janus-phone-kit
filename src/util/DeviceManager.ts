let stream: MediaStream

class DeviceManager {

  static canGetMediaDevices () {
    if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
      console.log("enumerateDevices() not supported.");
      return false
    }
    return true
  }

  private static async getDevices(kind: string) {
    if (!DeviceManager.canGetMediaDevices()) {
      return []
    }
    const devices = await navigator.mediaDevices.enumerateDevices()
    return devices.filter(device => device.kind === kind)
  }

  static async getMicrophoneList(): Promise<MediaDeviceInfo[]> {
    const devices: MediaDeviceInfo[] = await DeviceManager.getDevices('audioinput')

    return devices.map((device, index) => {
      return {
        ...device,
        deviceId: device.deviceId,
        label: device.label || `microphone ${index + 1}`
      }
    })
  }

  static async getSpeakerList(): Promise<MediaDeviceInfo[]> {
    const devices: MediaDeviceInfo[] = await DeviceManager.getDevices('audiooutput')

    return devices.map((device, index) => {
      return {
        ...device,
        deviceId: device.deviceId,
        label: device.label || `speaker ${index + 1}`
      }
    })
  }

  static async getCameraList() {
    const devices: MediaDeviceInfo[] = await DeviceManager.getDevices('videoinput')

    return devices.map((device, index) => {
      return {
        ...device,
        deviceId: device.deviceId,
        label: device.label || `camera ${index + 1}`
      }
    })
  }

  static stopStreamTracks() {
    if (!stream) {
      return
    }
    stream.getTracks().forEach(track => {
      track.stop();
    });
  }

  private static async getUserMedia(constraints: any) {
    stream = await navigator.mediaDevices.getUserMedia(constraints)
    return stream
  }

  static async getVideoStreamFrom(deviceId: string) {
    DeviceManager.stopStreamTracks()

    const constraints = {
      video: {deviceId: deviceId ? {exact: deviceId} : undefined}
    };

    return DeviceManager.getUserMedia(constraints)
  }

  static async getAudioStreamFrom(deviceId: string) {
    DeviceManager.stopStreamTracks()

    const constraints = {
      audio: {deviceId: deviceId ? {exact: deviceId} : undefined}
    };

    return DeviceManager.getUserMedia(constraints)
  }

  static async changeAudioOutput(element: any, deviceId: string) {
    if (!element || !deviceId) {
      return
    }

    if (typeof element.sinkId !== 'undefined') {
      try {
        await element.setSinkId(deviceId)
        console.log(`Success, audio output device attached: ${deviceId}`);
      } catch (error) {
        let errorMessage = error;
        if (error.name === 'SecurityError') {
          errorMessage = `You need to use HTTPS for selecting audio output device: ${error}`;
        }
        console.error(errorMessage);
      }
    } else {
      console.warn('Browser does not support output device selection.');
    }
  }

  static async getVideoStream() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({video: true})
      const videoTracks = stream.getVideoTracks();
      if (videoTracks.length === 0) {
        return {
          stream,
          track: null
        }
      }
      return {
        stream,
        track: videoTracks[0]
      }
    } catch (err) {
      console.warn(err)
      return {
        stream: null,
        track: null,
      }
    }
  }
}

export default DeviceManager
