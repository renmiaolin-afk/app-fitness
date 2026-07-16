#!/usr/bin/env bash
# 将 Pencil 本地设计稿同步到本仓库，并可选择提交、推送到 GitHub。
#
# 用法:
#   ./scripts/sync-design.sh                    # 仅复制
#   ./scripts/sync-design.sh -m "更新训练页"     # 复制并提交
#   ./scripts/sync-design.sh -m "更新训练页" -p  # 复制、提交并推送
#   ./scripts/sync-design.sh --push             # 复制、默认提交信息并推送
#
# 环境变量:
#   PENCIL_SOURCE  覆盖 Pencil 源文件路径

set -euo pipefail

readonly DEFAULT_PENCIL_SOURCE="${HOME}/.pencil/documents/37054c31-2220-4b11-b030-9e05fddfab65/pencil-new.pen"
readonly DEFAULT_COMMIT_MESSAGE="design: sync Pencil design"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
PENCIL_SOURCE="${PENCIL_SOURCE:-${DEFAULT_PENCIL_SOURCE}}"
TARGET_FILE="${REPO_ROOT}/docs/design/strength-training.pen"

COMMIT_MESSAGE=""
DO_PUSH=false

print_usage() {
  cat <<'EOF'
用法: ./scripts/sync-design.sh [选项]

选项:
  -m, --message <msg>  提交说明（提供后会执行 git commit）
  -p, --push           提交后推送到 origin（需配合 -m 或 --push）
  --push               使用默认提交说明并推送（等价于 -m "design: sync Pencil design" -p）
  -h, --help           显示帮助

示例:
  ./scripts/sync-design.sh
  ./scripts/sync-design.sh -m "design: 调整训练页计时布局" -p
  PENCIL_SOURCE=/path/to/file.pen ./scripts/sync-design.sh --push
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    -m|--message)
      COMMIT_MESSAGE="${2:-}"
      shift 2
      ;;
    -p|--push)
      DO_PUSH=true
      shift
      ;;
    --push)
      COMMIT_MESSAGE="${DEFAULT_COMMIT_MESSAGE}"
      DO_PUSH=true
      shift
      ;;
    -h|--help)
      print_usage
      exit 0
      ;;
    *)
      echo "未知参数: $1" >&2
      print_usage
      exit 1
      ;;
  esac
done

if [[ "${DO_PUSH}" == true && -z "${COMMIT_MESSAGE}" ]]; then
  COMMIT_MESSAGE="${DEFAULT_COMMIT_MESSAGE}"
fi

if [[ ! -f "${PENCIL_SOURCE}" ]]; then
  echo "错误: 找不到 Pencil 源文件: ${PENCIL_SOURCE}" >&2
  echo "请先在 Pencil 中保存 (Cmd+S)，或通过 PENCIL_SOURCE 指定路径。" >&2
  exit 1
fi

mkdir -p "$(dirname "${TARGET_FILE}")"
cp "${PENCIL_SOURCE}" "${TARGET_FILE}"
echo "已同步: ${PENCIL_SOURCE}"
echo "    -> ${TARGET_FILE}"

cd "${REPO_ROOT}"

if [[ -z "${COMMIT_MESSAGE}" ]]; then
  if git diff --quiet -- "${TARGET_FILE}"; then
    echo "设计稿无变化，跳过提交。"
  else
    echo "设计稿已更新。如需提交并推送，请运行:"
    echo "  ./scripts/sync-design.sh -m \"你的说明\" -p"
  fi
  exit 0
fi

if git diff --quiet -- "${TARGET_FILE}"; then
  echo "设计稿无变化，跳过提交。"
  exit 0
fi

git add "${TARGET_FILE}"
git commit -m "${COMMIT_MESSAGE}"
echo "已提交: ${COMMIT_MESSAGE}"

if [[ "${DO_PUSH}" == true ]]; then
  git push
  echo "已推送到远端。"
fi
