const { exportDeps, polarToCartesian, coordsToPathData, drawLinearPath, drawCircle, drawText, drawSvgElement, drawToolTip } = window.__WTR__

// a value with a colored circle and tooltip
const drawSummaryValue  = ({x, y, label, circleClass, parentNode}) => {
  const tooltipWrapperGroup = drawSvgElement("g", undefined, "tooltip_wrapper_group", parentNode)
  drawCircle({cx: x, cy: y - 0.0032, r: summaryCircleRadius, className: circleClass, parentNode: tooltipWrapperGroup})
  drawToolTip({x: x, y: y - 0.0032, text: label, parentNode: tooltipWrapperGroup})
  return drawText({x: x + summaryCircleRadius * 2, y: y, dominantBaseline: "middle", text: "0", className: "summary_text_value", parentNode: tooltipWrapperGroup})
}

// similar to summary value, but with an update function that automatically handles moving the circle on the left as the text size changes
const drawRightAlignedSummaryValue  = ({x, y, label, circleClass, parentNode}) => {
  const tooltipWrapperGroup = drawSvgElement("g", undefined, "tooltip_wrapper_group", parentNode)
  drawToolTip({x: x, y: y - 0.0032, text: label, parentNode: tooltipWrapperGroup})
  const textElement =  drawText({x: x + summaryCircleRadius * 2, y: y, dominantBaseline: "middle", text: "0", textAnchor: "end", className: "summary_text_value", parentNode: tooltipWrapperGroup})
  const xDiff = textElement.getBBox().width
  const labelCircle = drawCircle({cx: x - xDiff, cy: y - 0.0032, r: summaryCircleRadius, className: circleClass, parentNode: tooltipWrapperGroup})
  const update = (value) => {
    textElement.innerHTML = value
    const xDiff = textElement.getBBox().width
    labelCircle.setAttribute("cx", x - xDiff)
  }
  return {textElement, update}
}

const underlinePadding = 0.01
const summaryCircleRadius = 0.0140
const summaryLeftPadding = 0.03
const summaryValueSpacing = 0.065
const editorSummaryPadding = 0.025

const addPadding = ({x, y, height, width}, horizontalPadding, verticalPadding) => {
  if (verticalPadding == null) { verticalPadding = horizontalPadding }
  x -= horizontalPadding
  width += horizontalPadding * 2
  y -= verticalPadding
  height += verticalPadding * 2
  return {x, y, height, width}
}

const labelLineDistance = 0.07

class ClientLabel {
  constructor ({wedgeCenterAngle, wedgeCenterRadius, parentNode}) {
    this.parentNode = parentNode
    this.wedgeCenterAngle = wedgeCenterAngle
    this.wedgeCenterRadius = wedgeCenterRadius
    this.wedgeCenter = polarToCartesian(this.wedgeCenterAngle, this.wedgeCenterRadius)
    this.draw()
  }

  draw () {
    const textStart = polarToCartesian(this.wedgeCenterAngle, this.wedgeCenterRadius + labelLineDistance)

    this.topNameElement = drawText({x: textStart[0], y: textStart[1] - 0.06 - underlinePadding / 2, text: "", className: ["wedge_identifier", "small_text"], parentNode: this.parentNode})
    this.nameTextElement = drawText({x: textStart[0], y: textStart[1] - 0.017 - underlinePadding / 2, text: ".", className: "wedge_identifier", parentNode: this.parentNode})

    drawCircle({cx: this.wedgeCenter[0], cy: this.wedgeCenter[1], r: 0.01, className: "test_circle", parentNode: this.parentNode})

    const textBbox = addPadding(this.nameTextElement.getBBox(), 0.00, underlinePadding)
    const underlineCoords = [[this.wedgeCenter[0], this.wedgeCenter[1]], [textBbox.x, textBbox.y + textBbox.height], [textBbox.x + textBbox.width, textBbox.y + textBbox.height]]
    this.underlinePath = drawLinearPath({coords: underlineCoords, className: "test_line", parentNode: this.parentNode})

    const summaryMidY = textBbox.y + textBbox.height + underlinePadding + summaryCircleRadius / 2 + 0.02
    const summaryStartX = textBbox.x + summaryLeftPadding
    this.watchedCountElement = drawSummaryValue({x: summaryStartX, y: summaryMidY, label: "Watched Files", circleClass: "summary_watched_circle", parentNode: this.parentNode})
    const watchedCountBbox = this.watchedCountElement.getBBox()

    const xDiff = summaryValueSpacing + watchedCountBbox.width
    this.activeCountTranslateWrapper = drawSvgElement("g", {transform: `translate(${xDiff}, 0)`}, undefined, this.parentNode)
    this.activeCountElement = drawSummaryValue({x: summaryStartX, y: summaryMidY, label: "Active Files", circleClass: "summary_active_circle", parentNode: this.activeCountTranslateWrapper})
  }

