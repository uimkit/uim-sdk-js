/**
 * Utility for enforcing exhaustiveness checks in the type system.
 *
 * @see https://basarat.gitbook.io/typescript/type-system/discriminated-unions#throw-in-exhaustive-checks
 *
 * @param value The variable with no remaining values
 */
export function assertNever(value) {
    throw new Error(`Unexpected value should never occur: ${value}`);
}
export function pick(base, keys) {
    const entries = keys.map(key => [key, base?.[key]]);
    return Object.fromEntries(entries);
}
export function isObject(o) {
    return typeof o === "object" && o !== null;
}
export function createRandomString(length) {
    const charset = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
    const randomValues = Array.from(getCrypto().getRandomValues(new Uint8Array(length)));
    return randomValues.map(v => charset[v % charset.length]).join("");
}
export function getCrypto() {
    //ie 11.x uses msCrypto
    return (window.crypto ||
        window.msCrypto);
}
export function createQueryParams(params) {
    return Object.keys(params)
        .filter(k => params[k] !== null && params[k] !== undefined)
        .map(k => encodeURIComponent(k) + "=" + encodeURIComponent(params[k]))
        .join("&");
}
//# sourceMappingURL=helpers.js.map