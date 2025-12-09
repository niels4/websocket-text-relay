const { drawText, wtrStatusEmitter, onEvent } = __WTR__

const valueTextClass = "server_status_value"
const offlineTextClass = "server_status_offline"

const parentGroup = document.getElementById("footer_status_group")
parentGroup.innerHTML = ""

drawText({
  x: 0,
  y: 0.85,
  text: "WS Server PID",
  className: "server_status_label",
  parentNode: parentGroup,
})

const pidElement = drawText({ x: 0, y: 0.748, text: "-1", parentNode: parentGroup })

const offlineElement = drawText({
  x: 0,
  y: 0.748,
  text: "OFFLINE",
  className: offlineTextClass,
  parentNode: parentGroup,
})

onEvent(wtrStatusEmitter, "data", (data) => {
  const server = data.sessions.find((session) => session.isServer)
  if (!data.isOnline || server == null) {
    pidElement.classList.remove(valueTextClass)
    offlineElement.classList.add(offlineTextClass)
  } else {
    pidElement.textContent = server.lsPid
    pidElement.classList.add(valueTextClass)
    offlineElement.classList.remove(offlineTextClass)
  }
})
