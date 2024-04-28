const { exportDeps } = window.__WTR__

const TWO_PI = 2 * Math.PI
const MAX_ANGLE_DELTA = .99999

const drawSvgElement = ({tag, attributes = {}, className, parent}) => {
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

const drawText = ({x, y, text, dominantBaseline, textAnchor, className, parentNode: parent}) => {
  const textElement = drawSvgElement({tag: "text", attributes: {x, y, "dominant-baseline": dominantBaseline, "text-anchor": textAnchor}, className, parent})
  textElement.textContent = text
  return textElement
}

const drawLine = ({x1, y1, x2, y2, className, parentNode: parent}) => {
  return drawSvgElement({tag: "line", attributes: {x1, y1, x2, y2}, className, parent})
}

const drawCircle = ({cx, cy, r, className, parentNode: parent}) => {
  return drawSvgElement({tag: "circle", attributes: {cx, cy, r}, className, parent})
}

const coordsToPathData = (coords) => "M " + coords.map(coord => coord.join(',')).join(" L ")

const drawLinearPath = ({coords, className, parentNode: parent}) => {
  const d = coordsToPathData(coords)
  return drawSvgElement({tag: "path", attributes: {d}, className, parent})
}

const polarToCartesian = (angle, radius) => {
  const angleRadians = (angle % 1) * TWO_PI
  const x = Math.cos(angleRadians) * radius
  const y = -Math.sin(angleRadians) * radius
  return [x, y]
}

const drawPolarLine = ({startAngle, startRadius, endAngle, endRadius, className, parentNode: parent}) => {
  const [x1, y1] = polarToCartesian(startAngle, startRadius)
  const [x2, y2] = polarToCartesian(endAngle, endRadius)

  return drawSvgElement({tag: "line", attributes: {x1, y1, x2, y2}, className, parent})
}

const drawPolarCircle = ({angle, radius, r, className, parentNode: parent}) => {
  const [cx, cy] = polarToCartesian(angle, radius)
  return drawSvgElement({tag: "circle", attributes: {cx, cy, r}, className, parent})
}

const drawWedge = ({startAngle, angleDelta, innerRadius, radiusDelta, className, parentNode: parent}) => {
  if (angleDelta < 0) { angleDelta = 0 }
  if (angleDelta > MAX_ANGLE_DELTA) {angleDelta = MAX_ANGLE_DELTA }
  const endAngle = startAngle + angleDelta
  const outerRadius = innerRadius + radiusDelta
  const largeArcFlag = (angleDelta % 1) > .5 ? "1" : "0"

  const [startX1, startY1] = polarToCartesian(startAngle, innerRadius)
  const [startX2, startY2] = polarToCartesian(startAngle, outerRadius)
  const [endX1, endY1] = polarToCartesian(endAngle, innerRadius)
  const [endX2, endY2] = polarToCartesian(endAngle, outerRadius)

  const d = `
M ${startX1} ${startY1},
A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${endX1} ${endY1},
L ${endX2} ${endY2},
A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${startX2} ${startY2},
Z
`

  return drawSvgElement({tag: "path", attributes: {d}, className, parent})
}

const triangleHeight = 0.06
const verticalPadding = 0.01
const horizontalPadding = 0.04

const drawToolTip = ({x, y, text, direction = "below", parentNode: parent}) => {
  const directionMultiplier = direction === "above" ? -1 : 1
  const tooltipDisplayGroup = drawSvgElement({tag: "g", className: "tooltip_display_group", parent})
  const bgPlaceholder = drawSvgElement({tag: "g", parent: tooltipDisplayGroup})
  const textY = y + (triangleHeight + verticalPadding) * directionMultiplier
  const textElement = drawText({x, y: textY, text, className: "tooltip_text", parentNode: tooltipDisplayGroup})
  const textBbox = textElement.getBBox()
  const attributes = {
    x: textBbox.x - horizontalPadding,
    y: textBbox.y - verticalPadding,
    width: textBbox.width + horizontalPadding * 2,
    height: textBbox.height + verticalPadding * 2,
    rx: 0.015
  }
  drawSvgElement({tag: "rect", attributes, className: "tooltip_outline", parent: bgPlaceholder})
}

exportDeps({drawSvgElement, drawLine, drawCircle, drawLinearPath, drawPolarLine, drawPolarCircle, drawWedge,
  drawText, polarToCartesian, coordsToPathData, drawToolTip})
