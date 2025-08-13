import { EventEmitter } from "node:events"
import { debounce } from "./util.js"

export const statusEvents = new EventEmitter()

export const wtrSessions = new Set()

const createUpdateObject = () => {
  const sessions = [...wtrSessions].map((wtrSession) => {
    const openFileLinks = {}
    for (const [editorFile, fileLinks] of wtrSession.activeOpenFiles) {
      if (!openFileLinks[editorFile]) {
        openFileLinks[editorFile] = []
      }
      for (const { clientSession, endsWith } of fileLinks.values()) {
        openFileLinks[editorFile].push({ clientId: clientSession.id, endsWith })
      }
    }

    return {
      name: wtrSession.name || "Uninitialized",
      id: wtrSession.id,
      editorPid: wtrSession.editorPid,
      lsPid: wtrSession.lsPid,
      isServer: wtrSession.isServer(),
      watchCount: wtrSession.watchedFiles.size,
      openCount: wtrSession.openFiles.size,
      openFileLinks,
    }
  })

  return { sessions }
}

const sendUpdate = () => {
  const updateObject = createUpdateObject()
  statusEvents.emit("status-update", updateObject)
}

export const triggerStatusUpdate = debounce(100, sendUpdate)

export const startSessionStatus = (wtrSession) => {
  wtrSessions.add(wtrSession)
  triggerStatusUpdate()
}

export const endSessionStatus = (wtrSession) => {
  wtrSessions.delete(wtrSession)
  triggerStatusUpdate()
}

const createLinkKey = (clientSession, endsWith) => `${clientSession.id}:${endsWith}`

const createWatchLink = (wtrSession, editorFile, clientSession, endsWith) => {
  let fileLinks = wtrSession.activeOpenFiles.get(editorFile)
  if (!fileLinks) {
    fileLinks = new Map()
    wtrSession.activeOpenFiles.set(editorFile, fileLinks)
  }
  const linkKey = createLinkKey(clientSession, endsWith)
  fileLinks.set(linkKey, { clientSession, endsWith })
  triggerStatusUpdate()
  wtrSession.emitter.emit("editor-active-files-update", [...wtrSession.activeOpenFiles.keys()])
}

export const addOpenedFileLinks = (wtrSession, editorFile) => {
  for (const clientSession of wtrSessions) {
    if (clientSession === wtrSession) {
      continue
    }
    for (const endsWith of clientSession.watchedFiles) {
      if (editorFile.endsWith(endsWith)) {
        createWatchLink(wtrSession, editorFile, clientSession, endsWith)
      }
    }
  }
}

export const removeOpenedFileLinks = (wtrSession, editorFile) => {
  wtrSession.activeOpenFiles.delete(editorFile)
  wtrSession.emitter.emit("editor-active-files-update", [...wtrSession.activeOpenFiles.keys()])
  triggerStatusUpdate()
}

export const addWatchedFileLinks = (clientSession, endsWith) => {
  for (const wtrSession of wtrSessions) {
    if (wtrSession === clientSession) {
      continue
    }
    for (const editorFile of wtrSession.openFiles) {
      if (editorFile.endsWith(endsWith)) {
        createWatchLink(wtrSession, editorFile, clientSession, endsWith)
      }
    }
  }
}

export const removeWatchedFileLinks = (clientSession, endsWith) => {
  const linkKey = createLinkKey(clientSession, endsWith)
  for (const wtrSession of wtrSessions) {
    for (const [editorFile, fileLinks] of wtrSession.activeOpenFiles) {
      fileLinks.delete(linkKey)
      if (fileLinks.size === 0) {
        wtrSession.activeOpenFiles.delete(editorFile)
        wtrSession.emitter.emit("editor-active-files-update", [
          ...wtrSession.activeOpenFiles.keys(),
        ])
        triggerStatusUpdate()
      }
    }
  }
}
