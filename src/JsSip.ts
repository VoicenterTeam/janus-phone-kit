import EventEmitter from "./util/EventEmitter";
import jsSip from 'jssip/lib/JsSIP'
import Session from "./Session";

const defaultConfig = {
  socketUrl: 'wss://webrtc.officering.net:8888',
  token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNjE2MjM5MDIyLCJ0YWciOiJ2bGFkIiwiYXBwX2RhdGEiOnsiYXBwX2ludml0ZV9pZCI6MSwiYXBwX3RhcmdldF9pZCI6NjU2LCJhcHBfdHlwZSI6Imp3dCIsImFwcF9uYW1lIjoiQ29uZmVyZW5jZSJ9fQ.-ParTBD5afxIiNe2k6UvRWwERJMkXQeck1hENbK9yzY',
  sipUrl: `sip:alex1@c7594.ratetel.com:8888`,
  password: '',
  roomId: 1234,
}
export default class JsSip extends EventEmitter {
  private readonly session: Session = null
  private callInfo: any = {}
  jsSip: any = {}
  options: any = {}

  constructor(config) {
    super()
    this.options = {
      ...defaultConfig,
      ...config,
    }
    this.session = this.options.session
  }

  async register() {
    this.jsSip = jsSip
    const socket = new this.jsSip.WebSocketInterface(this.options.socketUrl);
    const configuration = {
      sockets: [socket],
      session_timers: false,
      uri: this.options.sipUrl,
      password: this.options.password,
      authorization_jwt: `Bearer ${this.options.token}`
    };

    if (typeof window !== 'undefined' && window) {
      // @ts-ignore
      window.ua = this.callInfo
    }
    this.callInfo = new this.jsSip.UA(configuration);
    this.callInfo.start();
  }

  async startCall() {
    const options = {
      session_timers: false,
      eventHandlers: {
        progress() {
          console.log('call is in progress');
        },
        failed(err) {
          console.error('Call failed', err);
        },
        ended(e) {
          console.log('call ended with cause: ', e);
        },
        confirmed() {
          console.log('call confirmed');
        }
      },
      mediaConstraints: {
        audio: true,
        video: false
      },
      pcConfig: {
        iceServers: []
      }
    };

    const callId = this.getCallId()
    this.callInfo.activeCall = this.callInfo.call(callId, options);
    if (!this.callInfo.activeCall) {
      return
    }
    this.callInfo.activeCall.connection.addEventListener('addstream', (event) => {
      debugger
      if (this.session) {
        debugger
        this.session.emit('sip:init', event)
      }
      this.emit('sip:init', event)
    });
  }

  private getCallId() {
    let sipUrl = this.options.sipUrl
    sipUrl = sipUrl.replace('sip:', '')
    sipUrl = sipUrl.split(':')[0]
    let sipUrlParts = sipUrl.split('@')
    let sipUrlSuffix = sipUrlParts[sipUrlParts.length - 1]
    return `sip:${this.options.roomId}@${sipUrlSuffix}`
  }

}
