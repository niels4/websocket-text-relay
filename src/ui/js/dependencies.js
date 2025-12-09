import "./util/dependencyManager.js" // make sure the global __WTR__ object is initilized with the exportDeps function
const { exportDeps } = window.__WTR__

let currentEvalOnChangeFiles = []

export const getEvalOnChangeFiles = () => currentEvalOnChangeFiles

export const clearEvalOnChangeFiles = () => {
  currentEvalOnChangeFiles = []
}

// function used by live js files
const evalOnChange = (files) => {
  currentEvalOnChangeFiles = files
}

exportDeps({ evalOnChange })
