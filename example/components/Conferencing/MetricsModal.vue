<template>
  <VcModal
    :visible="modalVisibleModel"
    :header="t('home.metricsModal.header')"
    :breakpoints="{
                        '960px': '80vw', '680px': '95vw'
                    }"
    width="50vw"
    append-to="body"
    @close="closeModal"
  >
    <div>
      <div v-for="key in Object.keys(metricsReport)">
        <b>{{ getParticipantName(key) }} ({{ key }})</b>:
        <div>
          <div v-for="kProp in Object.keys(metricsReport[key])">
            {{ kProp }}: {{metricsReport[key][kProp]}}
          </div>
        </div>
      </div>
    </div>
  </VcModal>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useVModel } from '@vueuse/core'
import useJanusPhoneKit from '@/composables/useJanusPhoneKit'

/* Composable */
const { t } = useI18n()
const {
    metricsReport,
    mainSource,
    sourcesExceptMain

} = useJanusPhoneKit()

/* Props */
export interface Props {
  modalVisible?: boolean
}

const props = withDefaults(
    defineProps<Props>(),
    {
        modalVisible: false
    }
)

/* Emit */
export interface Emit {
  (e: 'update:modalVisible', payload: boolean): void
}

const emit = defineEmits<Emit>()

/* Data */
const modalVisibleModel = useVModel(props, 'modalVisible', emit)

/* Methods */
const closeModal = () => {
    modalVisibleModel.value = false
}

const getParticipantName = (id) => {
    const allSources = [ ...sourcesExceptMain.value, mainSource.value ]
    const participant = allSources.find((source) => {
        return String(source.id) === id
    })

    return participant ? participant.name : ''
}
</script>
