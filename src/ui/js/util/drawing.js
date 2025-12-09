const { exportDeps } = window.__WTR__

const drawSvgElement = ({ tag, attributes = {}, className, parent }) => {
  const element = document.createElementNS("http://www.w3.org/2000/svg", tag)

  if (className && className.length > 0) {
    if (Array.isArray(className)) {
      element.classList.add(...className)
    } else {
      element.classList.add(className)
    }
  }

  Object.entries(attributes).forEach(([name, val]) => {
    if (val != null) {
      element.setAttribute(name, val)
    }
  })

  if (parent) {
    parent.append(element)
  }

  return element
}

exportDeps({ drawSvgElement })
