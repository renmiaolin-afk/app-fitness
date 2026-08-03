module.exports = {
  "version": 1,
  "description": "建档可选辅助项目。力量举为主线；辅助最多 2 项，嵌入调节日，不抢三大项适应。",
  "maxSelect": 2,
  "items": [
    {
      "id": "crossfit",
      "label": "CrossFit",
      "class": "high_mixed",
      "role": "短时高强度混合代谢，作调节日而非第二主线",
      "defaultSession": "sessions/aux/crossfit-short-metcon.json",
      "dose": {
        "maxHighSlotsPerWeek": 1,
        "durationMin": [
          12,
          20
        ],
        "rpeCap": 7,
        "avoidAdjacentTo": [
          "deadlift",
          "squat"
        ]
      },
      "notes": "Metcon 宜短可控；技能+力量+Metcon 可简化为技能+短 Metcon"
    },
    {
      "id": "hyrox",
      "label": "Hyrox",
      "class": "high_mixed",
      "role": "站技与 compromised run 轻量练习，服务趣味与混合能力",
      "defaultSession": "sessions/aux/hyrox-stations.json",
      "dose": {
        "maxHighSlotsPerWeek": 1,
        "durationMin": [
          20,
          35
        ],
        "rpeCap": 7,
        "avoidAdjacentTo": [
          "deadlift"
        ]
      },
      "notes": "力量底子好时优先练跑与站技过渡，不堆无限 metcon"
    },
    {
      "id": "running",
      "label": "跑步",
      "class": "zone2_endurance",
      "role": "轻松有氧 / 主动恢复，保护力量适应",
      "defaultSession": "sessions/aux/running-zone2.json",
      "dose": {
        "maxSessionsPerWeek": 2,
        "durationMin": [
          20,
          40
        ],
        "intensity": "zone2",
        "avoidAdjacentTo": [
          "deadlift",
          "squat"
        ]
      },
      "notes": "能说话强度；冲击偏大时可改骑行/划船同 Zone2"
    }
  ],
  "conflictRules": [
    {
      "whenClasses": [
        "high_mixed",
        "high_mixed"
      ],
      "action": "keep_one_high_slot",
      "detail": "同时选 CrossFit+Hyrox 时，每周只保留 1 个高强度槽，另一项改为低强度技术/恢复或本周期暂缓"
    },
    {
      "whenClasses": [
        "high_mixed",
        "zone2_endurance"
      ],
      "action": "both_allowed",
      "detail": "高强度辅 1 次 + Zone2 跑 1 次，错开下肢大重量日"
    }
  ]
}
