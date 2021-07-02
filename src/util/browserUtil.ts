export const isChrome = navigator.userAgent.toLowerCase().includes('chrome');
export const isSafari = !isChrome && navigator.userAgent.toLowerCase().includes('safari');

export const getVideoCodec = () => isSafari ? 'h264' : 'vp8';
