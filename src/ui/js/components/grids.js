const { exportDeps, drawLine, drawCircle, drawPolarLine } = window.__WTR__

const gridCellWidth = 0.08
const maxGrid = 1

const drawGrid = (parentNode) => {
  for (let i = 0; i < maxGrid; i += gridCellWidth) {
    const className = i === 0 ? "grid_axis" : "grid_line"
    drawLine({x1: -1, y1: i, x2: 1, y2: i, className, parentNode})
    drawLine({x1: -1, y1: -i, x2: 1, y2: -i, className, parentNode})
    drawLine({x1: i, y1: -1, x2: i, y2: 1, className, parentNode})
    drawLine({x1: -i, y1: -1, x2: -i, y2: 1, className, parentNode})
  }
}

const radiusDiff = 0.04
const angleDiff = 0.025

const drawPolarGrid = (parentNode) => {
  for (let r = 0; r <= 1.0001; r += radiusDiff) {
    drawCircle({cx: 0, cy: 0, r, className: "grid_line", parentNode})
  }

  for (let angle = 0; angle < 1; angle += angleDiff) {
    drawPolarLine({startAngle: 0, startRadius: 0, endAngle: angle, endRadius: 1, className: "grid_line", parentNode})
  }
}

exportDeps({drawGrid, drawPolarGrid})
