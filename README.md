# app-fitness

力量训练产品设计与原型仓库。

## 设计稿

Pencil 设计文件：`docs/design/strength-training.pen`

### 页面结构

| 画板 | 说明 |
|---|---|
| 01 今日 | 力量周期、周 Tab、计划卡、强度分段、开始训练 |
| 01 今日 · 非今日预览 | 非当日计划预览，不可开练 |
| 02 训练 · 待开始 | 155KG、±2.5、本组计时预告、「开始本组」 |
| 02 训练 · 本组计时 | 本组倒计时（不可暂停）、「结束本组」 |
| 02 训练 · 组间休息 | 1/2 分钟休息倒计时、「开始下一组」 |
| 03 我的 | 个人资料与设置 |

### 训练流程

`今日 → 开始训练 → 开始本组 → 本组计时 → 结束本组 → 组间休息 → 开始下一组`

## 打开设计稿

在 [Pencil](https://docs.pencil.dev/) 中打开 `docs/design/strength-training.pen`，或使用 Cursor Pencil 扩展直接编辑。

Pencil 默认不会自动进 Git，改完后先 **Cmd+S 保存**，再用同步脚本。

## 同步到 GitHub

仓库提供一键脚本，把 Pencil 本地文件复制到 `docs/design/`，并可选择提交、推送：

```bash
# 仅复制（不提交）
./scripts/sync-design.sh

# 复制 + 提交 + 推送
./scripts/sync-design.sh -m "design: 更新训练页计时布局" -p

# 使用默认提交说明并推送
./scripts/sync-design.sh --push
```

Pencil 源文件默认路径：

`~/.pencil/documents/37054c31-2220-4b11-b030-9e05fddfab65/pencil-new.pen`

若路径不同，可覆盖：

```bash
PENCIL_SOURCE=/你的路径/xxx.pen ./scripts/sync-design.sh --push
```

> **注意**：只有执行了带 `-p` / `--push` 的命令，改动才会出现在 GitHub 上。
