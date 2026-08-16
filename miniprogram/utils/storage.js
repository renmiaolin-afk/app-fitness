const KEYS = {
  profile: 'af_profile',
  draft: 'af_session_draft',
  logs: 'af_session_logs'
}

function getProfile() {
  return wx.getStorageSync(KEYS.profile) || null
}

function setProfile(profile) {
  wx.setStorageSync(KEYS.profile, profile)
  const app = getApp()
  if (app) app.globalData.profile = profile
}

function clearProfile() {
  wx.removeStorageSync(KEYS.profile)
  const app = getApp()
  if (app) app.globalData.profile = null
}

function getDraft() {
  return wx.getStorageSync(KEYS.draft) || null
}

function setDraft(draft) {
  if (!draft) {
    wx.removeStorageSync(KEYS.draft)
    return
  }
  wx.setStorageSync(KEYS.draft, draft)
}

function clearDraft() {
  wx.removeStorageSync(KEYS.draft)
}

function appendLog(log) {
  const list = wx.getStorageSync(KEYS.logs) || []
  list.unshift(log)
  wx.setStorageSync(KEYS.logs, list.slice(0, 60))
}

function getLogs() {
  return wx.getStorageSync(KEYS.logs) || []
}

function setLogs(logs) {
  wx.setStorageSync(KEYS.logs, (logs || []).slice(0, 60))
}

/** Remove leave logs for a calendar day + weekday. Returns how many removed. */
function removeLeaveLog(date, weekday) {
  const list = wx.getStorageSync(KEYS.logs) || []
  const wd = Number(weekday)
  const next = list.filter(function (l) {
    if (!l || l.kind !== 'leave') return true
    if (l.date !== date) return true
    return Number(l.weekday) !== wd
  })
  const removed = list.length - next.length
  if (removed > 0) wx.setStorageSync(KEYS.logs, next)
  return removed
}

function isLeaveLog(log) {
  return !!(log && log.kind === 'leave')
}

module.exports = {
  KEYS,
  getProfile,
  setProfile,
  clearProfile,
  getDraft,
  setDraft,
  clearDraft,
  appendLog,
  getLogs,
  setLogs,
  removeLeaveLog,
  isLeaveLog
}
