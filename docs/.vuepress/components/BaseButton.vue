<template>
  <button
    v-bind="$attrs"
    class="rounded-md mr-2 px-4 md:px-5 xl:px-4 py-3 md:py-4 xl:py-3 md:text-lg xl:text-base text-white font-semibold leading-tight shadow-md"
    :class="{
      'bg-teal-500 hover:bg-teal-600': variant === 'primary',
      'opacity-50 cursor-not-allowed': $attrs.disabled
    }"
  >
    <slot></slot>
  </button>
</template>
<script>
  export default {
    inheritAttrs: false,
    props: {
      variant: {
        type: String,
        default: 'primary'
      }
    }
  }
</script>
<style>
</style>
