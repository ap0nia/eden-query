import { useState } from 'react'

import { eden } from '../../lib/eden'

export default function Page() {
  const todos = eden.api.todos.get.useQuery()

  const addTodo = eden.api.todos.post.useMutation()

  const deleteTodo = eden.api.todos.delete.useMutation()

  const utils = eden.useUtils()

  const [content, setContent] = useState('')

  const handleAddTodo = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    await addTodo.mutateAsync({ completed: false, content })
    await utils.api.todos.get.invalidate()
    setContent('')
  }

  const handleDeleteTodo = async (id: string) => {
    await deleteTodo.mutateAsync(id)
    await utils.api.todos.get.invalidate()
  }

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setContent(event.target.value)
  }

  return (
    <main>
      <h1>Todos:</h1>

      <ul>
        {todos.data?.map((todo) => {
          return (
            <li key={todo.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <input type="checkbox" defaultChecked={todo.completed} />
              <p>{todo.content}</p>
              <button onClick={async () => await handleDeleteTodo(todo.id)}>Delete</button>
            </li>
          )
        })}
      </ul>

      <form onSubmit={handleAddTodo}>
        <input type="text" value={content} onChange={handleInputChange} />
        <button>Add Todo</button>
      </form>
    </main>
  )
}
