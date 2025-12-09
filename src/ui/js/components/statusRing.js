const { drawSvgElement, drawWedge, constants, wtrStatusEmitter, onEvent } = __WTR__
const { innerRingRadius, outerRingRadius, outerArcSize } = constants

const parentGroup = document.getElementById("status_ring_group")
parentGroup.innerHTML = ""

let currentClass = "offline"

const wrapper = drawSvgElement({
  tag: "g",
  className: ["status_ring_wrapper", currentClass],
  parent: parentGroup,
})

drawSvgElement({
  tag: "circle",
  attributes: { r: innerRingRadius },
  parent: wrapper,
})

drawWedge({
  startAngle: 0.25 - outerArcSize / 2,
  angleDelta: outerArcSize,
  innerRadius: outerRingRadius,
  radiusDelta: 0,
  parentNode: wrapper,
})

drawWedge({
  startAngle: 0.75 - outerArcSize / 2,
  angleDelta: outerArcSize,
  innerRadius: outerRingRadius,
  radiusDelta: 0,
  parentNode: wrapper,
})

onEvent(wtrStatusEmitter, "data", (/** @type {WtrStatus} */ data) => {
  let nextClass
  if (data.isOnline) {
    const hasActiveClient = data.clients.some((client) => client.activeWatchCount > 0)
    nextClass = hasActiveClient ? "active" : "online"
  } else {
    nextClass = "offline"
  }

  if (nextClass !== currentClass) {
    wrapper.classList.remove(currentClass)
    wrapper.classList.add(nextClass)
    currentClass = nextClass
  }
})
