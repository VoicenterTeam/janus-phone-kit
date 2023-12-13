<template>
    <div>
        <p>
            Hello, you are <strong>{{ joined ? 'Joined' : 'Not Joined' }}</strong>
        </p>

        <button v-if="!joined" @click="join">
            Join!
        </button>

        <div class="fixed top-0 right-0 other-participants">
            <div
                v-for="source in sources"
                :key="source.id"
                class="mr-2 mb-2 relative border-2 border-default-text rounded cursor-pointer"
            >
                <video
                    :srcObject.prop="source.stream"
                    :id="source.id"
                    :controls="false"
                    :muted="source.type === 'publisher'"
                    :volume="source.type === 'publisher' ? 0: 0.9"
                    :width="200"
                    height="150"
                    autoplay
                    playsinline
                >
                </video>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import useJanusPhoneKit from '@/composables/useJanusPhoneKit'

/* Composables */
const { joinEchoTest, sources } = useJanusPhoneKit()

/* Data */
const joined = ref(false)

/* Methods */
async function join () {
    try {
        await joinEchoTest({
            audio: true,
            video: true,
        })

        joined.value = true
    } catch (e) {
        console.log(e)
    }
}
</script>
