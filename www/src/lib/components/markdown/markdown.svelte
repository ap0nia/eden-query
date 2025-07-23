<script lang="ts">
  import type { Element, Raw, Root, RootContent, Text } from 'hast'
  import type { HTMLAttributes } from 'svelte/elements'
  import { VFile } from 'vfile'

  import { browser } from '$app/environment'
  import Markdown, * as markdown from '$lib/components/markdown'
  import { emitter, postMessage, setMarkdownContext } from '$lib/components/markdown/context'
  import { MDSX_FLOATING_COMPONENT_NAME } from '$lib/mdsx/constants'
  import * as FloatingRendererSvelte from '$lib/mdsx/floating-renderer-svelte-components'
  import { highlighter } from '$lib/shiki'
  import { parseAndRunSync } from '$lib/unified/processor'
  import type { remarkCodeMeta as _remarkCodeMeta } from '$lib/unified/remark-code-meta'
  import type { UnifiedOutgoingMessage } from '$lib/workers/unified'

  interface $$Props extends Omit<HTMLAttributes<HTMLElement>, 'children'> {
    /**
     */
    content?: string | null

    /**
     */
    children?: (Root | RootContent)[]

    /**
     */
    vfile?: VFile

    /**
     * @default true
     */
    workerEnabled?: boolean

    /**
     * Fallback to rendering the raw Markdown content if it has not been parsed.
     */
    showFallback?: string
  }

  const clientId = $props.id()

  let {
    content = $bindable(),

    vfile = content ? new VFile() : undefined,

    // On the server, if this is the root, then parse the children synchronously.
    // On the client, asynchronously trigger the task.
    children = browser ? [] : [parseAndRunSync(content, vfile)],

    workerEnabled = true,

    showFallback,

    ...rest
  }: $$Props = $props()

  /**
   * In the browser, we need to trigger an initial, asynchronous parse.
   * On the server, the content has already been parsed synchronously.
   */
  let previouslyParsedContent = $state(browser ? '' : content)

  // Only set context at the root.
  // The root Markdown component is the only component in the tree with non-empty content.

  if (content) {
    setMarkdownContext({
      get vfile() {
        return vfile
      },
      get content() {
        return content
      },
      set content(value) {
        content = value
      },
      postMessage(message) {
        return postMessage({ ...message, clientId }, workerEnabled)
      },
    })
  }

  $effect(() => {
    if (!content) return

    const listener = (event: MessageEvent<UnifiedOutgoingMessage>) => {
      switch (event.data.type) {
        case 'parse-and-run': {
          vfile = event.data.vfile

          if (event.data.tree) {
            children = [event.data.tree]
          }

          content = event.data.vfile?.value.toString()

          previouslyParsedContent = content

          return
        }

        default: {
          return
        }
      }
    }

    emitter.addScopedEventListener(clientId, 'message', listener)

    return () => {
      emitter.addScopedEventListener(clientId, 'message', listener)
    }
  })

  $effect(() => {
    if (!content) return

    /**
     * When the Markdown content is parsed, every encountered language is captured in the VFile data.
     * If this specific parsed Markdown contains a newly loaded language, then the content needs to be re-parsed.
     *
     * @see {_remarkCodeMeta} for implementation details of storing languages.
     */
    const handleLoadedLanguages = async (...languages: string[]) => {
      const markdownHasLanguage = vfile?.data.langs?.has.bind(vfile.data.langs)

      if (markdownHasLanguage == null) {
        return
      }

      const markdownHasLoadedLanguage = languages.some(markdownHasLanguage)

      if (!markdownHasLoadedLanguage) {
        return
      }

      await postMessage(
        { type: 'load-language', languages: languages as any, clientId },
        workerEnabled,
      )

      // Since content should never be empty at the root, this should force a re-render.
      previouslyParsedContent = ''
    }

    const unsubscribe = highlighter.on('languageLoaded', handleLoadedLanguages)

    return unsubscribe
  })

  $effect(() => {
    if (content && content !== previouslyParsedContent) {
      postMessage({ type: 'parse-and-run', content, vfile, clientId }, workerEnabled)
    }
  })

  /**
   * TODO: Figure out what to do when toggling worker.
   * The worker and application have separate instances of Twoslash, Shiki highlighter, etc.
   * Migration/synchronization procedure needs to occur when switching contexts.
   */

  $effect(() => {
    if (!content) return

    // Synchronize the in-memory highlighter with the worker's highlighter.
    if (workerEnabled) {
      postMessage({ type: 'load-language', languages: highlighter.getLoadedLanguages() as any })
    } else {
      // noop
    }
  })
</script>

<!--

@component

Renders markdown from a markdown content string or the parsed HTML AST (i.e. hast) from a markdown content string.

This component handles two distinct roles.

1. Parse a raw Markdown content string into tokens (HAST, HTML AST).
2. Render HAST tokens.

The first responsibility is delegated to the "root", and the latter to the "renderer."

While these should be implemented as distinct components,
the functionality has been consolidated and the "root" will be designated
as the only component in the tree with non-empty content.

All nested instances of this component will only be given tokens to render.

-->

{#snippet floatingElement(child: Element)}
  <FloatingRendererSvelte.root {...child.properties as any}>
    <Markdown
      {...rest}
      children={child.children[0]?.type === 'element' ? child.children[0].children : []}
    />

    {#snippet popper()}
      <Markdown
        {...rest}
        children={child.children[2]?.type === 'element' ? child.children[2].children : []}
      />
    {/snippet}
  </FloatingRendererSvelte.root>
{/snippet}

{#snippet htmlElement(child: Element)}
  {@const Component = markdown[child.tagName as keyof typeof markdown]}

  {#if Component}
    <Component {...rest} {...child.properties as any} {...child.data}>
      <Markdown children={child.children} {...rest} />
    </Component>
  {:else}
    <svelte:element this={child.tagName} {...rest} {...child.properties} {...child.data}>
      <Markdown children={child.children} {...rest} />
    </svelte:element>
  {/if}
{/snippet}

{#snippet fallback()}
  <div class="markdown-fallback whitespace-pre-wrap">
    {content}
  </div>
{/snippet}

{#snippet root(child: Root)}
  {#if content}
    <div class="vp-doc markdown contents">
      <Markdown children={child.children} {...rest} />
    </div>
  {:else}
    <Markdown children={child.children} {...rest} />
  {/if}
{/snippet}

{#snippet element(child: Element)}
  {#if child.tagName === `${MDSX_FLOATING_COMPONENT_NAME}.root`}
    {@render floatingElement(child)}
  {:else}
    {@render htmlElement(child)}
  {/if}
{/snippet}

{#snippet text(child: Text)}
  {child.value}
{/snippet}

{#snippet raw(child: Raw)}
  <!-- eslint-disable-next-line svelte/no-at-html-tags -->
  {@html child.value}
{/snippet}

{#if showFallback && content && !children.length}
  {@render fallback()}
{:else}
  {#each children as child, index (index)}
    {#if child.type === 'root'}
      {@render root(child)}
    {:else if child.type === 'element'}
      {@render element(child)}
    {:else if child.type === 'text'}
      {@render text(child)}
    {:else if child.type === 'raw'}
      {@render raw(child)}
    {/if}
  {/each}
{/if}
