export function compareArray(arr1: Uint8Array, arr2: Uint8Array): boolean {
    if (arr1.byteLength !== arr2.byteLength) {
        return false
    }

    for (let index = 0; index < arr1.byteLength; index++) {
        if (arr1[index] !== arr2[index]) {
            return false
        }
    }

    return true
}