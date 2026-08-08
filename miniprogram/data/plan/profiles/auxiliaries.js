module.exports = {
  version: 2,
  description:
    '建档可选辅助项目。力量举为主线；辅助只选 1 项，嵌入调节日，不抢三大项适应。',
  maxSelect: 1,
  items: [
    {
      id: 'crossfit',
      label: 'CrossFit',
      class: 'high_mixed',
      role: '短时高强度混合代谢，作调节日而非第二主线',
      defaultSession: 'sessions/aux/crossfit-short-metcon.json',
      dose: {
        maxHighSlotsPerWeek: 1,
        durationMin: [12, 20],
        rpeCap: 7,
        avoidAdjacentTo: ['deadlift', 'squat']
      },
      notes: 'Metcon 宜短可控；技能+力量+Metcon 可简化为技能+短 Metcon'
    },
    {
      id: 'hyrox',
      label: 'Hyrox',
      class: 'high_mixed',
      role: '站技与 compromised run 轻量练习，服务趣味与混合能力',
      defaultSession: 'sessions/aux/hyrox-stations.json',
      dose: {
        maxHighSlotsPerWeek: 1,
        durationMin: [20, 35],
        rpeCap: 7,
        avoidAdjacentTo: ['deadlift']
      },
      notes: '力量底子好时优先练跑与站技过渡，不堆无限 metcon'
    },
    {
      id: 'athx',
      label: 'AthX',
      class: 'high_mixed',
      role: '力量区 + 有氧区 + 混合收尾的轻量模拟，补全面体能',
      defaultSession: 'sessions/aux/athx-hybrid.json',
      dose: {
        maxHighSlotsPerWeek: 1,
        durationMin: [25, 35],
        rpeCap: 7,
        avoidAdjacentTo: ['deadlift', 'squat']
      },
      notes: '分区练习强度可控；不替代专项力量日'
    }
  ],
  conflictRules: []
}
