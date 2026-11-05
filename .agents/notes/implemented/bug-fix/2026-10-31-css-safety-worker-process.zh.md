# Agent Note: CSS 安全转换在短生命周期 worker 进程中运行

Status: implemented

## Problem

皮肤中心的 CSS 安全管线在宿主半区顶层导入了 lightningcss（`src/core/css-safety/transform.ts`）。lightningcss 带原生 addon，加载该模块会把 `lightningcss.win32-x64-msvc.node` 映射进 DSH 宿主进程。

Windows 不允许替换已被映射的文件：宿主持有 addon 期间，插件管理器安装任何插件都会失败，报 `[ERR_PNPM_EPERM] ... rename 'lightningcss-win32-x64-msvc_tmp_...' -> 'lightningcss-win32-x64-msvc'`——宿主阻断了自己的插件安装，且只要宿主不退出就持续复现（issue #98）。

把加载改成懒加载只会推迟失败：一旦服务任意皮肤样式表（激活皮肤正是如此），addon 依然映射在宿主进程里。

## Decision

转换在短生命周期 worker 进程中执行，宿主半区永不导入 lightningcss。

- 模块拆分：`src/core/css-safety/errors.ts` 与 `src/core/css-safety/types.ts` 承载契约且不含任何 lightningcss 导入；`src/core/css-safety/transform.ts` 保留算法，只能经新的 `./css-safety` 导出触达；`src/core/css-safety/host-transform.ts` 是宿主调度器；`src/core/css-safety/worker-entry.ts` 是子进程入口。
- 每个请求一个 worker：宿主 fork worker（`child_process.fork`、`ELECTRON_RUN_AS_NODE=1`、`execArgv: []`），worker 路径按模块 URL 解析而非按工作目录，并经 IPC 处理一份样式表。worker 加载 lightningcss、应答、退出。
- 应答前等待退出：收到应答（结果、白名单违规或失败）后，宿主在 worker 仍存活时终止它，并且只在 worker 进程退出之后才结算请求，因此不会有转换比它的响应活得更久。
- 管线归属于单个插件挂载：挂载时创建调度器、将其转换注入路由工厂，并随挂载一起释放。因此重新挂载会得到自己的管线，旧挂载的释放无法让新挂载失效。进程退出钩子由存活中的管线共享，最后一个管线释放时即被移除，因此重新挂载不会累积监听器。
- 有界管线：管线串行处理请求，最多同时持有 8 个——包含正在执行的那个与等待中的每一个。超出该上限的请求立即以类型化的过载错误拒绝（HTTP 层为 503），绝不排进无界队列。
- 有界失败：每个请求有 10 秒预算，覆盖排队等待、转换与结算。该预算也覆盖「已应答但拒绝退出」的 worker：迟到的应答绝不成为结果，无法被杀死的 worker 也无法让请求悬挂。无法启动的 worker 会立即让请求失败，而不是等到预算耗尽。
- 释放：dispose 会拒绝排队中的请求、终止正在执行的 worker、等待其退出，且不留下任何 worker。
- 消费方：包根不再导出转换；CLI 与市场构建改用专门的 `./css-safety` 子路径，市场构建对较旧的已发布包回退到包根。

白名单失败语义不变：白名单违规是带违规列表的 422，其他转换失败是 500。违规由稳定的 kind 标记加 violations 列表共同判定，因此仅仅携带 `violations` 数组的无关错误仍是 500，而不会被误报成 422。

## Alternatives considered

**在宿主进程内懒加载 lightningcss。** 第一次转换仍会把 addon 映射进宿主，且映射会一直保留到宿主退出。它把「启动即失败」变成「激活皮肤即失败」，更难排查，同样阻断安装。

**在宿主进程内缓存转换结果。** 私有缓存只省重复计算，不会消除映射：第一次转换仍会在宿主进程加载 addon。它还会改变管线契约（结果可能过期），却完全不触及所报故障。

**常驻一个 worker。** 长驻 worker 在整个会话期间持有 addon，等于同样的故障外加一个需要监管的进程。只有当原生模块能被卸载时才可接受，而它不能。

**在非 Windows 平台仍于宿主进程内转换。** 两条代码路径意味着两套需要同步的行为，而所报故障并非「已映射文件出问题的唯一平台」。一条路径比两条更容易推理。

## Consequences

- 宿主进程不再加载 lightningcss，包管理器因此可以在宿主运行期间替换解析器包。`tests/css-safety-worker.spec.ts` 的探针固化了这一点：它在独立进程中通过已构建的宿主 bundle 服务一份样式表，并断言该进程内不出现任何 lightningcss 模块。
- 接受的残余窗口：一次转换进行期间，worker 进程持有 addon，正落在该窗口内的包安装在 Windows 上仍会看到已映射的 addon。该窗口只有一次样式表转换的时长；宿主进程自身从不持有它。
- 样式表路由变为异步。HTTP 应答不变（200 且字节相同、白名单违规 422、转换失败 500），但请求现在要等待一次 worker 往返，而不是阻塞宿主事件循环。
- 超过 8 个样式表请求的突发流量中，超出上限的请求以 503 拒绝，需要客户端重试。
- CLI 与市场构建从 `./css-safety` 读取转换；包根保留契约面（校验、目录册、provenance）与调度器类。
