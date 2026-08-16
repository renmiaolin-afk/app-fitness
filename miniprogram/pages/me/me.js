const storage = require('../../utils/storage')
const { cycleMeta, planDisplayName } = require('../../services/plan')
const { estimateBlockGain } = require('../../services/progress-target')
const disclaimer = require('../../services/disclaimer')

const DURATION_LABELS = {
  30: '半小时左右',
  60: '大概 1 小时',
  90: '一个半小时+'
}

const EFFORT_LABELS = {
  easy: '轻松练练',
  solid: '好好练',
  hard: '拼一把'
}

const AVATAR_PATH = (wx.env && wx.env.USER_DATA_PATH
  ? wx.env.USER_DATA_PATH
  : '') + '/af_avatar.jpg'

function genderLabelOf(gender) {
  if (gender === 'female') return '女'
  if (gender === 'male') return '男'
  return '—'
}

/** 解析可展示的头像：优先持久本地文件，丢弃已失效的临时路径 */
function resolveAvatarUrl(stored) {
  if (AVATAR_PATH) {
    try {
      wx.getFileSystemManager().accessSync(AVATAR_PATH)
      return AVATAR_PATH
    } catch (e) {
      // 本地文件不存在则继续看 storage
    }
  }
  if (!stored) return ''
  const bare = String(stored).split('?')[0]
  // 临时文件离开页面后会失效
  if (/\/tmp\/|wxfile:\/\/tmp/i.test(bare)) return ''
  return bare
}

function persistAvatar(tempPath, done) {
  if (!tempPath) {
    done('')
    return
  }
  // 已是持久路径时直接复用（去掉展示用 cache buster）
  const bare = String(tempPath).split('?')[0]
  if (AVATAR_PATH && bare === AVATAR_PATH) {
    done(AVATAR_PATH)
    return
  }
  if (!AVATAR_PATH) {
    done('')
    return
  }
  try {
    const fs = wx.getFileSystemManager()
    try {
      fs.unlinkSync(AVATAR_PATH)
    } catch (e) {
      // 目标不存在时忽略
    }
    fs.saveFile({
      tempFilePath: tempPath,
      filePath: AVATAR_PATH,
      success: function () {
        done(AVATAR_PATH)
      },
      fail: function () {
        fs.copyFile({
          srcPath: tempPath,
          destPath: AVATAR_PATH,
          success: function () {
            done(AVATAR_PATH)
          },
          fail: function () {
            // 勿持久化临时路径：离开页面后会失效，看起来像「头像消失」
            done('')
          }
        })
      }
    })
  } catch (e) {
    done('')
  }
}

function patchProfile(patch) {
  const prev = storage.getProfile() || {}
  const next = Object.assign({}, prev, patch)
  storage.setProfile(next)
  return next
}

Page({
  behaviors: [require('../../behaviors/immersive-nav')],
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
    effortLabel: '',
    sleepLabel: '',
    bodyLabel: '',
    durationLabel: '',
    cycleSheetShow: false
  },

  onShow() {
    this.refresh()
  },

  onHide() {
    if (this.data.cycleSheetShow) {
      this.setData({ cycleSheetShow: false })
    }
  },

  refresh() {
    if (!disclaimer.ensureReadyForApp()) return
    const profile = storage.getProfile()
    const oneRm = profile.oneRm || {}
    const habits = profile.habits || {}
    const sleepMap = { good: '睡得挺好', ok: '一般般', poor: '经常不够' }
    const bodyMap = { none: '没什么', old: '有旧伤', sore: '容易酸' }
    const gain = estimateBlockGain(profile)
    const total =
      (oneRm.squat || 0) + (oneRm.bench || 0) + (oneRm.deadlift || 0)
    let progressText = ''
    if (gain && gain.mid > 0) {
      progressText = '大概 +' + gain.mid + ' kg'
    } else if (gain && gain.summary) {
      progressText = gain.summary
    }

    const avatarUrl = resolveAvatarUrl(profile.avatarUrl)
    // storage 被默认头像/临时路径污染时，写回可用地址
    if (avatarUrl && avatarUrl !== profile.avatarUrl) {
      patchProfile({ avatarUrl: avatarUrl })
    } else if (!avatarUrl && profile.avatarUrl) {
      patchProfile({ avatarUrl: '' })
    }

    this.setData({
      ready: true,
      displayName: profile.displayName || '微信用户',
      avatarUrl: avatarUrl,
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
      effortLabel: EFFORT_LABELS[habits.effort] || '好好练',
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
      if (!url) {
        wx.showToast({ title: '头像没存上，再试一次', icon: 'none' })
        return
      }
      patchProfile({ avatarUrl: url })
      // cache buster 仅用于当次展示，不写入 storage
      self.setData({ avatarUrl: url + '?t=' + Date.now() })
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
    this.setData({ cycleSheetShow: true })
  },

  closeCycleSheet() {
    this.setData({ cycleSheetShow: false })
  },

  reOnboard() {
    wx.navigateTo({ url: '/pages/onboarding/ability/ability?from=me' })
  },

  editHabits() {
    wx.navigateTo({ url: '/pages/onboarding/habits/habits?from=me' })
  },

  resetAll() {
    wx.showModal({
      title: '清空本地数据？',
      content: '档案、草稿和训练记录都会清掉，然后重新建档',
      confirmColor: '#ff2d55',
      success(res) {
        if (!res.confirm) return
        storage.clearProfile()
        storage.clearDraft()
        wx.removeStorageSync(storage.KEYS.logs)
        wx.redirectTo({ url: '/pages/onboarding/disclaimer/disclaimer' })
      }
    })
  },

  openDisclaimer() {
    wx.navigateTo({ url: '/pages/onboarding/disclaimer/disclaimer?mode=view' })
  }
})
