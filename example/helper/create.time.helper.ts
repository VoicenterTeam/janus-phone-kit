import axios from 'axios'

export async function getCreatedTime (roomId) {
    const { data } = await axios.get(`https://jnwss.voicenter.co/room/${roomId}`)
    console.log('getCreatedTime', data)
    return data
}
