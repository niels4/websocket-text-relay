// const FILE_PREFIX = "websocket-text-relay/src/ui/"
const CSS_FILE = "css/main.css"
// const cssEndsWith = FILE_PREFIX + CSS_FILE

const cssElement = document.getElementById("main_style")

const handleCss = (contents) => {
  cssElement.innerText = contents
}

const initFiles = async () => {
  await fetch(CSS_FILE)
    .then((r) => r.text())
    .then(handleCss)
}

await initFiles()
