/* eslint-disable @typescript-eslint/no-explicit-any */
import i18n from '@/plugins/i18n'
import { isNumeric } from '@/helper/validation.helper'

const notZero = (message: string) => (rule: any, value: any, calback: any) => {
    if (value === undefined || value === 0) {
        calback(new Error(message))
    } else {
        calback()
    }
}

const isNumber = (message: string) => (rule: any, value: number | string, callback: any) => {
    if (typeof value === 'number') {
        return true
    }
    const isStringValid = value.split('').every(el => !isNaN(Number(el)))
    if (!isStringValid) {
        callback(new Error(message))
    } else {
        callback()
    }
}



const isNoneNumeric = (message: string) => (rule: any, value: number | string, callback: any) => {
    if (typeof value === 'number' || isNumeric(value)) {
        callback(new Error(message))
    } else {
        callback()
    }
}

export default function () {
    const { t } = i18n.global

    return {
        required: {
            required: true,
            message: t('general.validation.required')
        },
        email: { type: 'email' },
        min: (minValue: number) => {
            return {
                validator: (rule: unknown, value: number, callback: (error?: Error) => void) => {
                    if (value < minValue) {
                        callback(new Error(t('general.validation.biggerThan', { value: minValue })))
                    } else {
                        callback()
                    }
                }
            }
        },
        notZero: {
            validator: notZero(t('general.validation.required')),
        },
        number: {
            validator: isNumber(t('general.validation.numeric'))
        },
        noneNumeric: {
            validator: isNoneNumeric(t('general.validation.noneNumeric'))
        }
    }
}
