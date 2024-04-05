const { exportDeps, drawText } = window.__WTR__

class HeaderSummary {
  constructor ({parentNode}) {
    this.parentNode = parentNode
    this.draw()
  }

  draw () {
    this.parentNode.innerHTML = ""
    drawText({x: -.86, y: -.73, text: "editors", parentNode: this.parentNode})
    // this.editorCountNode = drawText({x: -.96, y: -.62, text: "0", className: "header_number", parentNode: this.parentNode})
    drawText({x: .86, y: -.73, text: "clients", className: "right_header", parentNode: this.parentNode})
    // this.clientCountNode = drawText({x: .96, y: -.62, text: "0", className: ["right_header", "header_number"], parentNode: this.parentNode})
  }

  update (/* data */) {
    // this.editorCountNode.innerHTML = data.editors.length
    // this.clientCountNode.innerHTML = data.clients.length
  }
}

exportDeps({HeaderSummary})
