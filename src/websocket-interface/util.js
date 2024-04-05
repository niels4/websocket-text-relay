// this version of the function does not handle function arguments because it was not needed for this app
export const debounce = (timeout, func) => {
  let timeoutHandle = null
  return () => {
    clearTimeout(timeoutHandle)
    timeoutHandle = setTimeout(func, timeout)
  }
}

// first ID returned is 0 and increases every time function is called
let currentId = 0
export const getNextId = () => currentId++
