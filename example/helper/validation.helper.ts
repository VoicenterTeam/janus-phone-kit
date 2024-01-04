export function isNumeric (value) {
    return !isNaN(value) && typeof value !== 'boolean' && value !== '' && !isNaN(parseFloat(value)) && isFinite(value);
}
