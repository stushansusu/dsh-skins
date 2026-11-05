# model-dorm 浮层近景（PR #68，2026-11-01）

这组图是复核意见要的那张「浮动表面（菜单）亮暗近景」。前一组
`model-dorm-tokens-*.jpg` 与 main 上 `evidence/model-dorm-light.jpg` / `-dark.jpg`
逐字节相同，画的是改动前的画面，不构成这次变更的证据；这一组取而代之。

## 拍的是什么

- 浮层：输入卡左侧「访问模式」菜单（仅可查看 / 工作区内修改 / 完全权限）。它由壳层
  的 `--dsw-menu-surface-fill`、`--dsw-radius-*`、`--dsw-elevation-*` 驱动，正好是
  这次改动覆盖的族。
- 同机位、同裁剪、同菜单，两组各亮暗一张：
  - `model-dorm-floating-menu-light.jpg` / `-dark.jpg`：应用 model-dorm 后；
  - `model-dorm-floating-menu-stock-light.jpg` /
    `model-dorm-floating-menu-stock-dark.jpg`：官方默认（未应用皮肤），供 1:1 对照。
- 裁剪窗口 256×188 CSS px，设备像素比 2，导出 512×376。

## 怎么拍的

- 宿主：`dsh --profile web --port 19388`（dsh 0.2.1-rc.5、ui-theme 0.2.1-rc.5、
  skin-center 0.4.6）。
- 被测皮肤：PR head 的 `skins/model-dorm`，装到 `$DSH_HOME/skins/model-dorm`
  （`skin.css` sha256 `73e952af7884b21afebc2d9a79e5042d209dcac417726b35b0462544f4322705`，
  与本分支该文件一致）。
- 换皮走皮肤中心本身：对 model-dorm 点「应用」，主题预览切「亮色 / 暗色」；对照组点
  「恢复默认」。不手改 `cordis.patch.yml`，不重启。
- 抓图：playwright-core 1.63.0 + Chromium（Playwright build 1243），视口 1440×900、
  deviceScaleFactor 2、zh-CN。每轮先读 `[role="menu"]` 的实际矩形，再按固定
  左 56px / 上 30px / 下含触发行的边距裁剪，四张图对位一致。

## 量到的差异（浏览器 computed style，同一个菜单节点）

| 项 | 官方默认 | model-dorm |
| --- | --- | --- |
| 面板 `border-radius` | 16px | 14px |
| 菜单项 `border-radius` | 12px | 10px |
| 描边（暗色） | `rgba(255,255,255,0.16) 0 0 0 .5px` | `rgba(255,217,184,0.36) 0 0 0 .5px` |
| 描边（亮色） | `rgba(0,0,0,0.04) 0 0 0 .5px` | `rgba(107,74,63,0.36) 0 0 0 .5px` |
| 投影内层（暗色） | `rgba(0,0,0,0.04) 0 3px 8px` + `rgba(0,0,0,0.05) 0 0 20px` | `rgba(13,8,10,0.24)` + `rgba(13,8,10,0.28)` |
| 投影内层（亮色） | 同上，纯黑 | `rgba(58,42,38,0.09)` + `rgba(58,42,38,0.12)` |

这三层（圆角、描边、投影）都是本 PR 新增的声明，四张图里直接可见：默认是中性白/黑描边
配冷黑投影，应用后换成暖褐描边配暖褐投影，转角同时从 16px 收到 14px。菜单底色来自
`--dsw-specific-menu` / `--dsw-menu-surface-fill`，是半透明玻璃，所以画面在菜单里仍看得见
——这是这套皮肤本来的语言，不是截图叠加。

## 文件

| 文件 | 内容 |
| --- | --- |
| `model-dorm-floating-menu-light.jpg` | 应用皮肤 · 亮色 · 访问模式菜单 + 触发行 |
| `model-dorm-floating-menu-dark.jpg` | 应用皮肤 · 暗色 · 同上机位 |
| `model-dorm-floating-menu-stock-light.jpg` | 官方默认 · 亮色 · 同上机位 |
| `model-dorm-floating-menu-stock-dark.jpg` | 官方默认 · 暗色 · 同上机位 |
