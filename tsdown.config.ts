import { clientBundle } from './shared/tsdown.client.ts'

export default clientBundle(
  '@linxin666/dsh-client-ui-skin-center',
  ['src/index.ts'],
  {
    lib: {
      // 宿主侧会在运行时从 dsh 配置树解析 dsh-settings / schemastery，而非本地安装；
      // 保持外部（`volatile()` 只在 SDK 的 @deepseek-ai/schemastery 上存在，
      // npm 的 schemastery 3.18.0 没有这个方法）。
      // lightningcss 不在这里 external：宿主半区永远不导入它（issue #98），
      // 它只存在于 css-safety / css-safety-worker 两个 companion bundle。
      external: ['@deepseek-ai/cordis', '@deepseek-ai/dsh-settings', '@deepseek-ai/schemastery'],
    },
    companions: [
      {
        // 同步 CSS 安全算法（lightningcss）。宿主半区不再携带它（issue #98）：
        // 宿主经 worker 调用，CLI 与市场构建经 ./css-safety 子路径调用。
        name: '@linxin666/dsh-client-ui-skin-center/css-safety',
        entry: { 'css-safety': 'src/core/css-safety/transform.ts' },
        outDir: 'lib',
        format: ['esm'],
        platform: 'node',
        target: 'es2024',
        fixedExtension: false,
        dts: false,
        clean: false,
        // lightningcss 带 native binding：bundle 保留 import，运行时从
        // node_modules 解析 .node 文件。
        external: ['lightningcss'],
      },
      {
        // 承载 native addon 的短生命周期 worker 进程入口。
        name: '@linxin666/dsh-client-ui-skin-center/css-safety-worker',
        entry: { 'css-safety-worker': 'src/core/css-safety/worker-entry.ts' },
        outDir: 'lib',
        format: ['esm'],
        platform: 'node',
        target: 'es2024',
        fixedExtension: false,
        dts: false,
        clean: false,
        external: ['lightningcss'],
      },
    ],
  },
)
