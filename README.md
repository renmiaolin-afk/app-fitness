# app-fitness

力量训练产品设计与原型仓库。

## 仓库结构

| 路径 | 说明 |
|---|---|
| `docs/design/strength-training.pen` | Pencil 设计稿 |
| `plans/` | **训练计划数据**（按周期 × 能力档案） |
| `scripts/sync-design.sh` | 设计稿同步脚本 |

## 训练计划（按能力档案）

建档后根据能力档拉取对应计划：

```text
strengthTier + cfLevel + 当前周次
  → plans/cycles/strength-hybrid-v1/weeks/week-XX/strength/{tier}.json
  → plans/cycles/strength-hybrid-v1/weeks/week-XX/cf/{level}.json
```

| 力量档 | 文件 | 说明 |
|---|---|---|
| 新手 | `beginner.json` | 低强度、偏体积 |
| 进阶 | `intermediate.json` | 中等强度推进 |
| 较强 | `advanced.json` | 高强度精简组（原型默认） |

| CF 档 | 文件 | 说明 |
|---|---|---|
| 初级 | `beginner.json` | 波比/划船/空蹲等 |
| 中级 | `intermediate.json` | 高翻/抓举/双力臂（馆课三段式） |
| 高级 | `advanced.json` | 蝴蝶引体/吊环等 |

周结构：深蹲 / 卧推 / 硬拉 / **CF** / 上推 / **CF** / 休  

当前周期 `strength-hybrid-v1`：**4 周完整计划**（加重 → 加重 → 维持 → 减量），力量三档 × CF 三档均可独立组合。

详见 [`plans/README.md`](./plans/README.md)。

## 设计稿页面

| 画板 | 说明 |
|---|---|
| 00 建档 | 能力档案（力量档 + CF 档）+ 训练习惯 |
| 01 今日 | 七天周历、计划卡、开始训练 |
| 01 今日 · CF 日 | 馆课三段式（技能/力量/Metcon） |
| 01 今日 · 开练确认 | 临时状态，可跳过 |
| 02 训练 | 待开始 / 本组计时 / 组间休息 |
| 03 我的 | 三大项进度、CF/习惯可编辑 |

### 训练流程

`建档 → 今日计划 → [开练确认可跳过] → 训练 → 今日完成`

## 打开设计稿

在 [Pencil](https://docs.pencil.dev/) 中打开 `docs/design/strength-training.pen`，或使用 Cursor Pencil 扩展直接编辑。

Pencil 默认不会自动进 Git，改完后先 **Cmd+S 保存**，再用同步脚本。

## 同步到 GitHub

```bash
# 仅复制设计稿（不提交）
./scripts/sync-design.sh

# 复制 + 提交 + 推送
./scripts/sync-design.sh -m "design: 更新训练页" -p

# 使用默认提交说明并推送
./scripts/sync-design.sh --push
```

Pencil 源文件默认路径：

`~/.pencil/documents/37054c31-2220-4b11-b030-9e05fddfab65/pencil-new.pen`

> **注意**：只有执行了带 `-p` / `--push` 的命令，改动才会出现在 GitHub 上。
