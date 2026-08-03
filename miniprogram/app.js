const storage = require('./utils/storage')
const cloudConfig = require('./config/cloud')

App({
  globalData: {
    accent: '#FF2D55',
    cloudReady: false
  },

  onLaunch() {
    const profile = storage.getProfile()
    this.globalData.profile = profile

    if (wx.cloud) {
      try {
        wx.cloud.init({
          env: cloudConfig.env,
          traceUser: true
        })
        this.globalData.cloudReady = true
      } catch (e) {
        this.globalData.cloudReady = false
      }
    }
  }
})
