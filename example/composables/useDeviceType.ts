import { ref, onMounted, onBeforeUnmount } from 'vue'

const MOBILE_BREAKPOINT = 768

export default function useDeviceType () {
    const isMobile = ref<boolean>(calculateIsMobile())

    function calculateIsMobile () {
        return window.innerWidth < MOBILE_BREAKPOINT
    }

    function handleResize () {
        isMobile.value = calculateIsMobile()
    }

    onMounted(() => {
        window.addEventListener('resize', handleResize)
    })

    onBeforeUnmount(() => {
        window.removeEventListener('resize', handleResize)
    })

    return {
        isMobile
    }
}
