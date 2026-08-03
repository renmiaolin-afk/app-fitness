module.exports = {
  "cycleId": "strength-hybrid-v1",
  "week": 4,
  "cfLevel": "beginner",
  "format": "class_3block",
  "note": "第 4 周 CF 课表（馆课三段式，按能力档）",
  "sessions": {
    "thu": {
      "cfIndex": 1,
      "title": "CF 课",
      "subtitle": "技能 → 力量 → Metcon",
      "durationMin": 30,
      "intensityNote": "减量周：短技能 + 轻 Metcon",
      "blocks": [
        {
          "order": 1,
          "kind": "skill",
          "durationMin": 8,
          "name": "空蹲 / 波比",
          "prescription": "轻松 8′"
        },
        {
          "order": 2,
          "kind": "strength",
          "durationMin": 8,
          "name": "壶铃摇摆",
          "prescription": "3×8 轻"
        },
        {
          "order": 3,
          "kind": "metcon",
          "style": "amrap",
          "durationMin": 8,
          "name": "AMRAP 8",
          "movements": [
            "8 空蹲",
            "6 卡路里划船",
            "4 波比"
          ]
        }
      ]
    },
    "sat": {
      "cfIndex": 2,
      "title": "CF 课",
      "subtitle": "技能 → 恢复",
      "durationMin": 25,
      "intensityNote": "本周第 2 次可改为主动恢复",
      "blocks": [
        {
          "order": 1,
          "kind": "skill",
          "durationMin": 10,
          "name": "活动度 + 轻松划船",
          "prescription": "10′ 持续"
        },
        {
          "order": 2,
          "kind": "metcon",
          "style": "easy",
          "durationMin": 10,
          "name": "轻松有氧",
          "movements": [
            "划船或快走 10′"
          ]
        }
      ]
    }
  }
}
