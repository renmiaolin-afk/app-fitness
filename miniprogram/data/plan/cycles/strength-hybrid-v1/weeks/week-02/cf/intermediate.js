module.exports = {
  "cycleId": "strength-hybrid-v1",
  "week": 2,
  "cfLevel": "intermediate",
  "format": "class_3block",
  "note": "第 2 周 CF 课表（馆课三段式，按能力档）",
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
          "name": "抓举技术",
          "prescription": "每 90″ × 6 组 · 2 次轻–中"
        },
        {
          "order": 2,
          "kind": "strength",
          "durationMin": 15,
          "name": "高翻",
          "prescription": "5×2 @ 75%"
        },
        {
          "order": 3,
          "kind": "metcon",
          "style": "amrap",
          "durationMin": 12,
          "name": "AMRAP 12",
          "movements": [
            "6 高翻（中）",
            "8 引体",
            "10 箱跳"
          ]
        }
      ]
    },
    "sat": {
      "cfIndex": 2,
      "title": "CF 课",
      "subtitle": "技能 → 力量 → Metcon",
      "durationMin": 45,
      "intensityNote": "本周第 2 次 CF，用 AMRAP 控配速",
      "blocks": [
        {
          "order": 1,
          "kind": "skill",
          "durationMin": 10,
          "name": "双力臂过渡",
          "prescription": "3×3–5"
        },
        {
          "order": 2,
          "kind": "strength",
          "durationMin": 12,
          "name": "前蹲",
          "prescription": "4×3 @ 70%"
        },
        {
          "order": 3,
          "kind": "metcon",
          "style": "for_time",
          "capMin": 12,
          "name": "15-12-9 For Time",
          "movements": [
            "抓举 43/29 kg",
            "双力臂（或引体）"
          ]
        }
      ]
    }
  }
}
