<template>
    <div>
        <VcLoading :active="loading" full-page />

        <template v-if="!loading">
            Conference page
        </template>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { HOME_PAGE_ROUTE } from '@/router'
import { getConferenceQueryParameters } from '@/helper/router.helper'
import useJanusPhoneKit from '@/composables/useJanusPhoneKit'

/* Composables */
const route = useRoute()
const router = useRouter()
const { joinRoom } = useJanusPhoneKit()

/* Data */
const loading = ref(false)

/* Methods */
function redirectToHomePage () {
    router.push({ name: HOME_PAGE_ROUTE.name })
}
function tryInitializeByQueryParameters () {
    loading.value = true

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
            loading.value = false
        })
        .catch(redirectToHomePage)
}

tryInitializeByQueryParameters()
</script>

<style scoped>

</style>
