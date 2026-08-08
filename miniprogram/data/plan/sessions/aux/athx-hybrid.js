module.exports = {
  id: 'athx-hybrid',
  auxId: 'athx',
  name: 'AthX 混合轻课',
  durationMin: 32,
  rpeCap: 7,
  intensityModes: {
    default: 'strength_endurance_metcon',
    technique: 'zones_light'
  },
  blocks: [
    {
      name: '力量区 · 深蹲',
      kind: 'strength',
      minutes: 10,
      // kg 由 getAuxSession → enrichAthxSession 按深蹲 1RM×70% 写入
      load: { type: 'percent_1rm', percentOf1rm: 0.7, lift: 'squat' },
      cues: [
        '杠铃深蹲 3 组 × 3 次（约 70% 深蹲 1RM，留 2～3 次余力）',
        '也可改做实力推 3×3（约卧推 55%）',
        '质量优先，模拟 AthX 力量区，不追求力竭'
      ]
    },
    {
      name: '有氧区 · 轻松跑',
      minutes: 12,
      distanceKm: 1.6,
      cues: [
        '慢跑约 1.6 km / 12 分钟，能说完整短句',
        '无场地可改划船机同时长同配速感',
        '练节奏与呼吸，不为冲刺'
      ]
    },
    {
      name: '混合收尾 · 摆荡+农夫走',
      minutes: 10,
      cues: [
        '壶铃摆荡 3×12 + 农夫走 3×20 m（重量按档案估算）',
        '组间短歇，动作完整不凑数',
        'technique 模式减半负荷与趟数'
      ]
    }
  ],
  scaling: {
    technique: {
      durationMin: 22
    },
    default: {
      durationMin: 32
    }
  }
}
