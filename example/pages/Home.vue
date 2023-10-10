<template>
    <div>
        <JoinRoomModal
            v-model="roomDetailsModel"
            v-model:modal-visible="modalOpen"
            @submit="joinConference"
        />

        <div class="w-screen h-screen flex items-center justify-center">
            <VcButton size="large" @click="openModal">
                {{ t('home.enterConference') }}
            </VcButton>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { JoinRoomData } from '@/types/forms'
import { CONFERENCE_PAGE_ROUTE } from '@/router'
import JoinRoomModal from '@/components/JoinRoomModal.vue'
import { generateConferenceQueryParameters } from '@/helper/router.helper'

/* Composables */
const { t } = useI18n()
const router = useRouter()

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