  update (client) {
    let {name} = client
    if (!name || name.length === 0) {
      name = "."
    }

    if (name.length > 14) {
      const halfIndex = Math.floor(name.length / 2)
      const nameFirstHalf = name.substring(0, halfIndex)
      const nameSecondHalf = name.substring(halfIndex, name.length)
      this.topNameElement.innerHTML = nameFirstHalf
      this.nameTextElement.innerHTML = nameSecondHalf
      this.nameTextElement.classList.add("small_text")
    } else {
      this.topNameElement.innerHTML = ""
      this.nameTextElement.classList.remove("small_text")
      this.nameTextElement.innerHTML = name
    }

    const textBbox = addPadding(this.nameTextElement.getBBox(), 0.00, underlinePadding)
    const underlineCoords = [[this.wedgeCenter[0], this.wedgeCenter[1]], [textBbox.x, textBbox.y + textBbox.height], [textBbox.x + textBbox.width, textBbox.y + textBbox.height]]
    const newUnderlinePathData = coordsToPathData(underlineCoords)
    this.underlinePath.setAttribute("d", newUnderlinePathData)

    this.watchedCountElement.innerHTML = client.watchCount
    this.activeCountElement.innerHTML = client.activeWatchCount

    const xDiff = summaryValueSpacing + this.watchedCountElement.getBBox().width
    this.activeCountTranslateWrapper.setAttribute("transform", `translate(${xDiff}, 0)`)
  }
}

class EditorLabel {
  constructor ({wedgeCenterAngle, wedgeCenterRadius, parentNode}) {
    this.parentNode = parentNode
    this.wedgeCenterAngle = wedgeCenterAngle
    this.wedgeCenterRadius = wedgeCenterRadius
    this.wedgeCenter = polarToCartesian(this.wedgeCenterAngle, this.wedgeCenterRadius)
    this.draw()
  }

  draw () {
    const textStart = polarToCartesian(this.wedgeCenterAngle, this.wedgeCenterRadius + labelLineDistance)

    this.topNameElement = drawText({x: textStart[0], y: textStart[1] - 0.06 - underlinePadding / 2, text: "", textAnchor: "end", className: ["wedge_identifier", "small_text"], parentNode: this.parentNode})
    this.nameTextElement = drawText({x: textStart[0], y: textStart[1] - 0.017 - underlinePadding / 2, text: ".", textAnchor: "end", className: "wedge_identifier", parentNode: this.parentNode})

    drawCircle({cx: this.wedgeCenter[0], cy: this.wedgeCenter[1], r: 0.01, className: "test_circle", parentNode: this.parentNode})

    const textBbox = addPadding(this.nameTextElement.getBBox(), 0.00, underlinePadding)
    const underlineCoords = [[this.wedgeCenter[0], this.wedgeCenter[1]], [textBbox.x, textBbox.y + textBbox.height], [textBbox.x + textBbox.width, textBbox.y + textBbox.height]]
    this.underlinePath = drawLinearPath({coords: underlineCoords, className: "test_line", parentNode: this.parentNode})

    const summaryStartX = textBbox.x + textBbox.width - summaryLeftPadding
    const summaryMidY = textBbox.y + textBbox.height + underlinePadding * 3 + summaryCircleRadius / 2

    this.activeCountSummaryValue = drawRightAlignedSummaryValue({x: summaryStartX, y: summaryMidY, label: "Active Files", circleClass: "summary_active_circle", parentNode: this.parentNode})
    const xDiff = this.activeCountSummaryValue.textElement.getBBox().width + summaryCircleRadius + editorSummaryPadding * 2
    this.openFilesTransformGroup = drawSvgElement('g', {transform: `translate(${-xDiff})`}, undefined, this.parentNode)
    this.openCountSummaryValue = drawRightAlignedSummaryValue({x: summaryStartX, y: summaryMidY, label: "Open Files", circleClass: "summary_watched_circle", parentNode: this.openFilesTransformGroup})
  }

  update (editor) {
    let {name} = editor
    if (!name || name.length === 0) {
      name = "."
    }

    if (editor.isServer) {
      name = "* " + name
    }

    if (name.length > 14) {
      const halfIndex = Math.floor(name.length / 2)
      const nameFirstHalf = name.substring(0, halfIndex)
      const nameSecondHalf = name.substring(halfIndex, name.length)
      this.topNameElement.innerHTML = nameFirstHalf
      this.nameTextElement.innerHTML = nameSecondHalf
      this.nameTextElement.classList.add("small_text")
    } else {
      this.topNameElement.innerHTML = ""
      this.nameTextElement.classList.remove("small_text")
      this.nameTextElement.innerHTML = name
    }

    const textBbox = addPadding(this.nameTextElement.getBBox(), 0.00, underlinePadding)
    const underlineCoords = [[this.wedgeCenter[0], this.wedgeCenter[1]], [textBbox.x + textBbox.width, textBbox.y + textBbox.height], [textBbox.x, textBbox.y + textBbox.height]]
    const newUnderlinePathData = coordsToPathData(underlineCoords)
    this.underlinePath.setAttribute("d", newUnderlinePathData)

    this.activeCountSummaryValue.update(editor.activeOpenCount)
    this.openCountSummaryValue.update(editor.openCount)
    const xDiff = this.activeCountSummaryValue.textElement.getBBox().width + summaryCircleRadius + editorSummaryPadding * 2
    this.openFilesTransformGroup.setAttribute("transform", `translate(${-xDiff})`)
  }
}

exportDeps({ClientLabel, EditorLabel})
