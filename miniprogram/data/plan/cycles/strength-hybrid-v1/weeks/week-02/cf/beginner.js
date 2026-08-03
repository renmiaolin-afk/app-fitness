module.exports = {
  "cycleId": "strength-hybrid-v1",
  "week": 2,
  "cfLevel": "beginner",
  "format": "class_3block",
  "note": "第 2 周 CF 课表（馆课三段式，按能力档）",
  "sessions": {
    "thu": {
      "cfIndex": 1,
      "title": "CF 课",
      "subtitle": "技能 → 力量 → Metcon",
      "durationMin": 45,
      "intensityNote": "控强度，别抢力量日恢复",
      "blocks": [
        {
          "order": 1,
          "kind": "skill",
          "durationMin": 10,
          "name": "空蹲节奏",
          "prescription": "EMOM 8′ · 10 次"
        },
        {
          "order": 2,
          "kind": "strength",
          "durationMin": 12,
          "name": "哑铃推举",
          "prescription": "4×8"
        },
        {
          "order": 3,
          "kind": "metcon",
          "style": "amrap",
          "durationMin": 10,
          "name": "AMRAP 10",
          "movements": [
            "8 壶铃摇摆",
            "8 箱上踏步",
            "8 卡路里划船"
          ]
        }
      ]
    },
    "sat": {
      "cfIndex": 2,
      "title": "CF 课",
      "subtitle": "技能 → 力量 → Metcon",
      "durationMin": 40,
      "intensityNote": "本周第 2 次 CF，短 Metcon",
      "blocks": [
        {
          "order": 1,
          "kind": "skill",
          "durationMin": 8,
          "name": "波比质量",
          "prescription": "3×6 慢速"
        },
        {
          "order": 2,
          "kind": "strength",
          "durationMin": 10,
          "name": "高脚杯深蹲",
          "prescription": "4×8"
        },
        {
          "order": 3,
          "kind": "metcon",
          "style": "for_time",
          "capMin": 12,
          "name": "For Time",
          "movements": [
            "15 空蹲",
            "10 波比",
            "200 m 划船",
            "重复 3 轮"
          ]
        }
      ]
    }
  }
}
