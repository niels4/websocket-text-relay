const dependencies = {}
// we export dependencies to the __WTR__ object on the global scope
window.__WTR__ = dependencies

const exportDeps = (exportObj) => Object.assign(dependencies, exportObj)

// export the exportDeps function
exportDeps({ exportDeps })
