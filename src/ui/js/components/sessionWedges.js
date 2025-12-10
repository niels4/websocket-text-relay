const { drawWedge, wtrStatusEmitter, onEvent, constants } = __WTR__
const { outerRingRadius, outerArcSize } = constants

const editorsParentGroup = document.getElementById("editor_wedges_group")
editorsParentGroup.innerHTML = ""

const clientsParentGroup = document.getElementById("client_wedges_group")
clientsParentGroup.innerHTML = ""

const maxWedges = 5
const wedgeSpacing = 0.01
const wedgeWidth = 0.08

const startAngleOffset = outerArcSize / 2
const totalAngleDelta = 0.5 - outerArcSize - wedgeSpacing
const wedgeAngleDelta = totalAngleDelta / maxWedges - wedgeSpacing
const innerWedgeRadius = outerRingRadius - wedgeWidth / 2

/**
 * @param sessions {EditorStatus[] | ClientStatus[] }
 * @param direction {1 | -1}
 */

const drawWedges = (sessions, parentNode, direction = 1) => {
  for (let i = 0; i < sessions.length; i++) {
    if (i >= maxWedges) {
      break
    }

    let startAngle = 0.25 + direction * (startAngleOffset + (i + 1) * wedgeSpacing + i * wedgeAngleDelta)
    if (direction === -1) {
      startAngle -= wedgeAngleDelta
    }

    drawWedge({
      startAngle,
      angleDelta: wedgeAngleDelta,
      innerRadius: innerWedgeRadius,
      radiusDelta: wedgeWidth,
      className: ["wedge_node", "active"],
      parentNode,
    })
  }
}

onEvent(wtrStatusEmitter, "data", (/** @type {WtrStatus} */ { editors, clients }) => {
  console.log("editors", editors)
  editorsParentGroup.innerHTML = ""
  clientsParentGroup.innerHTML = ""
  drawWedges(editors, editorsParentGroup, 1)
  drawWedges(clients, clientsParentGroup, -1)
})
