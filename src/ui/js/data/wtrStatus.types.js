/**
 * A file path suffix used to match against open file locations.
 * @typedef {string} EndsWith
 */

/**
 * @typedef {number} SessionId
 */

/**
 * @typedef {{ clientId: SessionId, endsWith: EndsWith }} FileLink
 */

/**
 * Map of absolute file paths → arrays of metadata links.
 * @typedef {Record<string, FileLink[]>} OpenFileLinks
 */

/**
 * @typedef {Object} SessionStatus
 * Represents one session, which may be an editor or a client.
 *
 * @property {string} name
 * @property {number} id
 * @property {number} [editorPid]   Optional — only present for editor sessions
 * @property {number} [lsPid]       Optional — language server PID only present for editor sessions
 * @property {boolean} isServer
 * @property {number} watchCount
 * @property {number} openCount
 * @property {OpenFileLinks} openFileLinks
 * @property {number} activeWatchCount
 * @property {number} activeOpenCount
 */

/**
 * Editor sessions have all SessionStatus fields,
 * but editorPid and lsPid become required,
 * and activeWatchCount and activeOpenCount are defined
 *
 * @typedef {SessionStatus & {
 *   editorPid: number,
 *   lsPid: number,
 *   activeWatchCount: number,
 *   activeOpenCount: number
 * }} EditorStatus
 */

/**
 * Client sessions have all SessionStatus fields,
 * but editorPid and lsPid are omitted,
 * and activeWatchCount and activeOpenCount are defined
 *
 * @typedef {Omit<SessionStatus, "editorPid" | "lsPid"> & {
 *   activeWatchCount: number,
 *   activeOpenCount: number
 * }} ClientStatus
 */

/**
 * @typedef {{ isOnline: boolean, editors: EditorStatus[], clients: ClientStatus[] }} WtrStatus
 */
