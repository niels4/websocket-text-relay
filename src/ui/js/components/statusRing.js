const { drawSvgElement, constants, wtrStatusEmitter, onEvent } = __WTR__
const { innerRingRadius } = constants

const group = document.getElementById("status_ring_group")
group.innerHTML = ""

drawSvgElement({ tag: "circle", attributes: { r: innerRingRadius }, parent: group })

onEvent(wtrStatusEmitter, "data", (data) => {
  console.log("status", data)
})
