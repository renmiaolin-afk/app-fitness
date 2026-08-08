const storage = require('./storage')

/** 将微信头像/昵称写入本地档案（不覆盖已有头像/昵称） */
function applyWechatUserInfo(userInfo) {
  if (!userInfo) return null
  const prev = storage.getProfile() || {}
  const patch = {}
  const nick = String(userInfo.nickName || '').trim()
  // 已有本地昵称/头像时不覆盖：getUserProfile 常返回默认灰头像与「微信用户」
  if (nick && !prev.displayName) patch.displayName = nick
  if (userInfo.avatarUrl && !prev.avatarUrl) patch.avatarUrl = userInfo.avatarUrl
  if (!Object.keys(patch).length) return prev
  const next = Object.assign({}, prev, patch)
  storage.setProfile(next)
  return next
}

/**
 * 需在用户点击回调里同步调用。
 * 成功/失败都会走 complete（便于接着跳转）。
 */
function fetchWechatUserProfile(complete) {
  const done = typeof complete === 'function' ? complete : function () {}
  if (!wx.getUserProfile) {
    done(null)
    return
  }
  wx.getUserProfile({
    desc: '用于个人中心展示头像与昵称',
    success: function (res) {
      const info = (res && res.userInfo) || null
      if (info) applyWechatUserInfo(info)
      done(info)
    },
    fail: function () {
      done(null)
    }
  })
}

module.exports = {
  applyWechatUserInfo: applyWechatUserInfo,
  fetchWechatUserProfile: fetchWechatUserProfile
}
