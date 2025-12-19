const { drawText, drawSvgElement } = __WTR__

const parentGroup = document.getElementById("headers_group")
parentGroup.innerHTML = ""

const legendCircleRadius = 0.014

const baseLineY = -0.73
const xOffset = 0.86
const legendY = baseLineY + 0.05

// left header
drawText({ x: -xOffset, y: baseLineY, text: "editors", className: "header", parent: parentGroup })

// left legend
let circleStart = -xOffset + 0.093
let labelStart = circleStart + legendCircleRadius * 2

drawSvgElement({
  tag: "circle",
  className: "summary_watched_circle",
  attributes: { r: legendCircleRadius, cx: circleStart, cy: legendY },
  parent: parentGroup,
})

drawText({
  text: "Open",
  textAnchor: "start",
  className: "small_label",
  x: labelStart,
  y: legendY,
  parent: parentGroup,
})

circleStart += 0.1822
labelStart = circleStart + legendCircleRadius * 2

drawSvgElement({
  tag: "circle",
  className: "summary_active_circle",
  attributes: { r: legendCircleRadius, cx: circleStart, cy: legendY },
  parent: parentGroup,
})

drawText({
  text: "Active",
  textAnchor: "start",
  className: "small_label",
  x: labelStart,
  y: legendY,
  parent: parentGroup,
})

// right header
drawText({
  x: xOffset,
  y: baseLineY,
  text: "clients",
  className: ["header", "right_header"],
  parent: parentGroup,
})

// right legend
circleStart = xOffset - 0.3914
labelStart = circleStart + legendCircleRadius * 2

drawSvgElement({
  tag: "circle",
  className: "summary_watched_circle",
  attributes: { r: legendCircleRadius, cx: circleStart, cy: legendY },
  parent: parentGroup,
})

drawText({
  text: "Watch",
  textAnchor: "start",
  className: "small_label",
  x: labelStart,
  y: legendY,
  parent: parentGroup,
})

circleStart += 0.1952
labelStart = circleStart + legendCircleRadius * 2

drawSvgElement({
  tag: "circle",
  className: "summary_active_circle",
  attributes: { r: legendCircleRadius, cx: circleStart, cy: legendY },
  parent: parentGroup,
})

drawText({
  text: "Active",
  textAnchor: "start",
  className: "small_label",
  x: labelStart,
  y: legendY,
  parent: parentGroup,
})
