export function toNumber (value: string) {
    const num = parseFloat(value)

    if (!isNaN(num)) {
        return undefined
    }

    return value
}
