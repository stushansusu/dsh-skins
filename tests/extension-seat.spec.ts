import { describe, expect, it } from 'vitest'
import { installSkinCenterSeat } from '../src/client/extension-seat.ts'

describe('Skin Center extension seat', () => {
  it('moves one entry between standalone settings and Web Extensions', () => {
    let service: object | undefined
    let changed: (() => void) | undefined
    const registered: Array<{ options: Record<string, unknown>; component: unknown }> = []
    const component = () => null
    const ctx = {
      get: () => service,
      on: (_event: string, listener: () => void) => { changed = listener; return () => { changed = undefined } },
      slots: {
        spec: () => ({ kind: 'keyed', scope: 'root' }),
        entries: (seat: string) => registered.filter(entry => entry.options.name === seat),
        register: (options: Record<string, unknown>, child: unknown) => {
          const entry = { options, component: child }
          registered.push(entry)
          changed?.()
          return () => {
            const index = registered.indexOf(entry)
            if (index >= 0) registered.splice(index, 1)
            changed?.()
          }
        },
      },
    }
    const dispose = installSkinCenterSeat(ctx as never, {
      inject: () => ({}),
      label: () => 'Skins',
      component,
    } as never)
    expect(registered[0]?.options).toMatchObject({ name: 'settings.section', id: 'skin-center', order: 120 })

    service = {
      sectionId: 'web-ui-plugins',
      open: () => true,
      registerPage: (page: Record<string, unknown>) => {
        const entry = {
          options: {
            name: 'web-ui.extension',
            key: page.key,
            locale: page.locale,
            inject: page.inject,
            children: page.children,
          },
          component,
        }
        registered.push(entry)
        changed?.()
        return () => {
          const index = registered.indexOf(entry)
          if (index >= 0) registered.splice(index, 1)
          changed?.()
        }
      },
    }
    changed?.()
    expect(registered).toHaveLength(1)
    expect(registered[0]?.options).toMatchObject({ name: 'web-ui.extension', key: 'skin-center' })
    expect(registered[0]?.options).not.toHaveProperty('id')
    expect(registered[0]?.options).not.toHaveProperty('order')
    expect(registered[0]?.options).not.toHaveProperty('label')

    service = undefined
    changed?.()
    expect(registered).toHaveLength(1)
    expect(registered[0]?.options).toMatchObject({ name: 'settings.section', id: 'skin-center' })
    dispose()
    expect(registered).toHaveLength(0)
  })
})
