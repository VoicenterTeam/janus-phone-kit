<template>
    <router-view :key="key" />
</template>

<script lang="ts" setup>
import { ref } from 'vue'
const key = ref(Date.now())

const restart = () => {
    key.value = Date.now()
}

window.restart = restart
</script>
