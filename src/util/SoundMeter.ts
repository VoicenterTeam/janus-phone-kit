export class VolumeMeter {
  private readonly stream
  private audioContext: AudioContext;
  private scriptNodeProcessor: ScriptProcessorNode;
  private gainNode: GainNode;
  private analyser: AnalyserNode;
  private output: MediaStreamAudioDestinationNode;

  constructor(stream) {
    this.stream = stream
    this.initMeter()
  }

  private initMeter() {
    const audioContext = new AudioContext();
    this.audioContext = audioContext;
    const toAnalyze = audioContext.createMediaStreamSource(this.stream);
    const microphone = audioContext.createMediaStreamSource(this.stream);
    this.output =  audioContext.createMediaStreamDestination();
    this.analyser = audioContext.createAnalyser();
    this.scriptNodeProcessor = audioContext.createScriptProcessor(2048, 1, 1);
    this.gainNode = audioContext.createGain();

    this.analyser.smoothingTimeConstant = 0.8;
    this.analyser.fftSize = 1024;

    toAnalyze.connect(this.analyser);
    this.analyser.connect(this.scriptNodeProcessor);
    this.scriptNodeProcessor.connect(audioContext.destination);

    microphone.connect(this.gainNode);
    this.gainNode.connect(this.output);
  }

  mute() {
    this.gainNode.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 0.2);
  }

  unmute() {
    this.gainNode.gain.setValueAtTime(1, this.audioContext.currentTime);
  }

  onAudioProcess(callback: Function) {
    let oldValue = 0
    this.scriptNodeProcessor.onaudioprocess = () => {
      const array = new Uint8Array(this.analyser.frequencyBinCount);
      this.analyser.getByteFrequencyData(array);
      let values: number = 0;

      array.forEach(value => {
        values+=value
      })

      let newValue = Math.round(values / array.length);
      newValue = Math.min(newValue, 100)
      if (callback && newValue !== oldValue) {
        callback(newValue, oldValue)
        oldValue = newValue
      }
    }
  }

  getOutputStream() {
    return this.output.stream;
  }
}

