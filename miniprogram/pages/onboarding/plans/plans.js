const storage = require('../../../utils/storage')
const disclaimer = require('../../../services/disclaimer')
const { callRecommendPlans } = require('../../../services/api')
const {
  getWeekSlots,
  serializeWeekSlots,
  PLAN_OPTIONS,
  normalizeAuxiliaries
} = require('../../../services/plan')
const copy = require('../../../utils/copy')

var DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function planCatalog(id) {
  for (var i = 0; i < PLAN_OPTIONS.length; i++) {
    if (PLAN_OPTIONS[i].id === id) return PLAN_OPTIONS[i]
  }
  return null
}

function cellsFromSlots(slots, dragFrom, dragOver) {
  return (slots || []).map(function (s, i) {
    var short = copy.slotLabelShort(s.label)
    return {
      day: DAY_LABELS[i] || String(i + 1),
      label: short,
      rest: s.type === 'rest' || s.label === '休' || short === '休',
      dragging: dragFrom === i,
      dragOver: dragOver === i && dragFrom !== i
    }
  })
}

function mapPlansForUi(result, profile) {
  const selectedId = result.selectedId
  const aux = (profile && profile.auxiliaries) || []
  return (result.plans || []).map(function (p) {
    var cat = planCatalog(p.id) || {}
    var slots = getWeekSlots(p.id, aux)
    var what = p.problem || cat.problem || ''
    var outcome = p.goal || cat.goal || ''
    var intro = [what, outcome].filter(Boolean).join('\n')
    return {
      id: p.id,
      name: p.name,
      intro: intro,
      weekSlots: serializeWeekSlots(slots),
      weekCells: cellsFromSlots(slots, -1, -1),
      selected: p.id === selectedId
    }
  })
}

function hitCellIndex(rects, x, y) {
  if (!rects || !rects.length) return -1
  for (var i = 0; i < rects.length; i++) {
    var r = rects[i]
    if (!r) continue
    if (x >= r.left && x <= r.right && y >= r.top - 8 && y <= r.bottom + 8) {
      return i
    }
  }
  // 同一行：仅用 x 命中，避免手指略偏时丢目标
  for (var j = 0; j < rects.length; j++) {
    var c = rects[j]
    if (!c) continue
    if (x >= c.left && x <= c.right) return j
  }
  return -1
}

Page({
  data: {
    analyzing: true,
    plans: [],
    selectedId: '',
    isDragging: false,
    dragHint: '长按日程格拖动，可把休息日换到任意一天'
  },

  onLoad() {
    if (!disclaimer.ensureConsent()) return
    const profile = storage.getProfile() || {}
    this.setData({
      analyzing: true,
      plans: [],
      selectedId: ''
    })
    this._drag = null

    var that = this
    var startedAt = Date.now()
    var MIN_ANALYZING_MS = 800

    setTimeout(function () {
      callRecommendPlans(profile).then(function (result) {
        var plans = mapPlansForUi(result, profile)
        var wait = Math.max(0, MIN_ANALYZING_MS - (Date.now() - startedAt))
        setTimeout(function () {
          that.setData({
            analyzing: false,
            plans: plans,
            selectedId: result.selectedId
          })
          if (result.source !== 'cloud') {
            wx.showToast({ title: '已用离线推荐', icon: 'none' })
          }
        }, wait)
      })
    }, 50)
  },

  select(e) {
    const id = e.currentTarget.dataset.id
    if (!id) return
    const plans = this.data.plans.map(function (p) {
      return Object.assign({}, p, { selected: p.id === id })
    })
    this.setData({ selectedId: id, plans: plans })
  },

  onWeekLongPress(e) {
    var planId = e.currentTarget.dataset.planId
    var index = Number(e.currentTarget.dataset.index)
    if (!planId || isNaN(index)) return

    if (this.data.selectedId !== planId) {
      this.select({ currentTarget: { dataset: { id: planId } } })
    }

    var that = this
    this._drag = {
      active: true,
      planId: planId,
      from: index,
      over: index
    }

    var query = wx.createSelectorQuery()
    query.selectAll('.week-cell-' + planId).boundingClientRect()
    query.exec(function (res) {
      that._dragRects = (res && res[0]) || []
    })

    this._paintDrag(planId, index, index)
    this.setData({ isDragging: true })
    try {
      wx.vibrateShort({ type: 'light' })
    } catch (err) {}
  },

  noop() {},

  onWeekTouchMove(e) {
    if (!this._drag || !this._drag.active) return
    var touch = e.touches && e.touches[0]
    if (!touch) return
    var over = hitCellIndex(this._dragRects, touch.clientX, touch.clientY)
    if (over < 0) return
    if (over === this._drag.over) return
    this._drag.over = over
    this._paintDrag(this._drag.planId, this._drag.from, over)
  },

  onWeekTouchEnd() {
    if (!this._drag || !this._drag.active) {
      if (this.data.isDragging) this.setData({ isDragging: false })
      return
    }
    var planId = this._drag.planId
    var from = this._drag.from
    var to = this._drag.over
    this._drag = null
    this._dragRects = null
    this.setData({ isDragging: false })

    if (to != null && to >= 0 && to !== from) {
      this._swapWeekSlots(planId, from, to)
    } else {
      this._paintDrag('', -1, -1)
    }
  },

  _paintDrag(planId, from, over) {
    var plans = this.data.plans.map(function (p) {
      var f = p.id === planId ? from : -1
      var o = p.id === planId ? over : -1
      return Object.assign({}, p, {
        weekCells: cellsFromSlots(p.weekSlots, f, o)
      })
    })
    this.setData({ plans: plans })
  },

  _swapWeekSlots(planId, from, to) {
    var plans = this.data.plans.map(function (p) {
      if (p.id !== planId) {
        return Object.assign({}, p, {
          weekCells: cellsFromSlots(p.weekSlots, -1, -1)
        })
      }
      var next = (p.weekSlots || []).slice()
      var tmp = next[from]
      next[from] = next[to]
      next[to] = tmp
      next = serializeWeekSlots(next)
      return Object.assign({}, p, {
        weekSlots: next,
        weekCells: cellsFromSlots(next, -1, -1)
      })
    })
    this.setData({ plans: plans })
  },

  confirm() {
    if (!this.data.selectedId) {
      wx.showToast({ title: '请先选择计划', icon: 'none' })
      return
    }
    var selectedId = this.data.selectedId
    var chosen = null
    for (var i = 0; i < this.data.plans.length; i++) {
      if (this.data.plans[i].id === selectedId) {
        chosen = this.data.plans[i]
        break
      }
    }
    const prev = storage.getProfile() || {}
    const quality = require('../../../services/session-quality')
    const today = quality.todayKey()
    storage.setProfile(
      Object.assign({}, prev, {
        planId: selectedId,
        auxiliaries: normalizeAuxiliaries(prev.auxiliaries),
        weekSlotsOverride: {
          planId: selectedId,
          slots: serializeWeekSlots((chosen && chosen.weekSlots) || [])
        },
        currentWeek: prev.currentWeek || 1,
        trainingWeekStart: quality.mondayKey(today),
        completedBlocks: prev.completedBlocks || 0,
        onboardedAt: Date.now()
      })
    )
    wx.reLaunch({ url: '/pages/today/today' })
  }
})
