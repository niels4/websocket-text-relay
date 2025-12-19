const { exportDeps, evalOnChange } = window.__WTR__

evalOnChange(["js/components/statusRing.js", "js/components/sessionWedges.js"])

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

const drawText = ({ x, y, text, attributes = {}, dominantBaseline, textAnchor, className, parent }) => {
  const textElement = drawSvgElement({
    tag: "text",
    attributes: { ...attributes, x, y },
    className,
    parent,
  })
  textElement.textContent = text
  if (textAnchor) {
    textElement.style["text-anchor"] = textAnchor
  }
  if (dominantBaseline) {
    textElement.style["dominant-baseline"] = dominantBaseline
  }
  return textElement
}

const polarToCartesian = (angle, radius) => {
  const angleRadians = (angle % 1) * TWO_PI
  const x = Math.cos(angleRadians) * radius
  const y = -Math.sin(angleRadians) * radius
  return [x, y]
}

const drawWedge = ({ startAngle, angleDelta, innerRadius, radiusDelta, className, parent }) => {
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

const drawPolarLine = ({ startAngle, startRadius, endAngle, endRadius, className, parent }) => {
  const [x1, y1] = polarToCartesian(startAngle, startRadius)
  const [x2, y2] = polarToCartesian(endAngle, endRadius)

  return drawSvgElement({ tag: "line", attributes: { x1, y1, x2, y2 }, className, parent })
}

const drawPolarCircle = ({ angle, radius, r, className, parent }) => {
  const [cx, cy] = polarToCartesian(angle, radius)
  return drawSvgElement({ tag: "circle", attributes: { cx, cy, r }, className, parent })
}

exportDeps({ drawSvgElement, drawText, polarToCartesian, drawWedge, drawPolarLine, drawPolarCircle })
