<script lang="ts" module>
  export { default as a } from './a.svelte'
  export { default as blockquote } from './blockquote.svelte'
  export { default as code } from './code.svelte'
  export { default as h1 } from './h1.svelte'
  export { default as h2 } from './h2.svelte'
  export { default as h3 } from './h3.svelte'
  export { default as h4 } from './h4.svelte'
  export { default as h5 } from './h5.svelte'
  export { default as h6 } from './h6.svelte'
  export { default as hr } from './hr.svelte'
  export { default as img } from './img.svelte'
  export { default as li } from './li.svelte'
  export { default as ol } from './ol.svelte'
  export { default as p } from './p.svelte'
  export { default as pre } from './pre.svelte'
  export { default as table } from './table.svelte'
  export { default as td } from './td.svelte'
  export { default as th } from './th.svelte'
  export { default as tr } from './tr.svelte'
  export { default as ul } from './ul.svelte'
</script>

<script lang="ts">
  import type { Snippet } from 'svelte'

  import { cn } from '$lib/utils/cn'

  import Editor from '../editor.svelte'

  interface Metadata {
    content?: string
    lastUpdated?: number
  }

  interface $$Props {
    metadata?: Metadata
    children?: Snippet
  }

  let { children, ...rest }: $$Props = $props()

  let editing = $state(false)

  const formatter = new Intl.DateTimeFormat(undefined, {
    dateStyle: 'short',
    timeStyle: 'short',
  })

  function toggleEditing() {
    editing = !editing
  }

  $inspect({ rest })
</script>

<!--

@component

MDSX blueprint for documentation pages.

@see https://mdsx.dev/docs/concepts/blueprints

-->

<div class="flex min-h-dvh flex-col items-center justify-center gap-2 p-4">
  {#if editing}
    <div class="w-full">
      <Editor defaultValue={rest.metadata?.content} onMessage={console.log} />
    </div>
  {:else}
    <div class="w-full">
      <div>
        {@render children?.()}
      </div>
    </div>
  {/if}

  <div class="flex w-full items-center justify-between">
    <button class="btn btn-outline" onclick={toggleEditing}>
      <span>{editing ? 'Cancel editing' : 'Edit'}</span>
      <span class={cn(editing ? 'icon-[mdi--close]' : 'icon-[mdi--edit]')}></span>
    </button>

    <time class="text-base-content/70 text-sm">
      {formatter.format(rest.metadata?.lastUpdated)}
    </time>
  </div>

  <div class="divider"></div>

  <div class="grid w-full grid-cols-2 gap-2">
    <a href="/" class="btn btn-outline h-auto flex-col items-start py-2 font-normal">
      <p class="text-base-content/70 text-sm">Previous page</p>
      <p class="text-lg font-semibold">Getting Started</p>
    </a>

    <a href="/" class="btn btn-outline col-start-2 h-auto flex-col items-end py-2 font-normal">
      <p class="text-base-content/70 text-sm">Next page</p>
      <p class="text-lg font-semibold">Quick start</p>
    </a>
  </div>
</div>
