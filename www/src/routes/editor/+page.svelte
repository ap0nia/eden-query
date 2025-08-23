<script lang="ts">
  import Editor from '$lib/components/editor.svelte'
  import { PageSearcher } from '$lib/rspress-theme-default/components/Search/logic/search'

  let initialized = $state(false)

  let timeout: ReturnType<typeof setTimeout>

  let value = $state('')

  const pageSearcher = new PageSearcher({
    currentLang: '',
    currentVersion: '',
  })

  async function search() {
    const result = await pageSearcher.match(value)

    console.log(result)
  }

  $effect(() => {
    pageSearcher.init().then(() => {
      initialized = true
    })
  })

  $effect(() => {
    if (!initialized || !value) {
      return
    }

    clearTimeout(timeout)

    timeout = setTimeout(search)
  })
</script>

<main class="flex min-h-dvh items-center justify-center">
  <textarea bind:value></textarea>
  <Editor />
</main>
