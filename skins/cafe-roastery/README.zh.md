# 咖啡工坊

[English](README.md) | 中文

以烘焙咖啡馆为母题的暖色 dsh 皮肤。「浓缩」是深夜还开着的烘焙间：深烘咖啡豆色面板、
焦糖与奶油黄的高亮；「拿铁」是白天的吧台：奶泡米白面板、咖啡墨水文字、焦糖色交互——
界面里没有纯白，也没有冷色。

## 这是什么

- **纯资产**：`skin.json`（v2 清单）+ `skin.css`（完整的 `--dsw-alias-*`
  token 重映射）+ `patches.css`（L3 自由选择器）+ 清单声明的两枚背景位图。
  无 package.json、无构建步骤、无 hooks。
- **两套主题，同一间店**：调色板对明暗两套都做了声明，所以
  `preview/light.png` 与 `preview/dark.png` 是同一间店的两次快门，
  不是同一张图换色。
- **结构**：首屏是杯口的「奶泡罗塞塔」与上升的蒸汽，输入卡按纸杯套裁形，
  侧栏读作烘焙间的墙面；右栏与会话头共用同一层暖色纸面与「黑板下划线」。

## 配色

- 底 — 亮色：拿铁奶泡 `#f3e9d2` .. `#efe3c8`；暗色：浓缩
  `#4a331b` .. `#3f2c19`
- 墨 — 亮色咖啡墨水 `#3f2c19`，暗色奶油 `#f2e9d4`
- 主色 — 焦糖 `#e2a84e`
- 细线 — 亮色用 `#7d6848` 的几个透明度，暗色用 `#f2c98a2e`

## 背景

`skin.json` 通过 `backgroundMedia` 为明暗两套各声明一枚位图：
亮色 `assets/bg-final-latte.png`，暗色 `assets/bg-final-espresso.png`，
都落在右下。

## 宿主适配（0.1.7）

- **右栏** — 改锚官方 `[data-rightbar-col]` 元素（皮肤中心同时给它盖上
  `data-dsh-surface="details"`）；旧的 `[data-slot="details"]` /
  `[data-pane="details"]` 方言保留在最前面，旧宿主命中同一层漆。
- **会话头** — 0.1.7 把 `data-dsh-surface="session-header"` 打在一个 0x0 的
  插槽出口上，阴影画在那儿不出图。规则改锚
  `[data-slot='conversation.header']` 下的真 `<header>`，旧形状留在最后。
- **窄屏与系统偏好** — `max-width: 768px` 时收掉按正方形画的首屏圆环、
  收细输入卡外环；`prefers-reduced-transparency` 把右栏那层纱换成实底，
  `prefers-reduced-motion` 冻住首屏。

## 素材与许可

- `assets/bg-final-latte.png` 与 `assets/bg-final-espresso.png` 由作者用
  生成式模型为本皮肤出图，再自行挑选与整理。包里不含任何第三方素材，
  也不是对现成作品的描摹；样式表不引用任何远程资源或字体。
- 权利人：本皮肤作者（`stushansusu`）。再分发按仓库许可 —— BSD-3-Clause，
  见仓库根目录的 `LICENSE`。

## 预览

`preview/light.png` 与 `preview/dark.png` —— 同一场会话的两套配色。