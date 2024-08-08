import { batchPlugin, transformPlugin } from '@ap0nia/eden-react-query'
import { cors } from '@elysiajs/cors'
import { Elysia, t } from 'elysia'
import SuperJSON from 'superjson'

const names = [
  'Kevin',
  'Elysia',
  'Aponia',
  'Eden',
  'Vill-V',
  'Kalpas',
  'Su',
  'Sakura',
  'Kosma',
  'Mobius',
  'Grise',
  'Hua',
  'Pardofelis',
]

export const pages = [
  [1, 2, 3],
  [4, 5, 6],
  [7, 8, 9],
  [10, 11, 12],
]

type Todo = {
  id: string
  completed: boolean
  content: string
}

/**
 * Example, in-memory database.
 */
const db = {
  todos: [] as Todo[],
}

function createRandomId() {
  return Math.random()
    .toString(36)
    .replace(/[^a-z]+/g, '')
    .slice(2, 10)
}
/**
 * Actual route handlers.
 */
const rootController = new Elysia()
  .get('/', () => {
    return 'Hello, React!'
  })
  .get('/bye', () => {
    return 'Goodbye, React!'
  })
  .get(
    '/names',
    (context) => {
      const search = context.query.search

      if (search == null) return names

      return names.filter((name) => name.toLowerCase().includes(search.toLowerCase()))
    },
    {
      query: t.Object({
        search: t.Optional(t.String()),
      }),
    },
  )
  .get('/sleep', async () => {
    await new Promise((resolve) => setTimeout(resolve, 5000))
    return 'OK'
  })
  .get('/todos', () => {
    return db.todos
  })
  .post(
    '/todos',
    (context) => {
      const id = createRandomId()
      const newTodo: Todo = { id, ...context.body }
      db.todos = [...db.todos, newTodo]
    },
    {
      body: t.Object({
        completed: t.Boolean(),
        content: t.String(),
      }),
    },
  )
  .delete(
    '/todos',
    (context) => {
      const id = context.body
      db.todos = db.todos.filter((t) => t.id !== id)
    },
    {
      body: t.String(),
    },
  )
  .get(
    '/pages',
    (context) => {
      return pages[context.query.cursor ?? 0]
    },
    {
      query: t.Object({
        cursor: t.Optional(t.Number()),
      }),
    },
  )
  .get('/posts', () => [])

export const app = new Elysia({ prefix: '/api' })
  .use(cors())
  .use(transformPlugin(SuperJSON))
  /**
   * Use the batch plugin after all transforms have been defined so it inherits them.
   */
  .use(batchPlugin())
  .use(rootController)

export type App = typeof app
