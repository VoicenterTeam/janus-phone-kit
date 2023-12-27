const axios = require('axios')

async function CreateRoom (room) {
    let createMsg = {
        janus: 'create',
        transaction: '1'
    }
    let config = {
        method: 'post',
        maxBodyLength: Infinity,
        url: 'http://185.138.169.231:8088/janus/',
        headers: {
            'Content-Type': 'application/json'
        },
        data: JSON.stringify(createMsg)
    }

    let createResponse =  await axios.request(config)

    // console.log(createResponse)
    const sessionID = createResponse.data.data.id

    let attachMsg ={
        janus: 'attach',
        plugin: 'janus.plugin.videoroom',
        opaque_id: 'videoroomtest-18hoF1ixjW5v',
        transaction: '2',
        session_id: sessionID
    }

    let configAttach = {
        method: 'post',
        maxBodyLength: Infinity,
        url: 'http://185.138.169.231:8088/janus/',
        headers: {
            'Content-Type': 'application/json'
        },
        data: attachMsg
    }

    let attachResponse = await axios.request(configAttach)
    let handlerID = attachResponse.data.data.id


    let createRoomMsg = {
        janus: 'message',
        transaction: 'sBJNyUhH6Vc6',
        body: {
            request: 'create',
            transaction: 'sBJNyUhH6Vc6',
            room: Number(room),
            admin_key: 'supersecret'
        }
    }

    let createRoomConfig = {
        method: 'post',
        maxBodyLength: Infinity,
        url: `http://185.138.169.231:8088/janus/${sessionID}/${handlerID}`,
        headers: {
            'Content-Type': 'application/json'
        },
        data: createRoomMsg
    }

    let createRoomResponse = await axios.request(createRoomConfig)
    console.log(createRoomResponse.data)
}
class RoomRepository {

    constructor (config) {
        this.config = config
        this.Rooms ={}
    }
    async  CreateRoom (room){
        if(!this.Rooms[room]){
            this.Rooms[room]= { created: Number( new Date()) }
            await CreateRoom(room)
        }
    }
}
module.exports = RoomRepository
// CreateRoom('jjj').then(console.log)
