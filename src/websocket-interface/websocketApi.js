import { triggerStatusUpdate, statusEvents, addWatchedFileLinks, removeWatchedFileLinks, removeOpenedFileLinks, addOpenedFileLinks } from './sessionManager.js'

export const apiMethods = new Map([
  ["watch-log-messages", watchLogMessages],
  ["unwatch-log-messages", unwatchLogMessages],
  ["init", init],
  ["watch-file", watchFile],
  ["unwatch-file", unwatchFile],
  ["update-open-files", updateEditorOpenFiles],
  ["watch-editor-active-files", watchEditorActiveFiles],
  ["unwatch-editor-active-files", unwatchEditorActiveFiles],
  ["relay-text", relayText],
  ["watch-wtr-status", watchWtrStatus],
  ["unwatch-wtr-status", unwatchWtrStatus],
  ["watch-wtr-activity", watchWtrActivity],
  ["unwatch-wtr-activity", unwatchWtrActivity],
])

function watchLogMessages (wtrSession) {
  wtrSession.watchLogMessages = true
  wtrSession.emitter.emit('log', { level: "info", text: "Watching WTR log messages" })
}

function unwatchLogMessages (wtrSession) {
  wtrSession.emitter.emit('log', { level: "info", text: "Unwatching WTR log messages" })
  wtrSession.watchLogMessages = false
}

function init (wtrSession, data) {
  wtrSession.name = data.name
  wtrSession.editorPid = data.editorPid
  wtrSession.lsPid = data.lsPid
  triggerStatusUpdate()
  wtrSession.emitter.emit('log', { level: "info", text: "Init success" })
}

function watchFile (wtrSession, data) {
  if (data.endsWith == null || data.endsWith.length === 0) {
    wtrSession.emitter.emit('log', { level: "error", text: "Must provide an endsWith property" })
    return
  }
  wtrSession.watchedFiles.add(data.endsWith)
  addWatchedFileLinks(wtrSession, data.endsWith)
  wtrSession.emitter.emit('log', { level: "info", text: `Watching files that end with ${data.endsWith}` })
}

function unwatchFile (wtrSession, data) {
  if (data.endsWith == null || data.endsWith.length === 0) {
    wtrSession.emitter.emit('log', { level: "error", text: "Must provide an endsWith property" })
    return
  }
  wtrSession.watchedFiles.delete(data.endsWith)
  removeWatchedFileLinks(wtrSession, data.endsWith)
  wtrSession.emitter.emit('log', { level: "info", text: `No longer watching files that end with ${data.endsWith}` })
}

function updateEditorOpenFiles (wtrSession, data) {
  const updatedFileSet = new Set(data.files)
  for (const fileName of wtrSession.openFiles) {
    if (!updatedFileSet.has(fileName)) {
      wtrSession.openFiles.delete(fileName)
      removeOpenedFileLinks(wtrSession, fileName)
    }
  }
  for (const fileName of updatedFileSet) {
    if (!wtrSession.openFiles.has(fileName)) {
      wtrSession.openFiles.add(fileName)
      addOpenedFileLinks(wtrSession, fileName)
    }
  }
  triggerStatusUpdate()
}

function watchEditorActiveFiles (wtrSession) {
  wtrSession.watchActiveFiles = true
  wtrSession.emitter.emit('log', { level: "info", text: "Watching editor active files" })
}

function unwatchEditorActiveFiles (wtrSession) {
  wtrSession.emitter.emit('log', { level: "info", text: "Unwatching editor active files" })
  wtrSession.watchActiveFiles = false
}

function relayText (wtrSession, data) {
  if (!data || !data.file) { return }
  const {file, contents} = data
  const watchers = wtrSession.activeOpenFiles.get(file)
  if (!watchers) { return }
  const watcherSessionIds = []
  for (const {clientSession: watcherWtrSession, endsWith} of watchers.values()) {
    watcherSessionIds.push(watcherWtrSession.id)
    watcherWtrSession.sendMessageToClient({method: "watch-file", endsWith, contents})
  }
  const activityData = {action: "relay", relayer: wtrSession.id, watchers: watcherSessionIds}
  statusEvents.emit('activity-update', activityData)
}

function watchWtrStatus (wtrSession) {
  wtrSession.watchWtrStatus = true
  wtrSession.emitter.emit('log', { level: "info", text: "Watching WTR status updates" })
}

function unwatchWtrStatus (wtrSession) {
  wtrSession.emitter.emit('log', { level: "info", text: "Unwatching WTR status updates" })
  wtrSession.watchWtrStatus = false
}

function watchWtrActivity (wtrSession) {
  wtrSession.watchWtrActivity = true
  wtrSession.emitter.emit('log', { level: "info", text: "Watching WTR activity events" })
}

function unwatchWtrActivity (wtrSession) {
  wtrSession.emitter.emit('log', { level: "info", text: "Unwatching WTR activity events" })
  wtrSession.watchWtrActivity = false
}
