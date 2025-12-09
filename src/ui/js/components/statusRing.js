const { drawSvgElement, constants } = __WTR__
const { innerRingRadius } = constants

const group = document.getElementById("status_ring_group")
group.innerHTML = ""

drawSvgElement({ tag: "circle", attributes: { r: innerRingRadius }, parent: group })

console.log("status ring")
