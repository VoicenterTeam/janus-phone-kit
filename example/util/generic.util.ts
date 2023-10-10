export function toNumber (value: string) {
    const num = parseFloat(value)

    if (!isNaN(num)) {
        return undefined
    }

    return value
}

export function deepMerge<TObject, TSource> (target: TObject, source: TSource): TObject & TSource {
    if (Array.isArray(target) && Array.isArray(source)) {
        return source as unknown as TObject & TSource
    }

    if (typeof target === 'object' && target !== null && typeof source === 'object' && source !== null) {
        for (const key in source) {
            if (Object.prototype.hasOwnProperty.call(source, key)) {
                if (typeof source[key] === 'object' && source[key] !== null) {
                    target[key] = deepMerge(target[key], source[key])
                } else {
                    target[key] = source[key]
                }
            }
        }

        return target
    }

    return source as unknown as TObject & TSource
}

