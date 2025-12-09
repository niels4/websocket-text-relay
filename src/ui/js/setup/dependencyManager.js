const dependencies = {}
// we export dependencies used in live js files to the __WTR__ object on the global scope
window.__WTR__ = dependencies

// export function to be used in other setup files
export const exportDeps = (exportObj) => Object.assign(dependencies, exportObj)

// export function to be used in live util files
exportDeps({ exportDeps })
