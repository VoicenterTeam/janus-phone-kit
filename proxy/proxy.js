
const Fastify = require('fastify')
const proxy = require('@fastify/http-proxy')

const server = Fastify()
const RoomRepository = new (require('./createRoom'))()
server.register(proxy, {
    upstream: 'http://185.138.169.231:8188',
    wsUpstream: 'ws://185.138.169.231:8188',
    websocket: true,
    preValidation: async (request) => {
        if (request.query && request.query.room.length>0) {
            await RoomRepository.CreateRoom(request.query.room.toString())
        }
    }
})

server.listen(8188)
