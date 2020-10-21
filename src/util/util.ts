/**
 * Invokes a function with given arguments
 * @param handler function
 * @param payload
 * @return {*} function result
 */
export function invokeFunction (handler, payload) {
  return payload ? handler.apply(null, [payload]) : handler.call(null, payload)
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

/**
 * Generates random string based on a given string length
 * @param {number} len
 * @return {string}
 */
export function randomString(len) {
  const charSet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let randomStr = '';
  // eslint-disable-next-line no-plusplus
  for (let i = 0; i < len; i++) {
    const randomPoz = Math.floor(Math.random() * charSet.length);
    randomStr += charSet.substring(randomPoz, randomPoz + 1);
  }
  return randomStr;
}

export function onceInTimeoutClosure(fun, timeout, threshold = 1) {
  let counter = 0;
  let locked = false;
  return () => {
    if (!locked && ++counter >= threshold) {
      locked = true;
      setTimeout(() => {
        counter = 0;
        locked = false;
      }, timeout);
      fun();
    }
  };
}

export function retryPromise(promiseSupplier, maxAttempts = 5) {
  let counter = 1;
  const retry = (resolve, reject) => {
    promiseSupplier()
      .then(response => resolve(response))
      .catch(err => {
        if (counter++ < maxAttempts) {
          retry(resolve, reject);
        } else {
          reject(err);
        }
      });
  };
  return new Promise((resolve, reject) => {
    retry(resolve, reject);
  })
}
