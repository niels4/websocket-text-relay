const { exportDeps, drawText } = window.__WTR__

const valueTextClass = "server_status_value"
const offlineTextClass = "server_status_offline"

class ServerStatus {
  constructor ({parentNode}) {
    this.parentNode = parentNode
    this.draw()
  }

  draw () {
    this.parentNode.innerHTML = ""
    drawText({x: 0, y: .85, text: "WS Server PID", className: "server_status_label", parentNode: this.parentNode})
    this.valueElement = drawText({x: 0, y: .748, text: "138324", parentNode: this.parentNode})
    this.offlineElement = drawText({x: 0, y: .748, text: "OFFLINE", className:offlineTextClass, parentNode: this.parentNode})
  }

  update (pid) {
    if (pid == null) {
      this.valueElement.classList.remove(valueTextClass)
      this.offlineElement.classList.add(offlineTextClass)
    } else {
      this.valueElement.innerHTML = pid
      this.valueElement.classList.add(valueTextClass)
      this.offlineElement.classList.remove(offlineTextClass)
    }
  }
}

exportDeps({ServerStatus})
