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
// const summaryCircleRadius = 0.014
// const summaryLeftPadding = 0.05
// const summaryValueSpacing = 0.065
// const editorSummaryPadding = 0.025

/**
 * @param {{session: EditorStatus | ClientStatus, direction: 1 | -1}}
 */
const drawSessionLabel = ({ wedgeCenterAngle, wedgeCenterRadius, direction, session, parent }) => {
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
}

exportDeps({ drawSessionLabel })
