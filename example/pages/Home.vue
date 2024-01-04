<template>
    <!-- Home -->
    <div v-if="!isOnConferencePage">
        <JoinRoomModal
            v-model="roomDetailsModel"
            v-model:modal-visible="modalOpen"
            @submit="joinConference"
        />

        <div class="w-screen h-screen flex flex-col gap-6 items-center justify-center">
            <img
                :src="stateData.appConfig.APP_LOGO"
                alt="Logo"
            >

            <VcButton size="large" @click="openModal">
                {{ t('home.enterConference') }}
            </VcButton>
          <h1>V2</h1>
        </div>
    </div>
    <!-- Conference -->
    <div v-else>
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
import { ref, inject } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { JoinRoomData } from '@/types/forms'
import { HOME_PAGE_ROUTE } from '@/router'
import JoinRoomModal from '@/components/JoinRoomModal.vue'
import Conferencing from '@/components/Conferencing.vue'
import { generateConferenceQueryParameters, getConferenceQueryParameters } from '@/helper/router.helper'
import { ParametersMissingBehaviorType } from '@/config/app.config'
import { ConfigInjectionKey } from '@/plugins/config'

/* Inject */
const stateData = inject(ConfigInjectionKey)
const useJanusPhoneKit = inject('useJanusPhoneKit')

/* Composables */
const { t } = useI18n()
const router = useRouter()
const route = useRoute()
const { joinRoom } = useJanusPhoneKit()

/* Data */
const isOnConferencePage = ref(false)
// Home data
const modalOpen = ref(false)
const roomDetailsModel = ref<JoinRoomData>({
    roomId: 'abcd',
    displayName: 'User'
})
// Conference data
const roomJoined = ref(false)
const initializingData = ref(false)
const roomDetailsModalOpened = ref(false)
const roomId = ref<string | undefined>(undefined)

/* Methods */
async function joinConference () {
    await router.push({
        name: HOME_PAGE_ROUTE.name,
        query: generateConferenceQueryParameters(roomDetailsModel.value.roomId, roomDetailsModel.value.displayName)
    })

    closeModal()
    tryInitializeByQueryParameters()
}
function openModal () {
    modalOpen.value = true
}

function closeModal () {
    modalOpen.value = false
}

async function redirectToHomePage () {
    await router.push({ name: HOME_PAGE_ROUTE.name })
    tryInitializeByQueryParameters()
}
async function joinConferenceRoom (roomId: string, displayName: string) {
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
    const data = getConferenceQueryParameters(route)

    if (!data.roomId && !data.displayName) {
        isOnConferencePage.value = false
        return
    }
    isOnConferencePage.value = true

    initializingData.value = true

    if (data.roomId !== undefined && data.displayName !== undefined) {
        roomId.value = data.roomId
        joinConferenceRoom(data.roomId, data.displayName)

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
        name: HOME_PAGE_ROUTE.name,
        query: generateConferenceQueryParameters(roomDetailsModel.value.roomId, roomDetailsModel.value.displayName)
    })

    roomDetailsModalOpened.value = false

    tryInitializeByQueryParameters()
}

tryInitializeByQueryParameters()
</script>
