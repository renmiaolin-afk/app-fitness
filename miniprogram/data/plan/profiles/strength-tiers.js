module.exports = {
  "version": 1,
  "description": "力量能力档：建档时选择，决定力量日组数/强度/辅助量。默认 1RM 仅作示例，真实用户以建档录入为准。",
  "tiers": [
    {
      "id": "beginner",
      "label": "新手",
      "summary": "刚建立三大项技术，优先动作质量与稳定完成",
      "default1rmKg": {
        "squat": 100,
        "bench": 70,
        "deadlift": 120
      },
      "mainSetStyle": "体积优先、强度偏低",
      "accessoryVolume": "low"
    },
    {
      "id": "intermediate",
      "label": "进阶",
      "summary": "三大项已成型，可按百分比推进",
      "default1rmKg": {
        "squat": 140,
        "bench": 100,
        "deadlift": 170
      },
      "mainSetStyle": "中等强度工作组",
      "accessoryVolume": "medium"
    },
    {
      "id": "advanced",
      "label": "较强",
      "summary": "业余进阶偏上，需控恢复、精确加重",
      "default1rmKg": {
        "squat": 175,
        "bench": 130,
        "deadlift": 205
      },
      "mainSetStyle": "高强度工作组、组数精简",
      "accessoryVolume": "medium",
      "note": "产品原型默认档案（84kg · 总成绩 510）落在此档"
    }
  ]
}
