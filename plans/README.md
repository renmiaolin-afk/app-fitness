# 训练计划数据

按「推荐计划 × 辅助组合 × 力量档」生成周历与今日课。力量举为主线；CrossFit / Hyrox / 跑步最多选 2 项，嵌入调节日。

## 匹配规则（现行）

```text
建档
├── strengthTier: beginner | intermediate | advanced
├── 1RM（深蹲 / 卧推 / 硬拉）
├── auxiliaries: ["crossfit" | "hyrox" | "running"]  （≤2）
└── planId: strength-hybrid-mix | strength-linear | strength-time-efficient

组合 key = sort(auxiliaries).join("+") 或 none

周历 =
  scheduling/week-slots.json → plans[planId].combinations[key]

力量日内容 =
  cycles/{cycleId}/weeks/week-XX/strength/{strengthTier}.json

辅助日内容 =
  sessions/aux/{running-zone2|crossfit-short-metcon|hyrox-stations}.json

（可选）CF 技能缩放 =
  profiles/cf-levels.json + 旧 cf/{level}.json（兼容）
```

重量：用户真实 1RM × `load.percentOf1rm`；无 1RM 时回退 `exampleKg`。

## 力量课必练（背 / 肩）

每周训练周（week 1–4）除三大项外，必须覆盖：

| 动作 | 默认日 | 槽位 |
|---|---|---|
| **实力推** | 五 · 上推日 | `main`（严格站姿推举） |
| **潘德勒划船** | 二 · 卧推日 | `secondary` |
| **引体向上** | 三 · 硬拉日（进阶/较强周五再加一次） | `secondary` |

定义见 `profiles/required-movements.json`。新手引体可用弹力带或反向划船替代（见 `scalingNote`）。

## 目录

| 路径 | 说明 |
|---|---|
| `profiles/auxiliaries.json` | 三项辅助定义、剂量与冲突规则 |
| `profiles/strength-tiers.json` | 力量档与默认 1RM |
| `profiles/cf-levels.json` | CF 技能池（兼容旧数据） |
| `scheduling/week-slots.json` | **计划 × 辅助组合 → 七天槽位** |
| `scheduling/dose-rules.json` | 并发训练剂量上限 |
| `scheduling/README.md` | 解析伪代码与示例 |
| `sessions/aux/` | 跑步 / CF / Hyrox 调节日模板 |
| `cycles/strength-hybrid-v1/` | 力量课处方（按周 × 力量档） |

## 三套推荐计划（与设计稿对齐）

| planId | 名称 | 默认策略（选 CF+跑步时） |
|---|---|---|
| `strength-hybrid-mix` | 挪威力训计划 | 蹲/卧/拉/跑/上推/CF/休（4×4/2×2/1×8） |
| `strength-linear` | 线性 5×5 计划 | 力量优先；跑步作恢复，CF 暂缓 |
| `strength-time-efficient` | 5/3/1 力量计划 | 蹲/上肢/拉/CF/休/跑/休 |

## 剂量红线

| 模块 | 上限 |
|---|---|
| 力量主课 | 3–4 次/周 |
| 高强度辅（CF 或 Hyrox） | ≤1 次/周 |
| 跑步 Zone2 | 1–2 次/周，单次 20–40 分 |
| CF+Hyrox 同选 | 高强度槽仍只留 1 个 |

同日若叠加：先力量后辅助；高强度辅与深蹲/硬拉尽量间隔 ≥24h。测力周关闭高强度辅助。

## 相位与测力（力量块）

| 周 | 相位 | 力量 | 辅助 |
|---|---|---|---|
| 1–2 | 加重 | 基线→微升 | 按 week-slots |
| 3 | 维持 | 强度略升 | 可略收 Metcon |
| 4 | 减量 | 强度与组数双降 | 短课或轻松跑 |
| 5 | 测力（可选） | 一蹲 / 二卧 / 三拉 | 高强度辅关闭 |

详见 `cycles/strength-hybrid-v1/testing.json`。

## 示例：原型用户

```text
planId: strength-hybrid-mix
auxiliaries: ["crossfit", "running"]  → key = crossfit+running
strengthTier: advanced

周历标签: 深蹲 / 卧推 / 硬拉 / 跑 / 上推 / CF / 休
力量日: week-01/strength/advanced.json
跑日:   sessions/aux/running-zone2.json
CF日:   sessions/aux/crossfit-short-metcon.json
```
