const { drawWedge, wtrStatusEmitter, onEvent, constants } = __WTR__
const { outerRingRadius, outerArcSize } = constants

const editorsParentGroup = document.getElementById("editor_wedges_group")
editorsParentGroup.innerHTML = ""

const clientsParentGroup = document.getElementById("client_wedges_group")
clientsParentGroup.innerHTML = ""

const maxWedges = 5
const wedgeSpacing = 0.01
const wedgeWidth = 0.08

const totalStartAngle = 0.25 + outerArcSize / 2
const totalAngleDelta = 0.5 - outerArcSize - wedgeSpacing
const wedgeAngleDelta = totalAngleDelta / maxWedges - wedgeSpacing
const innerWedgeRadius = outerRingRadius - wedgeWidth / 2

const editors = Array.from({ length: 5 })

const direction = 1
let editorWedges = []

for (let i = 0; i < editors.length; i++) {
  let startAngle = direction * (totalStartAngle + (i + 1) * wedgeSpacing + i * wedgeAngleDelta)
  if (direction === -1) {
    startAngle -= wedgeAngleDelta
  }

  console.log("drawing wedge", startAngle, wedgeAngleDelta, innerWedgeRadius)

  const wedge = drawWedge({
    startAngle,
    angleDelta: wedgeAngleDelta,
    innerRadius: innerWedgeRadius,
    radiusDelta: wedgeWidth,
    className: ["wedge_node", "active"],
    parentNode: editorsParentGroup,
  })

  editorWedges.push(wedge)
}

onEvent(wtrStatusEmitter, "data", (/** @type {WtrStatus} */ { editors, clients }) => {
  console.log(`got wedge data. editors: ${editors.length}, clients: ${clients.length}`)
})
