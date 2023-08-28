# Janus Phone Kit

This Project is a toolkit for creating vide conferences based on [Janus WebRTC Server](https://janus.conf.meetecho.com/docs/)
The main purpose of it is to create an abstract layer that is easy to use in order to create vide conferences and manage them.

## Installation

`npm install` to install dependencies

`npm run serve` to start the local documentation and demo

`npm run build` to bundle the project.

This project uses typescript and is in early stages of development.
Please don't use it in production as it's experimental and might change.

Demo Code on how to create a video conference

```js
const PhoneKit = new JanusPhoneKit({
  url: 'wss://webconf.officering.net/janus'
})

const roomId = 1234

PhoneKit.joinConference(roomId, 'User display name')

PhoneKit.on('member:join', data => {
  // Whenever someone joins the video call including yourself
  // {type: 'publisher|subscriber', sender: 'sender id', steam: 'video stream object', joinResult: object }
})
PhoneKit.on('member:hangup', data => {
  // Whenever someone exists the video call
  // { sender: 'sender id' }
})
PhoneKit.on('hangup', () => {
  // PhoneKit.hangup() was called somehwere
})

// Leave the room
PhoneKit.hangup()

// Share your screen
PhoneKit.startScreenShare().then(() => {
 // success, sharing your screen
})
```

### Available JanusPhoneKit options:

- **url** websocket url of the janus server
- **stunServers** List of STUN servers. Usually these are needed when the servers don't have public IPs. Defaults to `[{urls: "stun:stun.l.google.com:19302"}]`   

You can find a working Vue.js example in the source code located in `src/docs/.vuepress/components/Demo.vue` 
