const storage = require('../../../utils/storage')
const disclaimer = require('../../../services/disclaimer')

Page({
  data: {
    title: disclaimer.DISCLAIMER_TITLE,
    version: disclaimer.DISCLAIMER_VERSION,
    updated: disclaimer.DISCLAIMER_UPDATED,
    intro: disclaimer.DISCLAIMER_INTRO,
    sections: disclaimer.DISCLAIMER_SECTIONS,
    footnote: disclaimer.DISCLAIMER_FOOTNOTE,
    agreed: false,
    viewOnly: false
  },


  onLoad(query) {
    var viewOnly = !!(query && (query.mode === 'view' || query.view === '1'))
    // 已同意且非查看模式：直接进后续流程，避免重复挡路
    if (!viewOnly && disclaimer.hasValidConsent(storage.getProfile())) {
      wx.redirectTo({ url: disclaimer.nextUrlAfterConsent() })
      return
    }
    this.setData({ viewOnly: viewOnly, agreed: false })
  },

  toggleAgree() {
    if (this.data.viewOnly) return
    this.setData({ agreed: !this.data.agreed })
  },

  accept() {
    if (!this.data.agreed || this.data.viewOnly) return
    disclaimer.acceptConsent()
    wx.redirectTo({ url: disclaimer.nextUrlAfterConsent() })
  },

  closeView() {
    wx.navigateBack({
      fail: function () {
        wx.redirectTo({ url: '/pages/me/me' })
      }
    })
  },

  exitApp() {
    // 小程序无法强制杀进程；尽量回到微信或停留本页
    if (wx.exitMiniProgram) {
      wx.exitMiniProgram({
        fail: function () {
          wx.showToast({ title: '请从右上角关闭小程序', icon: 'none' })
        }
      })
    } else {
      wx.showToast({ title: '请从右上角关闭小程序', icon: 'none' })
    }
  }
})
