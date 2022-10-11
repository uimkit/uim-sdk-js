/**
 * Utility for enforcing exhaustiveness checks in the type system.
 *
 * @see https://basarat.gitbook.io/typescript/type-system/discriminated-unions#throw-in-exhaustive-checks
 *
 * @param value The variable with no remaining values
 */
export function assertNever(value: never): never {
  throw new Error(`Unexpected value should never occur: ${value}`)
}

type AllKeys<T> = T extends unknown ? keyof T : never

export function pick<O extends unknown, K extends AllKeys<O>>(
  base: O,
  keys: readonly K[]
): Pick<O, K> {
  const entries = keys.map(key => [key, base?.[key]])
  return Object.fromEntries(entries)
}

export function isObject(o: unknown): o is Record<PropertyKey, unknown> {
  return typeof o === "object" && o !== null
}

export function createRandomString(length: number) {
  const charset =
    '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'
  const randomValues = Array.from(
    getCrypto().getRandomValues(new Uint8Array(length))
  )
  return randomValues.map(v => charset[v % charset.length]).join('')
}

export function getCrypto() {
  //ie 11.x uses msCrypto
  return (window.crypto || (window as any).msCrypto) as Crypto
}

export function createQueryParams(params: any) {
  return Object.keys(params)
    .filter(k => params[k] !== null && params[k] !== undefined)
    .map(
      k => encodeURIComponent(k) + '=' + encodeURIComponent(params[k] as string)
    )
    .join('&')
}