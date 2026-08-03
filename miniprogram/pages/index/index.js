const storage = require('../../utils/storage')

Page({
  onShow() {
    const profile = storage.getProfile()
    if (profile && profile.planId) {
      wx.reLaunch({ url: '/pages/today/today' })
    } else {
      wx.redirectTo({ url: '/pages/onboarding/ability/ability' })
    }
  }
})
