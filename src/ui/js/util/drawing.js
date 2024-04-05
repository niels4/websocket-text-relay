const { exportDeps } = window.__WTR__

const TWO_PI = 2 * Math.PI
const MAX_ANGLE_DELTA = .99999

const drawSvgElement = (tagName, attributes = {}, className, parentNode) => {
  const element = document.createElementNS("http://www.w3.org/2000/svg", tagName)

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

  if (parentNode) {
    parentNode.append(element)
  }

  return element
}

const drawText = ({x, y, text, dominantBaseline, textAnchor, className, parentNode}) => {
  const textElement = drawSvgElement("text", {x, y, "dominant-baseline": dominantBaseline, "text-anchor": textAnchor}, className, parentNode)
  textElement.innerHTML = text
  return textElement
}

const drawLine = ({x1, y1, x2, y2, className, parentNode}) => {
  return drawSvgElement("line", {x1, y1, x2, y2}, className, parentNode)
}

const drawCircle = ({cx, cy, r, className, parentNode}) => {
  return drawSvgElement("circle", {cx, cy, r}, className, parentNode)
}

const coordsToPathData = (coords) => "M " + coords.map(coord => coord.join(',')).join(" L ")

const drawLinearPath = ({coords, className, parentNode}) => {
  const d = coordsToPathData(coords)
  return drawSvgElement("path", {d}, className, parentNode)
}

const drawPolarLine = ({startAngle, startRadius, endAngle, endRadius, className, parentNode}) => {
  const startAngleRadians = (startAngle % 1) * TWO_PI
  const endAngleRadians = (endAngle % 1) * TWO_PI
  const x1 = Math.cos(startAngleRadians) * startRadius
  const y1 = -Math.sin(startAngleRadians) * startRadius
  const x2 = Math.cos(endAngleRadians) * endRadius
  const y2 = -Math.sin(endAngleRadians) * endRadius

  return drawSvgElement("line", {x1, y1, x2, y2}, className, parentNode)
}

const drawPolarCircle = ({angle, radius, r, className, parentNode}) => {
  const angleRadians = (angle % 1) * TWO_PI
  const cx = Math.cos(angleRadians) * radius
  const cy = -Math.sin(angleRadians) * radius

  return drawSvgElement("circle", {cx, cy, r}, className, parentNode)
}

const polarToCartesian = (angle, radius) => {
  const angleRadians = (angle % 1) * TWO_PI
  const x = Math.cos(angleRadians) * radius
  const y = -Math.sin(angleRadians) * radius
  return [x, y]
}

const drawWedge = ({startAngle, angleDelta, innerRadius, radiusDelta, className, parentNode}) => {
  if (angleDelta < 0) { angleDelta = 0 }
  if (angleDelta > MAX_ANGLE_DELTA) {angleDelta = MAX_ANGLE_DELTA }

  const startAngleRadians = (startAngle % 1) * TWO_PI
  const endAngleRadians = ((startAngle + angleDelta) % 1) * TWO_PI
  const outerRadius = innerRadius + radiusDelta
  const largeArcFlag = (angleDelta % 1) > .5 ? "1" : "0"

  const startX1 = Math.cos(startAngleRadians) * innerRadius
  const startY1 = -Math.sin(startAngleRadians) * innerRadius
  const startX2 = Math.cos(startAngleRadians) * outerRadius
  const startY2 = -Math.sin(startAngleRadians) * outerRadius
  const endX1 = Math.cos(endAngleRadians) * innerRadius
  const endY1 = -Math.sin(endAngleRadians) * innerRadius
  const endX2 = Math.cos(endAngleRadians) * outerRadius
  const endY2 = -Math.sin(endAngleRadians) * outerRadius

  const d = `
M ${startX1} ${startY1},
A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${endX1} ${endY1},
L ${endX2} ${endY2},
A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${startX2} ${startY2},
Z
`

  return drawSvgElement("path", {d}, className, parentNode)
}

const triangleHeight = 0.06
const verticalPadding = 0.01
const horizontalPadding = 0.04

const drawToolTip = ({x, y, text, direction = "below", parentNode}) => {
  const directionMultiplier = direction === "above" ? -1 : 1
  const tooltipDisplayGroup = drawSvgElement("g", undefined, "tooltip_display_group", parentNode)
  const bgPlaceholder = drawSvgElement("g", undefined, undefined, tooltipDisplayGroup)
  const textY = y + (triangleHeight + verticalPadding) * directionMultiplier
  const textElement = drawText({x, y: textY, text, className: "tooltip_text", parentNode: tooltipDisplayGroup})
  const textBbox = textElement.getBBox()
  const rectAttributes = {
    x: textBbox.x - horizontalPadding,
    y: textBbox.y - verticalPadding,
    width: textBbox.width + horizontalPadding * 2,
    height: textBbox.height + verticalPadding * 2,
    rx: 0.015
  }
  drawSvgElement("rect", rectAttributes, "tooltip_outline", bgPlaceholder)
}

exportDeps({drawSvgElement, drawLine, drawCircle, drawLinearPath, drawPolarLine, drawPolarCircle, drawWedge,
  drawText, polarToCartesian, coordsToPathData, drawToolTip})
