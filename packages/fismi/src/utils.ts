/**
 * Function to check if the received value is a promise
 * @param p checking value
 * @returns {boolean}
 * 
 * @examples
 * ```js
 * isPromise(null) // false
 * isPromise(undefined) // false
 * isPromise({}) // false
 * isPromise({ then: () => {}, catch: () => {} }) // true
 * isPromise(new Promise(() => {})) // true
 * isPromise(Promise.resolve('')) // true
 * ```
 */
export function isPromise(p: any) {
  if (
    p !== null &&
    typeof p === 'object' &&
    typeof p.then === 'function' &&
    typeof p.catch === 'function'
  ) {
    return true;
  }

  return false;
}
