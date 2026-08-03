module.exports = {
  "cycleId": "strength-hybrid-v1",
  "week": 1,
  "cfLevel": "intermediate",
  "format": "class_3block",
  "note": "与 Pencil「CF 日」原型一致：双力臂 / 高翻 / 21-15-9 抓举+引体",
  "sessions": {
    "thu": {
      "cfIndex": 1,
      "title": "CF 课",
      "subtitle": "技能 → 力量 → Metcon",
      "durationMin": 50,
      "intensityNote": "控强度，别抢力量日恢复",
      "blocks": [
        {
          "order": 1,
          "kind": "skill",
          "durationMin": 10,
          "name": "双力臂",
          "prescription": "3×3–5（质量优先）"
        },
        {
          "order": 2,
          "kind": "strength",
          "durationMin": 15,
          "name": "高翻",
          "prescription": "5×3 @ 70–75%"
        },
        {
          "order": 3,
          "kind": "metcon",
          "style": "for_time",
          "name": "21-15-9 For Time",
          "movements": [
            "抓举 43 kg（女 29 kg）",
            "引体向上（可用双力臂）"
          ]
        }
      ]
    },
    "sat": {
      "cfIndex": 2,
      "title": "CF 课",
      "subtitle": "技能 → 力量 → Metcon",
      "durationMin": 45,
      "intensityNote": "本周第 2 次 CF，Metcon 用 EMOM 控配速",
      "blocks": [
        {
          "order": 1,
          "kind": "skill",
          "durationMin": 10,
          "name": "抓举技术",
          "prescription": "每 90″ × 6 组 · 2 次轻–中"
        },
        {
          "order": 2,
          "kind": "strength",
          "durationMin": 12,
          "name": "前蹲",
          "prescription": "4×4 @ 65–70%"
        },
        {
          "order": 3,
          "kind": "metcon",
          "style": "emom",
          "durationMin": 12,
          "name": "EMOM 12",
          "movements": [
            "分 1：8 高翻（中等）",
            "分 2：10 双力臂过渡 / 严格引体",
            "分 3：12 卡路里划船"
          ]
        }
      ]
    }
  }
}
