const storage = require('../../utils/storage')
const disclaimer = require('../../services/disclaimer')

Page({
  onShow() {
    if (!disclaimer.hasValidConsent(storage.getProfile())) {
      wx.redirectTo({ url: '/pages/onboarding/disclaimer/disclaimer' })
      return
    }
    const profile = storage.getProfile()
    if (profile && profile.planId) {
      wx.reLaunch({ url: '/pages/today/today' })
    } else {
      wx.redirectTo({ url: '/pages/onboarding/ability/ability' })
    }
  }
})
