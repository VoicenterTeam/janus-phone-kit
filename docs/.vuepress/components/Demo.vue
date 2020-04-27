<template>
    <div>
      Test
    </div>
</template>
<script>
  import { Session } from '../../../src';
  export default {
    data() {
      return {
        session: null
      }
    },
    mounted() {
      this.session = new Session()
    }
  }
</script>
<style>
</style>
