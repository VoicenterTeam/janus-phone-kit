# Janus Phone Kit

This Project is a toolkit for creating video conferences based on [Janus WebRTC Server](https://janus.conf.meetecho.com/docs/)
The main purpose of it is to create an abstract layer that is easy to use in order to create video conferences and manage them.

### Installation

`npm install` to install dependencies

`npm run serve` to start the local documentation and demo

`npm run build` to bundle the project.

This project uses typescript and is in early stages of development.


## Docs

- `joinRoom ({ roomId: number, displayName?: string, mediaConstraints: MediaStreamConstraints }): Session` - Used to join a room. Returns user's Session.
- `hangup(): void` - exit the room.
- `startVideo(): void` - turn on video from camera.
- `stopVideo(): void` - turn off camera video.
- `enableMask(enable: boolean): Promise<MediaStream | undefined>` - Using for enabling/disabling background mask. Returns `undefined` in case when enabling already active mask or disabling already disabled mask. In other cases returns MediaStream.
- `startAudio(): void` - turn on microphone (unmute).
- `stopAudio(): void` - turn off microphone (mute).
- `startNoiseFilter(): void` - turn on noise filter.
- `stopNoiseFilter(): void` - turn off noise filter.
- `setBitrate(bitrate: number): void` - set bitrate for camera and screen sharing video.
- `changePublisherStream({ audioInput: string, videoInput: string }): Promise<MediaStream>` - set origin of the audio/video. **audioInput** and **audioInput** represent input device id. Returns a MediaStream from new origin.
- `startScreenShare(): void` - start screen sharing.
- `stopScreenShare(): void` - stop screen sharing.
- `enableScreenShareWhiteboard(enable: boolean, stream: MediaStream): Promise<void>` - enable whiteboard over the screen sharing. If **enable** === true then the second parameter **stream** is required.
- `setupScreenShareDrawerOptions({ strokeWidth?: number, strokeColor?: string }): void` - setup options for drawing over the screen sharing.
- `enableWhiteboard(mode: 'whiteboard' | 'imageWhiteboard', enable: boolean, base64Image?: string): Promise<void>` - enable whiteboard over the empty or image board. If **mode** === 'imageWhiteboard' then the third parameter **base64Image** is required.
- `setupDrawerOptions({ strokeWidth?: number, strokeColor?: string, emptyDrawerRectColor?: string }): void` - setup options for drawing over the empty or image board. Option **emptyDrawerRectColor** is working only when **mode** === 'whiteboard' and sets the background color of the board.
- `sendStateMessage({ video?: boolean, audio?: boolean, isTalking?: boolean }): Promise<void>` - send state message for video state.
- `syncParticipants(): Promise<void>` - synchronize participants.
- `emit(): void` - emit session message.
- `on(eventName: string, callback: fn): void` - emit session message.


## Usage

```js
const PhoneKit = new JanusPhoneKit({
  url: 'websocket url to janus backend server'
})

const roomId = 1234 // This is basically the conference identifier. It should be taken from the url
const mediaConstraints = {
  audio: true,
  video: true,
}

PhoneKit.joinRoom({
  roomId,
  mediaConstraints,
  displayName: 'User display name',
})

PhoneKit.on('member:join', data => {
  // Whenever someone joins the video call including yourself
  // {type: 'publisher|subscriber', sender: 'sender id', steam: 'video stream object', joinResult: object }
})
PhoneKit.on('member:update', (data) => {
  // Whenever members's data was updated
})
PhoneKit.on('member:hangup', data => {
  // Whenever someone exists the video call
  // { sender: 'sender id' }
})
PhoneKit.on('hangup', () => {
  // PhoneKit.hangup() was called somehwere
})
PhoneKit.on('screenShare:start', () => {
  // Whenever user started screen sharing
})
PhoneKit.on('screenShare:stop', () => {
  // Whenever user stopped screen sharing
})
```

You can find a working Vue.js example in the source code located in `example` folder.

## Authors

* **Cristi Jora** - *Initial work*
* **Bohdan Konechniy**
* **Serhii Kundys**

See also the list of [contributors](https://github.com/your/project/contributors) who participated in this project.

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details
