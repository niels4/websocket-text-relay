const { drawWedge, wtrStatusEmitter, wtrActivityEmitter, onEvent, constants } = __WTR__
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

/** @type {Map<SessionId, HTMLElement>} */
let wedgeMap = new Map()

/**
 * @param sessions {EditorStatus[] | ClientStatus[] }
 * @param parentNode {HTMLElement}
 * @param direction {1 | -1}
 */
const drawWedges = (sessions, parentNode, direction = 1) => {
  for (let i = 0; i < sessions.length; i++) {
    if (i >= maxWedges) {
      break
    }
    const session = sessions[i]

    let startAngle = 0.25 + direction * (startAngleOffset + (i + 1) * wedgeSpacing + i * wedgeAngleDelta)
    if (direction === -1) {
      startAngle -= wedgeAngleDelta
    }

    const wedge = drawWedge({
      startAngle,
      angleDelta: wedgeAngleDelta,
      innerRadius: innerWedgeRadius,
      radiusDelta: wedgeWidth,
      className: ["wedge_node", "active"],
      parentNode,
    })

    wedgeMap.set(session.id, wedge)
  }
}

onEvent(wtrStatusEmitter, "data", (/** @type {WtrStatus} */ { editors, clients }) => {
  wedgeMap = new Map()
  editorsParentGroup.innerHTML = ""
  clientsParentGroup.innerHTML = ""
  drawWedges(editors, editorsParentGroup, 1)
  drawWedges(clients, clientsParentGroup, -1)
})

const flashAnimationKeyframes = [{ fill: "#fff" }, { fill: "var(--wedge-active-color)" }]
const flashAnimationProps = { duration: 250, easing: "ease-out", iterations: 1 }

/**
 * @param sessionId {SessionId}
 */
const triggerActivityAnimation = (sessionId) => {
  wedgeMap.get(sessionId)?.animate(flashAnimationKeyframes, flashAnimationProps)
}

onEvent(wtrActivityEmitter, "data", (/** @type {WtrActivityMessage} */ { relayer, watchers }) => {
  triggerActivityAnimation(relayer)
  watchers.forEach(triggerActivityAnimation)
})
