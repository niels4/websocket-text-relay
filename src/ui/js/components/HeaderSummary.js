const { exportDeps, drawText } = window.__WTR__

class HeaderSummary {
  constructor({ parentNode }) {
    this.parentNode = parentNode
    this.draw()
  }

  draw() {
    this.parentNode.innerHTML = ""
    drawText({ x: -0.86, y: -0.73, text: "editors", parentNode: this.parentNode })
    drawText({
      x: 0.86,
      y: -0.73,
      text: "clients",
      className: "right_header",
      parentNode: this.parentNode,
    })
  }
}

exportDeps({ HeaderSummary })
