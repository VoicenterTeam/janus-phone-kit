import { ConfigType } from '@voicenter-team/voicenter-ui-plus/library/types/types/OptionAndConfig.types'

export type EntityConfigType<Entity> = ConfigType & {
    labelKey: keyof Entity
    iconKey?: keyof Entity
    valueKey?: keyof Entity
    keyKey?: keyof Entity
    searchKey?: keyof Entity | Array<keyof Entity>
    disabledKey?: keyof Entity
    colorKey?: keyof Entity
}
