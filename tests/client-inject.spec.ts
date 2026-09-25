/**
 * The skin-center client plugin's Cordis contract (regression guard).
 *
 * The browse-directory button resolves the Host's native picker through the
 * generated Remote namespace service `remote.directoryPicker`. That is its
 * own Cordis service, NOT a property of `remote`: reading `ctx.remote.x`
 * while `remote.x` is not injected makes cordis' context proxy throw
 * `cannot get property "remote.x" without inject`. That is exactly the
 * "could not open the system folder picker" failure reported after clicking
 * Browse, so these tests pin both the declaration and the resolved call.
 *
 * The topology below mirrors the real one: the api-gateway provides
 * `remote`, and the api-remotes assembly mounts the picker namespace as a
 * NESTED fiber beneath it.
 */
import { Context, Service } from '@deepseek-ai/cordis'
import { describe, expect, it } from 'vitest'
import { inject } from '../src/client/index.ts'

class RemoteService extends Service {
  constructor(ctx: Context) { super(ctx, 'remote') }
}

/** The stub service tree the client plugin declares; only the remote faces matter. */
const STUB_SERVICES: Record<string, unknown> = {
  slots: { inject: () => () => {}, register: () => () => {} },
  locale: { bind: () => (key: string) => key },
  theme: {
    getTheme: () => ({ active: { colorScheme: 'dark' } }),
    subscribe: () => () => {},
    setTheme: () => {},
  },
  configForms: {
    describe: () => ({ getSnapshot: () => ({ view: { namespaces: [] } }) }),
    get: () => ({
      getSnapshot: () => ({ status: 'ready', value: {}, revision: 0 }),
      subscribe: () => () => {},
      set: async () => true,
      mutate: async () => true,
    }),
  },
  connection: {},
}

/** Mount the gateway + api-remotes topology and run one consumer plugin. */
async function withPickerTopology(run: (ctx: Context) => void): Promise<void> {
  const root = new Context()
  await root.plugin({
    name: 'stubs',
    apply(ctx) {
      new RemoteService(ctx)
      for (const [name, value] of Object.entries(STUB_SERVICES)) ctx.provide(name, value as never)
    },
  })
  const remotes = root.plugin({
    name: 'api-remotes',
    inject: ['remote'],
    apply(ctx) {
      ctx.plugin({
        name: 'remote.directoryPicker',
        apply(child) {
          child.provide('remote.directoryPicker', {
            pick: async () => '/Users/me/wallpapers',
          } as never)
        },
      })
    },
  })
  await remotes
  await new Promise(resolve => setTimeout(resolve, 30))
  const consumer = root.plugin({ name: 'skin-center', inject: [...inject], apply: run })
  await consumer
  await new Promise(resolve => setTimeout(resolve, 30))
}

describe('skin-center client injects the Remote faces it calls', () => {
  it('names remote.directoryPicker so ctx.remote.directoryPicker is readable', () => {
    // Given the plugin's declared required services
    // When the declaration is read
    // Then the picker namespace is named explicitly: without it, cordis
    // refuses the property lookup and the browse button can never work
    expect(inject).toContain('remote.directoryPicker')
  })

  it('resolves the picker through the real nested-namespace topology', async () => {
    // Given the gateway/api-remotes topology that mounts the namespace
    let picked: string | null = null
    let failure: string | null = null
    await withPickerTopology((ctx) => {
      try {
        // When the plugin calls the picker exactly as its pickDir face does
        void ctx.remote.directoryPicker.pick().then(
          (path) => { picked = path },
          (error: unknown) => { failure = error instanceof Error ? error.message : String(error) },
        )
      } catch (error) {
        failure = error instanceof Error ? error.message : String(error)
      }
    })

    // Then the call reaches the Host instead of throwing the inject error
    expect(failure).toBeNull()
    expect(picked).toBe('/Users/me/wallpapers')
  })
})
