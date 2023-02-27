/**
 * Utilities for working with typescript types
 */

/**
 * A generic type that returns all property names of a class whose type is not "function"
 */
export type NonFunctionPropertyNames<T> = {
  [K in keyof T]: T[K] extends Function ? never : K
}[keyof T]

/**
 * A generic type that returns only properties of a class that are not functions
 */
export type NonFunctionProperties<T> = Pick<T, NonFunctionPropertyNames<T>>

/**
 * A type alias for better readibility
 */
export type Json<T> = NonFunctionProperties<T>

export declare class SerializableClass {
  /**
   * Converts the current instance in a regular JSON.
   * It will be automatically called by JSON.stringify()
   */
  toJSON(): Json<this>
}

/**
 * Unwrap the type of a promise
 */
export type Await<T> = T extends {
  then(onfulfilled?: (value: infer U) => unknown): unknown
}
  ? U
  : T

/**
 * Assert U is assignable to T.
 */
export type Assert<T, U extends T> = U
