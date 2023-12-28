<template>
    <div>
        <VcLoading :active="initializingData" full-page />

        <JoinRoomModal
            v-model="roomDetailsModel"
            v-if="stateData.appConfig.PARAMETERS_MISSING_BEHAVIOR.type === ParametersMissingBehaviorType.REQUEST_IF_MISSING"
            v-model:modal-visible="roomDetailsModalOpened"
            :fields-to-show="stateData.appConfig.PARAMETERS_MISSING_BEHAVIOR.data.fields"
            @submit="setRoomDetailsData"
        />

        <Conferencing v-if="roomJoined" :room-id="roomId" @hangup="redirectToHomePage" />
    </div>
</template>

<script setup lang="ts">
import { ref, inject } from "vue";
import { useRoute, useRouter } from 'vue-router'
import { CONFERENCE_PAGE_ROUTE, HOME_PAGE_ROUTE } from '@/router'
import { generateConferenceQueryParameters, getConferenceQueryParameters } from '@/helper/router.helper'
//import useJanusPhoneKit from '@/composables/useJanusPhoneKit'
import Conferencing from '@/components/Conferencing.vue'
import JoinRoomModal from '@/components/JoinRoomModal.vue'
import { JoinRoomData } from '@/types/forms'
import { ParametersMissingBehaviorType } from '@/config/app.config'
import { ConfigInjectionKey } from '@/plugins/config'

const useJanusPhoneKit = inject('useJanusPhoneKit')

/* Inject */
const stateData = inject(ConfigInjectionKey)

/* Composables */
const route = useRoute()
const router = useRouter()
const { joinRoom } = useJanusPhoneKit()

/* Data */
const roomJoined = ref(false)
const initializingData = ref(false)
const roomDetailsModalOpened = ref(false)
const roomDetailsModel = ref<JoinRoomData>({
    roomId: 4545,
    displayName: 'User'
})

const roomId = ref<number | undefined>(undefined)

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
    const uniqueFields = [ ...new Set(fields) ]

    return Object.keys(data).every((key) => {
        const dataKey = key as keyof JoinRoomData

        if (uniqueFields.includes(dataKey)) {
            return true // Skip fields that are in the 'fields' array
        }

        return data[dataKey] !== undefined // Check that all other fields are not undefined
    })
}


function tryInitializeByQueryParameters () {
    initializingData.value = true

    const data = getConferenceQueryParameters(route)

    if (data.roomId !== undefined && data.displayName !== undefined) {
        roomId.value = data.roomId
        joinConference(data.roomId, data.displayName)

        return
    }

    switch (stateData.value.appConfig.PARAMETERS_MISSING_BEHAVIOR.type) {
        case ParametersMissingBehaviorType.REDIRECT_TO_URL:
            console.log('redirect')
            window.location.href = stateData.value.appConfig.PARAMETERS_MISSING_BEHAVIOR.data.url
            break
        case ParametersMissingBehaviorType.REQUEST_IF_MISSING:
            console.log('request', stateData.value.appConfig.PARAMETERS_MISSING_BEHAVIOR.data.fields, data, checkIfOtherFieldsFilled(data, stateData.value.appConfig.PARAMETERS_MISSING_BEHAVIOR.data.fields))
            if (!checkIfOtherFieldsFilled(data, stateData.value.appConfig.PARAMETERS_MISSING_BEHAVIOR.data.fields)) {
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
