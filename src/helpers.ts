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

export function createRandomString(length: number): string {
  const charset =
    "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"
  const randomValues = Array.from(
    getCrypto().getRandomValues(new Uint8Array(length))
  )
  return randomValues.map(v => charset[v % charset.length]).join("")
}

export function getCrypto(): Crypto {
  //ie 11.x uses msCrypto
  return (window.crypto ||
    (window as unknown as { msCrypto: Crypto }).msCrypto) as Crypto
}

export function createQueryParams(
  params: Record<string, string | number>
): string {
  return Object.keys(params)
    .filter(k => params[k] !== null && params[k] !== undefined)
    .map(k => encodeURIComponent(k) + "=" + encodeURIComponent(params[k]!))
    .join("&")
}

/**
 * 弹出子窗口
 *
 * @param url
 * @param title
 * @returns
 */
export function popup(url: string, title: string): Window | null {
  const dualScreenLeft = window.screenLeft ?? window.screenX
  const dualScreenTop = window.screenTop ?? window.screenY
  const windowWidth =
    window.innerWidth ?? document.documentElement.clientWidth ?? screen.width
  const windowHeight =
    window.innerHeight ?? document.documentElement.clientHeight ?? screen.height
  const width = Math.min(800, windowWidth / 2)
  const height = Math.min(600, windowHeight / 2)
  const left = (windowWidth - width) / 2 + dualScreenLeft
  const top = (windowHeight - height) / 2 + dualScreenTop
  return window.open(
    url,
    title,
    `scrollbars=yes, width=${width}, height=${height}, top=${top}, left=${left}`
  )
}
