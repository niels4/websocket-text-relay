const { drawSvgElement } = __WTR__

const group = document.getElementById("status_ring_group")
group.innerHTML = ""

drawSvgElement({ tag: "circle", attributes: { r: 0.5, stroke: "red" }, parent: group })

console.log("status ring")
