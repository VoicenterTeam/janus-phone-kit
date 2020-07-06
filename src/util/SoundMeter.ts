export class VolumeMeter {
  private readonly stream
  private scriptNodeProcessor: ScriptProcessorNode;
  private analyser: AnalyserNode;

  constructor(stream) {
    this.stream = stream
    this.initMeter()
  }

  private initMeter() {
    const audioContext = new AudioContext();
    const microphone = audioContext.createMediaStreamSource(this.stream);
    this.analyser = audioContext.createAnalyser();
    this.scriptNodeProcessor = audioContext.createScriptProcessor(2048, 1, 1);

    this.analyser.smoothingTimeConstant = 0.8;
    this.analyser.fftSize = 1024;

    microphone.connect(this.analyser);
    this.analyser.connect(this.scriptNodeProcessor);
    this.scriptNodeProcessor.connect(audioContext.destination);
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
}
