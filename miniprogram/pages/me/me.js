const storage = require('../../utils/storage')
const { cycleMeta, planDisplayName } = require('../../services/plan')
const { estimateBlockGain } = require('../../services/progress-target')
const { statusNavPadTopPx } = require('../../utils/nav')

const DURATION_LABELS = {
  30: '30 分钟',
  60: '约 1 小时',
  90: '90 分钟+'
}

const AVATAR_PATH = (wx.env && wx.env.USER_DATA_PATH
  ? wx.env.USER_DATA_PATH
  : '') + '/af_avatar.jpg'

function genderLabelOf(gender) {
  if (gender === 'female') return '女'
  if (gender === 'male') return '男'
  return '—'
}

function persistAvatar(tempPath, done) {
  if (!tempPath) {
    done(tempPath)
    return
  }
  try {
    const fs = wx.getFileSystemManager()
    fs.saveFile({
      tempFilePath: tempPath,
      filePath: AVATAR_PATH,
      success: function () {
        done(AVATAR_PATH + '?t=' + Date.now())
      },
      fail: function () {
        done(tempPath)
      }
    })
  } catch (e) {
    done(tempPath)
  }
}

function patchProfile(patch) {
  const prev = storage.getProfile() || {}
  const next = Object.assign({}, prev, patch)
  storage.setProfile(next)
  return next
}

Page({
  data: {
    ready: false,
    navPadTop: 88,
    displayName: '微信用户',
    avatarUrl: '',
    genderLabel: '',
    ageYears: 0,
    weightKg: 0,
    heightCm: 0,
    planName: '',
    week: 1,
    totalWeeks: 5,
    total: 0,
    squat: 0,
    bench: 0,
    deadlift: 0,
    progressText: '',
    sleepLabel: '',
    bodyLabel: '',
    durationLabel: ''
  },

  onLoad() {
    this.setData({ navPadTop: statusNavPadTopPx() })
  },

  onShow() {
    this.setData({ navPadTop: statusNavPadTopPx() })
    this.refresh()
  },

  refresh() {
    const profile = storage.getProfile()
    if (!profile) {
      wx.redirectTo({ url: '/pages/onboarding/ability/ability' })
      return
    }
    const oneRm = profile.oneRm || {}
    const habits = profile.habits || {}
    const sleepMap = { good: '很好', ok: '一般', poor: '较差' }
    const bodyMap = { none: '没有旧伤', old: '有旧伤', sore: '易酸痛' }
    const gain = estimateBlockGain(profile)
    const total =
      (oneRm.squat || 0) + (oneRm.bench || 0) + (oneRm.deadlift || 0)
    let progressText = ''
    if (gain && gain.mid > 0) {
      progressText = '估算 +' + gain.mid + ' kg'
    } else if (gain && gain.summary) {
      progressText = gain.summary
    }

    this.setData({
      ready: true,
      displayName: profile.displayName || '微信用户',
      avatarUrl: profile.avatarUrl || '',
      genderLabel: genderLabelOf(profile.gender),
      ageYears: profile.ageYears || 0,
      weightKg: profile.weightKg || 0,
      heightCm: profile.heightCm || 0,
      planName: planDisplayName(profile.planId),
      week: profile.currentWeek || 1,
      totalWeeks: cycleMeta.optionalTestWeek || cycleMeta.weeks || 5,
      total: total,
      squat: oneRm.squat || 0,
      bench: oneRm.bench || 0,
      deadlift: oneRm.deadlift || 0,
      progressText: progressText,
      sleepLabel: sleepMap[habits.sleep] || '—',
      bodyLabel: bodyMap[habits.body] || '—',
      durationLabel: DURATION_LABELS[habits.durationMin] ||
        (habits.durationMin ? '约 ' + habits.durationMin + ' 分钟' : '—')
    })
  },

  onChooseAvatar(e) {
    const temp = e.detail && e.detail.avatarUrl
    if (!temp) return
    const self = this
    persistAvatar(temp, function (url) {
      patchProfile({ avatarUrl: url })
      self.setData({ avatarUrl: url })
    })
  },

  goBack() {
    wx.navigateBack({
      fail: function () {
        wx.reLaunch({ url: '/pages/today/today' })
      }
    })
  },

  goCycle() {
    wx.navigateTo({ url: '/pages/cycle/cycle' })
  },

  reOnboard() {
    wx.navigateTo({ url: '/pages/onboarding/ability/ability?from=me' })
  },

  editHabits() {
    wx.navigateTo({ url: '/pages/onboarding/habits/habits?from=me' })
  },

  resetAll() {
    wx.showModal({
      title: '清除本地数据？',
      content: '档案、草稿与训练记录都会清空',
      confirmColor: '#FF2D55',
      success(res) {
        if (!res.confirm) return
        storage.clearProfile()
        storage.clearDraft()
        wx.removeStorageSync(storage.KEYS.logs)
        wx.redirectTo({ url: '/pages/onboarding/ability/ability' })
      }
    })
  }
})
