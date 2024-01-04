import axios from 'axios'

export async function getCreatedTime (roomId: string) {
    const { data } = await axios.get(`https://jnwss.voicenter.co/room/${roomId}`)
    return data
}
