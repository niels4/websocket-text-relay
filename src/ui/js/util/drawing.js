const { exportDeps, evalOnChange } = window.__WTR__

evalOnChange(["js/components/statusRing.js"])

const TWO_PI = 2 * Math.PI
const MAX_ANGLE_DELTA = 0.99999

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

const polarToCartesian = (angle, radius) => {
  const angleRadians = (angle % 1) * TWO_PI
  const x = Math.cos(angleRadians) * radius
  const y = -Math.sin(angleRadians) * radius
  return [x, y]
}

const drawWedge = ({ startAngle, angleDelta, innerRadius, radiusDelta, className, parentNode: parent }) => {
  if (angleDelta < 0) {
    angleDelta = 0
  }
  if (angleDelta > MAX_ANGLE_DELTA) {
    angleDelta = MAX_ANGLE_DELTA
  }
  const endAngle = startAngle + angleDelta
  const outerRadius = innerRadius + radiusDelta
  const largeArcFlag = angleDelta % 1 > 0.5 ? "1" : "0"

  const [startX1, startY1] = polarToCartesian(startAngle, innerRadius)
  const [startX2, startY2] = polarToCartesian(startAngle, outerRadius)
  const [endX1, endY1] = polarToCartesian(endAngle, innerRadius)
  const [endX2, endY2] = polarToCartesian(endAngle, outerRadius)

  const d = `
M ${startX1},${startY1}
A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${endX1},${endY1}
L ${endX2},${endY2}
A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${startX2},${startY2}
Z
`

  return drawSvgElement({ tag: "path", attributes: { d }, className, parent })
}

exportDeps({ drawSvgElement, polarToCartesian, drawWedge })
