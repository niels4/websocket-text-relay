const { exportDeps, drawCircle, drawWedge } = window.__WTR__

class StatusRing {
  constructor({ innerRingRadius, outerRingRadius, outerArcSize, parentNode }) {
    this.innerRingRadius = innerRingRadius
    this.outerRingRadius = outerRingRadius
    this.outerArcSize = outerArcSize
    this.parentNode = parentNode
    this.draw()
  }

  draw() {
    this.parentNode.innerHTML = ""
    this.parentNode.classList.remove(...this.parentNode.classList)
    this.currentClassName = "offline"
    this.parentNode.classList.add(this.currentClassName)

    drawCircle({ cx: 0, cy: 0, r: this.innerRingRadius, parentNode: this.parentNode })
    drawWedge({
      startAngle: 0.25 - this.outerArcSize / 2,
      angleDelta: this.outerArcSize,
      innerRadius: this.outerRingRadius,
      radiusDelta: 0,
      parentNode: this.parentNode,
    })
    drawWedge({
      startAngle: 0.75 - this.outerArcSize / 2,
      angleDelta: this.outerArcSize,
      innerRadius: this.outerRingRadius,
      radiusDelta: 0,
      parentNode: this.parentNode,
    })
  }

  update(data) {
    const hasActiveClient = data.clients.some((client) => client.activeWatchCount > 0)
    let newClassName
    if (hasActiveClient) {
      newClassName = "active"
    } else if (data.clients.length > 0) {
      newClassName = "online"
    } else {
      newClassName = "offline"
    }

    if (newClassName != this.currentClassName) {
      this.parentNode.classList.remove(this.currentClassName)
      this.parentNode.classList.add(newClassName)
      this.currentClassName = newClassName
    }
  }
}

exportDeps({ StatusRing })
