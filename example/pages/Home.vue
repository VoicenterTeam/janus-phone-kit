<template>
    <div>
        <JoinRoomModal
            v-model="roomDetailsModel"
            v-model:modal-visible="modalOpen"
            @submit="joinConference"
        />

        <div class="w-screen h-screen flex flex-col gap-6 items-center justify-center">
            <img
                v-if="stateData.appConfig.HOME_PAGE_LOGO"
                :src="stateData.appConfig.HOME_PAGE_LOGO"
                alt="Logo"
            >

            <VcButton size="large" @click="openModal">
                {{ t('home.enterConference') }}
            </VcButton>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, inject } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { JoinRoomData } from '@/types/forms'
import { CONFERENCE_PAGE_ROUTE } from '@/router'
import JoinRoomModal from '@/components/JoinRoomModal.vue'
import { generateConferenceQueryParameters } from '@/helper/router.helper'
import { ConfigInjectionKey } from '@/plugins/config'

/* Composables */
const { t } = useI18n()
const router = useRouter()
const stateData = inject(ConfigInjectionKey)

/* Data */
const modalOpen = ref(false)
const roomDetailsModel = ref<JoinRoomData>({
    roomId: 4545,
    displayName: 'User'
})

/* Methods */
function joinConference () {
    router.push({
        name: CONFERENCE_PAGE_ROUTE.name,
        query: generateConferenceQueryParameters(roomDetailsModel.value.roomId, roomDetailsModel.value.displayName)
    })
}
function openModal () {
    modalOpen.value = true
}
</script>
