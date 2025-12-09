import { exportDeps } from "./dependencyManager.js" // make sure the global __WTR__ object is initilized with the exportDeps function

let currentEvalOnChangeFiles = []

// functions used by setup
export const getEvalOnChangeFiles = () => currentEvalOnChangeFiles

export const clearEvalOnChangeFiles = () => {
  currentEvalOnChangeFiles = []
}

// function used by live js files
// define which functions need to be run every time that file changes
const evalOnChange = (files) => {
  currentEvalOnChangeFiles = files
}

exportDeps({ evalOnChange })
