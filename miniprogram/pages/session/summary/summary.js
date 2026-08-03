Page({
  data: {
    name: '',
    durationMin: 0,
    score: 90,
    sets: [],
    kind: 'strength',
    hasSets: false
  },

  onLoad() {
    const log = wx.getStorageSync('af_summary') || {}
    const raw = log.sets || []
    var blockCount = {}
    const sets = raw.map(function (s, i) {
      var label = s.label || (s.kind === 'warmup' ? '热身' : '工作')
      var key = s.block || label
      blockCount[key] = (blockCount[key] || 0) + 1
      var title = label + ' ' + blockCount[key]
      var detail =
        (s.kg != null ? s.kg + 'kg' : '-') +
        (s.reps != null ? ' × ' + s.reps : '') +
        ' · ' +
        (s.durationSec != null ? s.durationSec : 0) +
        's'
      return Object.assign({}, s, { title: title, detail: detail })
    })
    this.setData({
      name: log.name || '训练',
      durationMin: log.durationMin || 0,
      score: log.score || 90,
      sets: sets,
      kind: log.kind || 'strength',
      hasSets: log.kind === 'strength' && sets.length > 0
    })
  },

  backToday() {
    wx.reLaunch({ url: '/pages/today/today' })
  }
})
