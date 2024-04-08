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

const defaultAllowedHost = "localhost"

export const isValidOrigin = (req) => {
  const {host, origin} = req.headers
  let hostname

  if (origin == null || origin.length === 0) {
    hostname = host.split(":")[0]
  } else {
    const url = new URL(origin)
    hostname = url.hostname
  }

  return hostname === defaultAllowedHost
}
