import { cors } from '@elysiajs/cors'
import { batchPlugin } from '@elysiajs/eden-react-query'
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

export const app = new Elysia({ prefix: '/api' })
  /**
   * De-serialize incoming JSON data from the client using SuperJSON.
   */
  .onParse(async (context) => {
    if (context.contentType !== 'application/json') return

    const json = await context.request.json()

    return await SuperJSON.deserialize(json)
  })
  /**
   * Serialize outgoing JSON data from the server using SuperJSON.
   */
  .mapResponse((context) => {
    // if (typeof context.response !== 'object') return

    if (context.response instanceof Response) return

    const serializedResponse = SuperJSON.serialize(context.response)

    const text = JSON.stringify(serializedResponse)

    return new Response(text, {
      headers: {
        'Content-Type': 'application/json',
      },
    })
  })
  .use(cors())
  /**
   * Use the batch plugin after all transforms have been defined so it inherits them.
   */
  .use(batchPlugin())
  .use(rootController)

export type App = typeof app
