const { drawText } = __WTR__

const parentGroup = document.getElementById("headers_group")
parentGroup.innerHTML = ""

drawText({ x: -0.86, y: -0.73, text: "editors", parentNode: parentGroup })

drawText({
  x: 0.86,
  y: -0.73,
  text: "clients",
  className: "right_header",
  parentNode: parentGroup,
})
