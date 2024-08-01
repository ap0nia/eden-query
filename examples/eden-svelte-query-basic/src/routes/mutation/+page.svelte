<script lang="ts">
  import { eden } from '$lib/eden'

  const todos = eden.api.todos.get.createQuery({})

  const addTodo = eden.api.todos.post.createMutation()

  const deleteTodo = eden.api.todos.delete.createMutation()

  const utils = eden.getContext()

  let content = ''

  async function handleAddTodo() {
    await $addTodo.mutateAsync({ completed: false, content })
    await utils.api.todos.get.invalidate()
    content = ''
  }

  async function handleDeleteTodo(id: string) {
    await $deleteTodo.mutateAsync(id)
    await utils.api.todos.get.invalidate()
  }
</script>

<main>
  <h1>Todos:</h1>

  <ul>
    {#each $todos.data ?? [] as todo}
      <li style="display: flex; align-items: center; gap: 1rem">
        <input type="checkbox" checked={todo.completed} />
        <p>{todo.content}</p>
        <button on:click|preventDefault={async () => await handleDeleteTodo(todo.id)}>
          Delete
        </button>
      </li>
    {/each}
  </ul>

  <form on:submit={handleAddTodo}>
    <input type="text" bind:value={content} />
    <button>Add Todo</button>
  </form>
</main>
