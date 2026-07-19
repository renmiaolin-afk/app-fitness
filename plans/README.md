# 训练计划数据

按「训练周期 × 能力档案」组织力量与 CF 计划。产品建档后，用档案字段匹配对应 JSON，生成当周今日计划。

## 匹配规则

```text
建档
├── strengthTier: beginner | intermediate | advanced   （新手 / 进阶 / 较强）
├── cfLevel:      beginner | intermediate | advanced   （初级 / 中级 / 高级）
└── 1RM（深蹲 / 卧推 / 硬拉）→ 用于把 percentOf1rm 换成今日公斤数

今日计划 =
  cycles/{cycleId}/weeks/week-XX/strength/{strengthTier}.json
  + cycles/{cycleId}/weeks/week-XX/cf/{cfLevel}.json
```

重量优先用用户真实 1RM × `load.percentOf1rm`；若无 1RM，回退到档案默认示例重量 `exampleKg`。

力量档与 CF 档**独立匹配**：例如力量「较强」+ CF「中级」是合法组合（原型默认档案）。

## 目录

| 路径 | 说明 |
|---|---|
| `profiles/` | 能力档定义与默认 1RM / 技能池 |
| `cycles/strength-hybrid-v1/` | 力量优先混合周期（当前产品默认） |
| `cycles/.../weeks/week-01~04/` | 四周完整力量三档 + CF 三档 |
| `cycles/.../weeks/week-XX/progression.json` | 该周相对 week-01 的推进规则说明 |

## 周结构（七天）

| 一 | 二 | 三 | 四 | 五 | 六 | 日 |
|---|---|---|---|---|---|---|
| 深蹲 | 卧推 | 硬拉 | CF | 上推 | CF | 休 |

CF 一周两次，采用馆课三段式：技能 → 力量 → Metcon。

## 四周相位

| 周 | 相位 | 力量 | CF |
|---|---|---|---|
| 1 | 加重周 | 基线处方 | 完整三段式 ×2 |
| 2 | 加重周 | 主项 %1RM 微升 | 换 Metcon 刺激 |
| 3 | 维持周 | 强度略升 / 可砍辅助 | Metcon 略收 |
| 4 | 减量周 | 强度与组数双降 | 短课或主动恢复 |

## 示例：原型用户（较强力量 + 中级 CF）

```text
week-01/strength/advanced.json   → 深蹲 3×4 @ ~155
week-01/cf/intermediate.json     → 双力臂 / 高翻 / 21-15-9 抓举+引体
```
