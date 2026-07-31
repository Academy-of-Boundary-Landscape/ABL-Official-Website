#!/usr/bin/env bash
# 从 assets-src/ 的母版生成 src/assets/images/ 下的网页版本。
# 一次性工具，不接入构建流程——这些图几乎不变，自动化价值不足以抵消
# 新依赖与构建耗时。改图或加图时手动跑一次。
#
# 目标尺寸按各自的实际显示需求确定，不统一裁到同一尺寸：
#   abl_logo        页头显示 48-82px 高，200px 覆盖 2x 屏
#   calabi-yau      base.css 写死 background-size: min(92vw, 1280px)
#   csd20 三张      画册作品图，长边 1600px（点击后模态框 max-width: 90vw）
#   zyz_title       母版仅 1173px，'>' 修饰符使其保持原尺寸，收益来自换格式
#   zyz_screenshot  653px 本就合理，仅换格式
#
# 用法: cd frontend && bash scripts/optimize-images.sh
set -euo pipefail

SRC=assets-src
DST=src/assets/images
Q_ART=82      # 作品图与背景图
Q_UI=88       # logo 等 UI 元素，边缘锐利度更重要

conv() { # conv <相对路径(不含扩展名)> <resize 参数或 -> <质量>
  local rel=$1 geom=$2 q=$3
  local src="$SRC/$rel.png" dst="$DST/$rel.webp"
  mkdir -p "$(dirname "$dst")"
  if [ "$geom" = "-" ]; then
    convert "$src" -quality "$q" -define webp:method=6 "$dst"
  else
    convert "$src" -resize "$geom" -quality "$q" -define webp:method=6 "$dst"
  fi
  printf '%-32s %8s -> %8s  (%s)\n' "$rel" \
    "$(du -h "$src" | cut -f1)" "$(du -h "$dst" | cut -f1)" \
    "$(identify -format '%wx%h' "$dst")"
}

conv abl_logo                     '200x200>'   $Q_UI
conv calabi-yau                   '1280x1280>' $Q_ART
conv zyz_title                    '1200x1200>' $Q_ART
conv zyz_screenshot               '-'          85
conv csd20related/csd_20_title    '1600x1600>' $Q_ART
conv csd20related/宣传图12         '1600x1600>' $Q_ART
conv csd20related/宣传图10         '1600x1600>' $Q_ART
