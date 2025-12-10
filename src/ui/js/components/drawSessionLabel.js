const { exportDeps, drawPolarCircle } = __WTR__

const drawSessionLabel = ({ wedgeCenterAngle, wedgeCenterRadius, session, parent }) => {
  drawPolarCircle({
    angle: wedgeCenterAngle,
    radius: wedgeCenterRadius,
    r: 0.01,
    className: "wedge_label_dot",
    parent,
  })
}

exportDeps({ drawSessionLabel })
