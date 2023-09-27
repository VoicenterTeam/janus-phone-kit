<template>
    <div>
        <VcLoading :active="!roomJoined" full-page />

        <Conferencing v-if="roomJoined" @hangup="redirectToHomePage" />
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { HOME_PAGE_ROUTE } from '@/router'
import { getConferenceQueryParameters } from '@/helper/router.helper'
import useJanusPhoneKit from '@/composables/useJanusPhoneKit'
import Conferencing from '@/components/Conferencing.vue'

/* Composables */
const route = useRoute()
const router = useRouter()
const { joinRoom } = useJanusPhoneKit()

/* Data */
const roomJoined = ref(false)

/* Methods */
function redirectToHomePage () {
    router.push({ name: HOME_PAGE_ROUTE.name })
}
function tryInitializeByQueryParameters () {
    const queryParameters = getConferenceQueryParameters(route)

    if (!queryParameters) {
        redirectToHomePage()
        return
    }

    const { roomId, displayName } = queryParameters

    joinRoom({
        roomId,
        displayName,
        mediaConstraints: {
            audio: true,
            video: true,
        }
    })
        .then(() => {
            roomJoined.value = true
        })
        .catch(redirectToHomePage)
}

tryInitializeByQueryParameters()
</script>

<style scoped>

</style>
