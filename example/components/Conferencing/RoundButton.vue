<template>
  <div
      class="round-button"
      :class="classes"
      @click="onClick"
  >
    <i :class="`${iconClasses} content-icon`" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

/* Props */
export interface Props {
  icon: string,
  color: string,
  size?: string,
  disabled?: boolean,
  active?: boolean,
  activeIcon?: string
}

const props = withDefaults(
    defineProps<Props>(),
    {
        icon: '',
        color: '',
        size: 'medium',
        disabled: false,
        active: false,
        activeIcon: ''
    })

/* Emit */
const emit = defineEmits<{
  (e: 'click'): void
}>()

/* Computed */
const classes = computed(() => {
    let styles = `round-button-size--${props.size} `

    if (props.disabled) {
        styles += 'text-inactive-elements'
        return styles
    }

    if (props.active) {
        styles += `bg-${props.color} text-btn-filled-text hover:bg-${props.color}--focus`
    } else {
        styles += `text-${props.color} hover:shadow focus:outline-none`
    }

    return styles
})

const iconClasses = computed(() => {
    return props.active && props.activeIcon ? props.activeIcon : props.icon
})

/* Methods */
const onClick = () => {
    if (!props.disabled) {
        emit('click')
    }
}
</script>

<style scoped lang="scss">
.round-button {
  @apply flex items-center justify-center cursor-pointer border rounded-full border-field-borders transition duration-300;

  &-size--large {
    width: 80px;
    height: 80px;

    .content-icon {
      @apply text-4xl;
    }
  }

  &-size--medium {
    width: 60px;
    height: 60px;

    .content-icon {
      @apply text-2xl
    }
  }

  &-size--small {
    width: 50px;
    height: 50px;

    .content-icon {
      @apply text-xl;
    }
  }

  &-size--minimal {
    width: 30px;
    height: 30px;

    .content-icon {
      @apply text-sm;
    }
  }
}
</style>
