<template>
    <div>
        <VcLoading :active="initializingData" full-page />

        <JoinRoomModal
            v-model="roomDetailsModel"
            v-if="CONFERENCE_PAGE_QUERY_PARAMETERS.PARAMETERS_MISSING_BEHAVIOR.type === ParametersMissingBehaviorType.REQUEST_IF_MISSING"
            v-model:modal-visible="roomDetailsModalOpened"
            :fields-to-show="CONFERENCE_PAGE_QUERY_PARAMETERS.PARAMETERS_MISSING_BEHAVIOR.data.fields"
            @submit="setRoomDetailsData"
        />

        <Conferencing v-if="roomJoined" @hangup="redirectToHomePage" />
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { CONFERENCE_PAGE_ROUTE, HOME_PAGE_ROUTE } from '@/router'
import { generateConferenceQueryParameters, getConferenceQueryParameters } from '@/helper/router.helper'
import useJanusPhoneKit from '@/composables/useJanusPhoneKit'
import Conferencing from '@/components/Conferencing.vue'
import JoinRoomModal from '@/components/JoinRoomModal.vue'
import { JoinRoomData } from '@/types/forms'
import { CONFERENCE_PAGE_QUERY_PARAMETERS, ParametersMissingBehaviorType } from '@/config/behaviour.config'

/* Composables */
const route = useRoute()
const router = useRouter()
const { joinRoom } = useJanusPhoneKit()

/* Data */
const roomJoined = ref(false)
const initializingData = ref(false)
const roomDetailsModalOpened = ref(false)
const roomDetailsModel = ref<JoinRoomData>({
    roomId: 1236,
    displayName: 'User'
})

/* Methods */
function redirectToHomePage () {
    router.push({ name: HOME_PAGE_ROUTE.name })
}
async function joinConference (roomId: number, displayName: string) {
    try {
        await joinRoom({
            roomId,
            displayName,
            mediaConstraints: {
                audio: true,
                video: true,
            }
        })

        roomJoined.value = true
        initializingData.value = false
    } catch (e) {
        return redirectToHomePage()
    }
}
function checkIfOtherFieldsFilled (data: Partial<JoinRoomData>, fields: Array<keyof JoinRoomData>): boolean {
    return Object.keys(data).some((key) => {
        const dataKey = key as keyof JoinRoomData
        return !fields.includes(dataKey) && data[dataKey] !== undefined
    })
}

function tryInitializeByQueryParameters () {
    initializingData.value = true

    const data = getConferenceQueryParameters(route)

    if (data.roomId !== undefined && data.displayName !== undefined) {
        joinConference(data.roomId, data.displayName)

        return
    }

    switch (CONFERENCE_PAGE_QUERY_PARAMETERS.PARAMETERS_MISSING_BEHAVIOR.type) {
        case ParametersMissingBehaviorType.REDIRECT_TO_URL:
            window.location.href = CONFERENCE_PAGE_QUERY_PARAMETERS.PARAMETERS_MISSING_BEHAVIOR.data.url
            break
        case ParametersMissingBehaviorType.REQUEST_IF_MISSING:
            if (!checkIfOtherFieldsFilled(data, CONFERENCE_PAGE_QUERY_PARAMETERS.PARAMETERS_MISSING_BEHAVIOR.data.fields)) {
                redirectToHomePage()

                return
            }

            if (data.roomId !== undefined) {
                roomDetailsModel.value.roomId = data.roomId
            }

            if (data.displayName !== undefined) {
                roomDetailsModel.value.displayName = data.displayName
            }

            roomDetailsModalOpened.value = true
            initializingData.value = false

            return
        default:
            redirectToHomePage()
    }
}
async function setRoomDetailsData () {
    await router.push({
        name: CONFERENCE_PAGE_ROUTE.name,
        query: generateConferenceQueryParameters(roomDetailsModel.value.roomId, roomDetailsModel.value.displayName)
    })

    roomDetailsModalOpened.value = false

    tryInitializeByQueryParameters()
}

tryInitializeByQueryParameters()
</script>
