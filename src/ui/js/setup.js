// const FILE_PREFIX = "websocket-text-relay/src/ui/"
const CSS_FILE = "css/main.css"
// const cssEndsWith = FILE_PREFIX + CSS_FILE

const jsFiles = ["js/components/statusRing.js"]

const cssElement = document.getElementById("main_style")

const handleCss = (contents) => {
  cssElement.innerText = contents
}

const handleJs = (contents) => {
  try {
    eval(contents)
  } catch (e) {
    window._lastEvalError = e
    console.log(e)
  }
}

const initFiles = async () => {
  await fetch(CSS_FILE)
    .then((r) => r.text())
    .then(handleCss)
  const jsFetches = jsFiles.map(async (fileName) => {
    return fetch(fileName).then((r) => r.text())
  })
  const jsResults = await Promise.all(jsFetches)
  requestAnimationFrame(() => {
    // wait for one frame to make sure css is applied first
    jsResults.forEach((contents) => {
      handleJs(contents)
    })
  })
}

await initFiles()
