<template>
    <div class="w-24 h-24 flex items-center justify-center text-xl bg-teal-500 text-white font-semibold uppercase tracking-wider rounded-full shadow-lg">
      {{name}}
    </div>
</template>
<script>
  export default {
    props: {
      name: String,
    }
  }
</script>
<style>
</style>
