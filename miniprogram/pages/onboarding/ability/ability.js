const storage = require('../../../utils/storage')
const { inferStrengthTier, auxiliaries } = require('../../../services/plan')

Page({
  data: {
    fromMe: false,
    ctaLabel: '下一步',
    gender: 'male',
    ageYears: 28,
    heightCm: 175,
    weightKg: 70,
    squat: 60,
    bench: 40,
    deadlift: 80,
    auxItems: [],
    selectedAux: ['crossfit', 'running'],
    maxAux: 2
  },

  syncAuxItems(selected) {
    const selectedAux = selected || this.data.selectedAux
    const items = (auxiliaries.items || []).map(function (i) {
      return {
        id: i.id,
        label: i.label,
        active: selectedAux.indexOf(i.id) >= 0
      }
    })
    this.setData({ auxItems: items, selectedAux: selectedAux })
  },

  syncLifts() {
    this.setData({
      lifts: [
        { field: 'squat', label: '深蹲', value: this.data.squat },
        { field: 'bench', label: '卧推', value: this.data.bench },
        { field: 'deadlift', label: '硬拉', value: this.data.deadlift }
      ]
    })
  },

  syncMetrics() {
    this.setData({
      metrics: [
        {
          field: 'ageYears',
          label: '年龄',
          value: this.data.ageYears,
          unit: '岁',
          stepNeg: -1,
          stepPos: 1
        },
        {
          field: 'heightCm',
          label: '身高',
          value: this.data.heightCm,
          unit: 'cm',
          stepNeg: -1,
          stepPos: 1
        },
        {
          field: 'weightKg',
          label: '体重',
          value: this.data.weightKg,
          unit: 'kg',
          stepNeg: -1,
          stepPos: 1
        }
      ]
    })
  },

  onLoad(query) {
    const fromMe = !!(query && query.from === 'me')
    const draft = storage.getProfile() || {}
    const selectedAux = draft.auxiliaries || ['crossfit', 'running']
    this.setData({
      fromMe: fromMe,
      ctaLabel: fromMe ? '保存' : '下一步',
      gender: draft.gender || 'male',
      ageYears: draft.ageYears || 28,
      heightCm: draft.heightCm || 175,
      weightKg: draft.weightKg || 70,
      squat: (draft.oneRm && draft.oneRm.squat) || 60,
      bench: (draft.oneRm && draft.oneRm.bench) || 40,
      deadlift: (draft.oneRm && draft.oneRm.deadlift) || 80,
      maxAux: auxiliaries.maxSelect || 2
    })
    this.syncMetrics()
    this.syncLifts()
    this.syncAuxItems(selectedAux)
  },

  setGender(e) {
    this.setData({ gender: e.currentTarget.dataset.v })
  },

  applyField(field, value) {
    const patch = {}
    patch[field] = value
    this.setData(patch)
    if (field === 'squat' || field === 'bench' || field === 'deadlift') {
      this.syncLifts()
    }
    if (field === 'ageYears' || field === 'heightCm' || field === 'weightKg') {
      this.syncMetrics()
    }
  },

  clampField(field, raw) {
    var n = Number(raw)
    if (!isFinite(n) || n < 0) n = 0
    if (field === 'ageYears') {
      if (n < 12) n = 12
      if (n > 80) n = 80
      n = Math.round(n)
    } else if (field === 'heightCm') {
      if (n > 250) n = 250
      n = Math.round(n)
    } else if (field === 'weightKg') {
      if (n > 300) n = 300
      n = Math.round(n * 10) / 10
    } else {
      // 三大项：保留到 0.5
      if (n > 500) n = 500
      n = Math.round(n * 2) / 2
    }
    return n
  },

  patchFieldDisplay(field, value) {
    const patch = {}
    patch[field] = value
    if (field === 'ageYears' || field === 'heightCm' || field === 'weightKg') {
      patch.metrics = (this.data.metrics || []).map(function (m) {
        if (m.field !== field) return m
        return Object.assign({}, m, { value: value })
      })
    } else if (field === 'squat' || field === 'bench' || field === 'deadlift') {
      patch.lifts = (this.data.lifts || []).map(function (m) {
        if (m.field !== field) return m
        return Object.assign({}, m, { value: value })
      })
    }
    this.setData(patch)
  },

  onFieldInput(e) {
    const field = e.currentTarget.dataset.field
    const raw = e.detail.value
    // 输入中允许空串与中间态，失焦再规范化
    if (raw === '' || raw === '.') {
      this.patchFieldDisplay(field, raw)
      return
    }
    if (!/^\d*\.?\d*$/.test(raw)) return
    this.patchFieldDisplay(field, raw)
  },

  onFieldBlur(e) {
    const field = e.currentTarget.dataset.field
    const next = this.clampField(field, e.detail.value === '' ? 0 : e.detail.value)
    this.applyField(field, next)
  },

  step(e) {
    const field = e.currentTarget.dataset.field
    const delta = Number(e.currentTarget.dataset.delta)
    const cur = Number(this.data[field])
    const base = isFinite(cur) ? cur : 0
    const next = this.clampField(field, base + delta)
    this.applyField(field, next)
  },

  toggleAux(e) {
    const id = e.currentTarget.dataset.id
    let selected = (this.data.selectedAux || []).slice()
    const i = selected.indexOf(id)
    if (i >= 0) {
      selected.splice(i, 1)
    } else {
      if (selected.length >= this.data.maxAux) {
        wx.showToast({ title: '最多选 ' + this.data.maxAux + ' 项', icon: 'none' })
        return
      }
      selected.push(id)
    }
    this.syncAuxItems(selected)
  },

  next() {
    const ageYears = this.clampField('ageYears', this.data.ageYears)
    const heightCm = this.clampField('heightCm', this.data.heightCm)
    const weightKg = this.clampField('weightKg', this.data.weightKg)
    const oneRm = {
      squat: this.clampField('squat', this.data.squat),
      bench: this.clampField('bench', this.data.bench),
      deadlift: this.clampField('deadlift', this.data.deadlift)
    }
    this.applyField('ageYears', ageYears)
    this.applyField('heightCm', heightCm)
    this.applyField('weightKg', weightKg)
    this.applyField('squat', oneRm.squat)
    this.applyField('bench', oneRm.bench)
    this.applyField('deadlift', oneRm.deadlift)
    const prev = storage.getProfile() || {}
    const profilePatch = {
      gender: this.data.gender,
      ageYears: ageYears,
      heightCm: heightCm,
      weightKg: weightKg,
      oneRm: oneRm,
      auxiliaries: this.data.selectedAux,
      currentWeek: prev.currentWeek || 1
    }
    profilePatch.strengthTier = inferStrengthTier(
      Object.assign({}, prev, profilePatch)
    )
    storage.setProfile(Object.assign({}, prev, profilePatch))
    if (this.data.fromMe) {
      wx.navigateBack({
        fail: function () {
          wx.redirectTo({ url: '/pages/me/me' })
        }
      })
      return
    }
    wx.navigateTo({ url: '/pages/onboarding/habits/habits' })
  }
})
