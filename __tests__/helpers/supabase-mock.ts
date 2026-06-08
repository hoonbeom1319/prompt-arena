import { vi } from 'vitest'

type TableHandler = {
  single?: () => Promise<{ data: unknown; error: unknown }>
  count?: () => { count: number | null; error: unknown }
  insert?: () => Promise<{ data: unknown; error: unknown }>
  update?: () => { error: unknown }
  data?: () => Promise<{ data: unknown[]; error: unknown }>
}

function createBuilder(handler: TableHandler) {
  let isCountQuery = false
  let isInsert = false

  const builder: Record<string, unknown> = {}

  const chainMethods = ['select', 'eq', 'not', 'order', 'limit', 'in', 'lt', 'is']
  for (const method of chainMethods) {
    builder[method] = vi.fn((...args: unknown[]) => {
      if (method === 'select' && args[1] && typeof args[1] === 'object' && (args[1] as Record<string, unknown>).count) {
        isCountQuery = true
      }
      return builder
    })
  }

  builder['single'] = vi.fn(() => {
    if (isInsert) return handler.insert?.() ?? Promise.resolve({ data: null, error: null })
    return handler.single?.() ?? Promise.resolve({ data: null, error: null })
  })

  builder['insert'] = vi.fn(() => {
    isInsert = true
    return builder
  })

  builder['update'] = vi.fn(() => {
    return { eq: vi.fn(() => handler.update?.() ?? { error: null }) }
  })

  // Make builder thenable so it can be awaited directly (for count/list queries)
  builder['then'] = (resolve: (value: unknown) => unknown, reject: (reason: unknown) => unknown) => {
    let result: unknown
    if (isCountQuery) {
      result = handler.count?.() ?? { count: 0, error: null }
    } else {
      result = handler.data?.() ?? { data: [], error: null }
    }
    return Promise.resolve(result).then(resolve, reject)
  }

  return builder
}

export function createSupabaseMock(config: {
  user?: { id: string } | null
  tables?: Record<string, TableHandler>
}) {
  const user = config.user ?? null
  const tables = config.tables ?? {}

  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user },
        error: user ? null : new Error('not authenticated'),
      }),
    },
    from: vi.fn((table: string) => {
      const handler = tables[table] ?? {}
      return createBuilder(handler)
    }),
  }
}
