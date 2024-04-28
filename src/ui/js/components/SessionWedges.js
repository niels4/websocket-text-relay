const { exportDeps, drawSvgElement, drawWedge } = window.__WTR__

const numWedges = 5
const wedgeSpacing = 0.01
const wedgeWidth = 0.08

const flashAnimationKeyframes = [{fill: "#fff"}, {fill: "var(--wedge-active-color)"}]
const flashAnimationProps = {duration: 250, easing: "ease-out", iterations: 1}

const createSessionSummary = (sessions) => {
  const summary = {
    name: `${sessions.length - numWedges + 1} others...`,
    watchCount: 0,
    activeWatchCount: 0,
    openCount: 0,
    activeOpenCount: 0

  }

  for (let i = numWedges - 1; i < sessions.length; i++) {
    const session = sessions[i]
    summary.watchCount += session.watchCount
    summary.activeWatchCount += session.activeWatchCount
    summary.openCount += session.openCount
    summary.activeOpenCount += session.activeOpenCount
  }

  return summary
}

class SessionWedges {
  constructor ({outerRingRadius, outerArcSize, direction = 1, Label, parentNode}) {
    this.outerRingRadius = outerRingRadius
    this.outerArcSize = outerArcSize
    this.parentNode = parentNode
    this.direction = direction
    this.Label = Label
    this.draw()
  }

  draw () {
    this.parentNode.innerHTML = ""
    this.wedgeNodes = []
    const totalStartAngle = 0.25 + this.direction * this.outerArcSize / 2
    const totalAngleDelta = 0.5 - this.outerArcSize - wedgeSpacing
    const wedgeAngleDelta = (totalAngleDelta / numWedges) - wedgeSpacing
    const innerRadius = this.outerRingRadius - wedgeWidth / 2
    for (let i = 0; i < numWedges; i++) {
      const group = drawSvgElement({tag: "g", className: "single_wedge_group", parent: this.parentNode})

      let startAngle = totalStartAngle + this.direction * (i + 1) * wedgeSpacing + this.direction * i * wedgeAngleDelta
      if (this.direction === -1) {
        startAngle -= wedgeAngleDelta
      }

      const wedge = drawWedge({startAngle, angleDelta: wedgeAngleDelta, innerRadius, radiusDelta: wedgeWidth, className: "wedge_node", parentNode: group})

      const wedgeCenterAngle = startAngle + wedgeAngleDelta / 2
      const label = new this.Label({wedgeCenterAngle, wedgeCenterRadius: this.outerRingRadius, parentNode: group})

      this.wedgeNodes.push({group, label, wedge})
    }
    this.drawCalled = true
  }

  update (sessions) {
    this.sessionsData = sessions
    for (let i = 0; i < numWedges; i++) {
      const {group, label} = this.wedgeNodes[i]
      group.classList.remove('active', 'online')
      let session = sessions[i]
      if (!session) {
        continue
      }

      if (i === numWedges - 1 && sessions.length > numWedges) {
        session = createSessionSummary(sessions)
      }

      if (session.activeWatchCount > 0 || session.activeOpenCount > 0) {
        group.classList.add('active')
      } else {
        group.classList.add('online')
      }

      label.update(session)
    }
  }

  triggerActivity (sessionIds) {
    const sessions = this.sessionsData
    if (!sessions) { return }
    for (let i = 0; i < numWedges; i++) {
      const {wedge} = this.wedgeNodes[i]
      const session = sessions[i]
      if (!session) {
        continue
      }

      if ((typeof sessionIds === 'number' && session.id === sessionIds) || sessionIds.has && sessionIds.has(session.id)) {
        wedge.animate(flashAnimationKeyframes, flashAnimationProps)
      }
    }
  }
}

exportDeps({SessionWedges})
