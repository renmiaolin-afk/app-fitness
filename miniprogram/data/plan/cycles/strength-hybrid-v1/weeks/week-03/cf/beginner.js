module.exports = {
  "cycleId": "strength-hybrid-v1",
  "week": 3,
  "cfLevel": "beginner",
  "format": "class_3block",
  "note": "第 3 周 CF 课表（馆课三段式，按能力档）",
  "sessions": {
    "thu": {
      "cfIndex": 1,
      "title": "CF 课",
      "subtitle": "技能 → 力量 → Metcon",
      "durationMin": 40,
      "intensityNote": "维持周：Metcon 略短",
      "blocks": [
        {
          "order": 1,
          "kind": "skill",
          "durationMin": 8,
          "name": "壶铃摇摆",
          "prescription": "3×12"
        },
        {
          "order": 2,
          "kind": "strength",
          "durationMin": 10,
          "name": "高脚杯深蹲",
          "prescription": "3×8"
        },
        {
          "order": 3,
          "kind": "metcon",
          "style": "amrap",
          "durationMin": 10,
          "name": "AMRAP 10",
          "movements": [
            "10 空蹲",
            "8 波比",
            "8 卡路里划船"
          ]
        }
      ]
    },
    "sat": {
      "cfIndex": 2,
      "title": "CF 课",
      "subtitle": "技能 → 力量 → Metcon",
      "durationMin": 35,
      "intensityNote": "本周第 2 次 CF，为减量周留恢复",
      "blocks": [
        {
          "order": 1,
          "kind": "skill",
          "durationMin": 8,
          "name": "箱上踏步",
          "prescription": "3×8"
        },
        {
          "order": 2,
          "kind": "strength",
          "durationMin": 8,
          "name": "哑铃推举",
          "prescription": "3×8"
        },
        {
          "order": 3,
          "kind": "metcon",
          "style": "for_time",
          "capMin": 10,
          "name": "For Time",
          "movements": [
            "200 m 划船",
            "12 壶铃摇摆",
            "8 波比",
            "重复 2 轮"
          ]
        }
      ]
    }
  }
}
