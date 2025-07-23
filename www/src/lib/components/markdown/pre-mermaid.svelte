<script lang="ts">
  import mermaid from 'mermaid'
  import { resource } from 'runed'
  import type { HTMLAttributes } from 'svelte/elements'

  import type _PreCode from '$lib/components/markdown/pre-code.svelte'

  interface $$Props extends HTMLAttributes<HTMLElement> {}

  const id = $props.id()

  let ref = $state<HTMLElement>()

  /**
   * Although it is technically possible to access the original code block by
   * viewing the Markdown content in context with the `start` and `end` offsets,
   * it is simpler to read from the rendered content.
   *
   * @see {_PreCode} for examples of introspecting and manipulating the original content.
   */
  const content = $derived(ref?.textContent)

  const svgResource = resource(
    () => content,
    async (textContent, _previousTextContent, _options) => {
      // Strategy for rendering Mermaid content.
      // @see https://github.com/lobehub/lobe-ui/blob/29e15bc8dfcf73f42b8f12d9b40d83328a59dde0/src/Mermaid/SyntaxMermaid/index.tsx#L38-L67

      if (!textContent) return ''

      const renderResult = await mermaid.render(id, textContent)

      return renderResult.svg
    },
  )

  let { children, ...rest }: $$Props = $props()
</script>

<div {...rest} class="">
  <pre class="hidden" bind:this={ref}>{@render children?.()}</pre>
  <!-- eslint-disable-next-line svelte/no-at-html-tags -->
  {@html svgResource.current}
</div>
