const { drawSvgElement, constants, wtrStatusEmitter, onEvent } = __WTR__
const { innerRingRadius } = constants

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
  className: currentClass,
  attributes: { r: innerRingRadius },
  parent: wrapper,
})

onEvent(wtrStatusEmitter, "data", (data) => {
  let nextClass
  if (data.isOnline) {
    const hasActiveClient = data.sessions.some((session) => Object.keys(session.openFileLinks).length > 0)
    nextClass = hasActiveClient ? "active" : "online"
  } else {
    nextClass = "offline"
  }
  if (nextClass !== currentClass) {
    wrapper.classList.remove(currentClass)
    wrapper.classList.add(nextClass)
    currentClass = nextClass
  }
  console.log("status", data)
})
