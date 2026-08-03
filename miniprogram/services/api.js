const cloudConfig = require('../config/cloud')
const { recommendPlansLocal } = require('./recommend-plans')

function callRecommendPlans(profile) {
  return new Promise(function (resolve) {
    if (!wx.cloud || !wx.cloud.callFunction) {
      resolve(
        Object.assign(recommendPlansLocal(profile), {
          source: 'local',
          fallbackReason: 'cloud_unavailable'
        })
      )
      return
    }

    wx.cloud.callFunction({
      name: cloudConfig.functions.recommendPlans,
      data: { profile: profile || {} },
      success: function (res) {
        var result = (res && res.result) || {}
        if (result.ok && result.plans && result.plans.length) {
          resolve({
            ok: true,
            source: result.source || 'cloud',
            selectedId: result.selectedId,
            plans: result.plans
          })
          return
        }
        resolve(
          Object.assign(recommendPlansLocal(profile), {
            fallbackReason: 'invalid_response'
          })
        )
      },
      fail: function () {
        resolve(
          Object.assign(recommendPlansLocal(profile), {
            fallbackReason: 'call_failed'
          })
        )
      }
    })
  })
}

module.exports = {
  callRecommendPlans: callRecommendPlans
}
