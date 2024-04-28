const { exportDeps, drawText } = window.__WTR__

class HeaderSummary {
  constructor ({parentNode}) {
    this.parentNode = parentNode
    this.draw()
  }

  draw () {
    this.parentNode.innerHTML = ""
    drawText({x: -.86, y: -.73, text: "editors", parentNode: this.parentNode})
    drawText({x: .86, y: -.73, text: "clients", className: "right_header", parentNode: this.parentNode})
  }
}

exportDeps({HeaderSummary})
