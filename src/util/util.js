/**
 * Invokes a function with given arguments
 * @param handler function
 * @param args arguments array
 * @return {*} function result
 */
export function invokeFunction (handler, args) {
  return args ? handler.apply(null, args) : handler.call(null)
}

/**
 * Converts an Array-like object to a real Array.
 * @param list array like object
 * @param start index
 * @return {any[]} real array
 */
export function toArray(list, start = 0) {
  let i = list.length - start
  const ret = new Array(i)
  while (i--) {
    ret[i] = list[i + start]
  }
  return ret
}
