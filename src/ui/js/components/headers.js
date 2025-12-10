const { drawText } = __WTR__

const parentGroup = document.getElementById("headers_group")
parentGroup.innerHTML = ""

drawText({ x: -0.86, y: -0.73, text: "editors", className: "header", parent: parentGroup })

drawText({
  x: 0.86,
  y: -0.73,
  text: "clients",
  className: ["header", "right_header"],
  parent: parentGroup,
})
