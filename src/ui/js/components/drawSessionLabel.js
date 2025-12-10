const {
  drawSvgElement,
  drawPolarCircle,
  drawPolarLine,
  drawText,
  polarToCartesian,
  exportDeps,
  evalOnChange,
} = __WTR__

evalOnChange(["js/components/sessionWedges.js"])

const labelLineDistance = 0.07
const underlinePadding = 0.02
const summaryCircleRadius = 0.014
const summaryValueSpacing = 0.1

/**
 * @param {{session: EditorStatus | ClientStatus, direction: 1 | -1}}
 */
const drawSessionLabel = ({ wedgeCenterAngle, wedgeCenterRadius, session, direction, parent }) => {
  drawPolarCircle({
    angle: wedgeCenterAngle,
    radius: wedgeCenterRadius,
    r: 0.01,
    className: "wedge_label_dot",
    parent,
  })

  const textStartRadius = wedgeCenterRadius + labelLineDistance
  drawPolarLine({
    startAngle: wedgeCenterAngle,
    startRadius: wedgeCenterRadius,
    endAngle: wedgeCenterAngle,
    endRadius: textStartRadius,
    className: "wedge_label_line",
    parent,
  })

  const serverIndicator = session.isServer ? "* " : ""
  const [textStartX, textStartY] = polarToCartesian(wedgeCenterAngle, textStartRadius)
  const nameTextNode = drawText({
    x: textStartX,
    y: textStartY - underlinePadding,
    text: serverIndicator + session.name,
    textAnchor: direction === 1 ? "end" : "start",
    className: "wedge_identifier",
    parent,
  })
  const nameTextBBox = nameTextNode.getBBox()

  const underlineX2 = direction === 1 ? nameTextBBox.x : nameTextBBox.x + nameTextBBox.width
  drawSvgElement({
    tag: "line",
    attributes: { x1: textStartX, y1: textStartY, x2: underlineX2, y2: textStartY },
    className: "wedge_label_line",
    parent,
  })

  const summaryGroup = drawSvgElement({ tag: "g", parent })

  let currentSummaryX = textStartX

  const { leftText, rightText } =
    direction === 1
      ? { leftText: session.openCount, rightText: session.activeOpenCount }
      : { leftText: session.watchCount, rightText: session.activeWatchCount }

  drawText({
    x: currentSummaryX + summaryCircleRadius * 2,
    y: textStartY,
    text: leftText,
    dominantBaseline: "middle",
    className: "summary_text_value",
    parent: summaryGroup,
  })

  drawSvgElement({
    tag: "circle",
    attributes: {
      cx: currentSummaryX,
      cy: textStartY - summaryCircleRadius / 2,
      r: summaryCircleRadius,
    },
    className: "summary_watched_circle",
    parent: summaryGroup,
  })

  currentSummaryX += summaryValueSpacing

  drawText({
    x: currentSummaryX + summaryCircleRadius * 2,
    y: textStartY,
    text: rightText,
    dominantBaseline: "middle",
    className: "summary_text_value",
    parent: summaryGroup,
  })

  drawSvgElement({
    tag: "circle",
    attributes: {
      cx: currentSummaryX,
      cy: textStartY - summaryCircleRadius / 2,
      r: summaryCircleRadius,
    },
    className: "summary_active_circle",
    parent: summaryGroup,
  })

  const summaryGroupBBox = summaryGroup.getBBox()
  const translateX = direction === 1 ? -summaryGroupBBox.width - 0.02 : 0.05
  const translateY = summaryGroupBBox.height / 2 + 0.014
  summaryGroup.setAttribute("transform", `translate(${translateX}, ${translateY})`)
}

exportDeps({ drawSessionLabel })
