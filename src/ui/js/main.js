/* eslint no-unused-vars: 0 */
const { drawGrid, drawPolarGrid, HeaderSummary, StatusRing, onEvent, statusDataEmitter, SessionWedges, ClientLabel,
  ActivityTimeseriesGraph, EditorLabel, ServerStatus, constants } = window.__WTR__
const { outerRingRadius, innerRingRadius, outerArcSize } = constants

const gridGroup = document.getElementById("grid_group")
gridGroup.innerHTML = ""
// drawPolarGrid(gridGroup)
// drawGrid(gridGroup)

const headerSummaryNode = document.getElementById('header_summary_group')
new HeaderSummary({parentNode: headerSummaryNode})

const statusRingNode = document.getElementById('status_ring_group')
const statusRing = new StatusRing({innerRingRadius, outerRingRadius, outerArcSize, parentNode: statusRingNode})

const clientWedgesNode = document.getElementById('client_wedges_group')
const clientWedges = new SessionWedges({outerRingRadius, outerArcSize, direction: -1, Label: ClientLabel, parentNode: clientWedgesNode})

const editorWedgesNode = document.getElementById('editor_wedges_group')
const editorWedges = new SessionWedges({outerRingRadius, outerArcSize, Label: EditorLabel, parentNode: editorWedgesNode})

const activityGraphNode = document.getElementById('activity_timeseries_graph')
const activityGraph = new ActivityTimeseriesGraph({innerRingRadius, parentNode: activityGraphNode})

const serverStatusNode = document.getElementById('server_status_group')
const serverStatus = new ServerStatus({parentNode: serverStatusNode})

const statusDataTranform = (rawData) => {

  const editors = []
  const clients = []
  const allSessions = new Map()

  rawData.sessions.forEach((session) => {
    allSessions.set(session.id, session)
    session.activeWatchCount = 0
    session.activeOpenCount = 0
    const isEditor = session.editorPid != null || session.lsPid != null
    if (isEditor) {
      editors.push(session)
    } else {
      clients.push(session)
    }
  })

  for (const session of allSessions.values()) {
    const openFileLinks = Object.values(session.openFileLinks)
    session.activeOpenCount = openFileLinks.length
    openFileLinks.forEach((links) => {
      links.forEach(({clientId}) => {
        const clientSession = allSessions.get(clientId)
        if (!clientSession) { return }
        clientSession.activeWatchCount++
      })
    })
  }

  return { editors, clients }
}

const getServerPid = (editors) => {
  for (const editor of editors) {
    if (editor.isServer) { return editor.lsPid }
  }
  return null
}

const handleStatusData = (rawData) => {
  window.__WTR__.lastStatusData = rawData
  const data = statusDataTranform(rawData)
  console.log("status data updated", data)
  statusRing.update(data)
  clientWedges.update(data.clients)
  editorWedges.update(data.editors)
  serverStatus.update(getServerPid(data.editors))
}

onEvent(statusDataEmitter, 'data', handleStatusData)

if (window.__WTR__.lastStatusData) {
  handleStatusData(window.__WTR__.lastStatusData)
}

const handleActivity = (data) => {
  editorWedges.triggerActivity(data.relayer)
  clientWedges.triggerActivity(new Set(data.watchers))
  activityGraph.triggerActivity()
}

onEvent(statusDataEmitter, 'activity', handleActivity)

onEvent(statusDataEmitter, 'socket-close', () => {
  console.log("socket closed!")
  serverStatus.update(null)
})
