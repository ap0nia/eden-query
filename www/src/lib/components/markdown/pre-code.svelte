<script lang="ts" module>
  export const twoslashLangs = ['ts', 'tsx', 'typescript']

  export const codeBlockStartRegex = /```(\w+)/
</script>

<script lang="ts">
  import { bundledLanguagesInfo } from 'shiki'
  import { tick } from 'svelte'
  import type { HTMLAttributes } from 'svelte/elements'
  import { slide } from 'svelte/transition'

  import CopyButton from '$lib/components/copy-button.svelte'
  import TwoslashIcon from '$lib/components/icons/twoslash.svelte'
  import { getMarkdownContext } from '$lib/components/markdown/context'
  import * as Command from '$lib/components/ui/command'
  import * as Popover from '$lib/components/ui/popover'
  import { aliasLanguages } from '$lib/shiki'
  import type { remarkCodeMeta as _remarkCodeMeta } from '$lib/unified/remark-code-meta'
  import type { remarkWysiwyg as _remarkWysiwyg } from '$lib/unified/remark-wysiwyg'
  import { cn } from '$lib/utils/cn'

  interface $$Props extends HTMLAttributes<HTMLElement> {
    /**
     * Whether to show a header with a title and code-block actions.
     *
     * @default true
     */
    showHeader?: boolean

    /**
     * Explicit trigger for Twoslash.
     *
     * @example
     * ```ts twoslash
     * const variable = 123
     * ```
     */
    twoslash?: boolean

    /**
     * The start offset of the code block in the original, pre-processed content.
     *
     * @see {_remarkCodeMeta} for implementation details of preserving the start offset.
     *
     * Note that {@link _remarkWysiwyg} will pre-process the original content.
     * The offset should be relative to this updated content.
     */
    start?: string

    /**
     * The end offset of the code block in the original, pre-processed content.
     *
     * @see {_remarkCodeMeta} for implementation details of preserving the end offset.
     *
     * Note that {@link _remarkWysiwyg} will pre-process the original content.
     * The offset should be relative to this updated content.
     */
    end?: string
  }

  let { children, showHeader = true, ...rest }: $$Props = $props()

  let ref = $state<HTMLElement>()

  let collapsed = $state(false)

  let timeout: ReturnType<typeof setTimeout> | undefined

  const context = getMarkdownContext()

  let open = $state(false)

  let triggerRef = $state<HTMLButtonElement>(null!)

  const dataAttributes = $derived.by(() => {
    const propEntries = Object.entries(rest)

    const dataAttributeEntries = propEntries.filter((entry) => entry[0].startsWith('data-'))

    return Object.fromEntries(dataAttributeEntries)
  })

  /**
   * Whether Twoslash has been toggled dynamically and is currently loading.
   *
   * It will be toggled on after a Twoslash request is made, and will not reset until this component
   * re-renders with the {@link rest.twoslash} boolean flag active.
   *
   * It will always default to false. But capturing {@link rest.twoslash} in the $derived
   * expression will allow this value to be automatically updated.
   */
  let twoslashLoading = $derived(rest.twoslash ? false : false)

  let lang = $derived((rest.lang && aliasLanguages.get(rest.lang)) || rest.lang)

  const langInfo = $derived(
    bundledLanguagesInfo.find((info) => info.name === lang || info.id === lang),
  )

  const title = $derived(rest.title?.toString()?.replace(/^"(.*)"$/, '$1') || lang)

  const start = $derived.by(() => {
    const maybeStart = Number(rest.start)
    return Number.isNaN(maybeStart) ? undefined : maybeStart
  })

  const end = $derived.by(() => {
    const maybeEnd = Number(rest.end)
    return Number.isNaN(maybeEnd) ? undefined : maybeEnd
  })

  // const resolvedShowHeader = $derived(false)

  const resolvedShowHeader = $derived(showHeader == null ? Boolean(title) : showHeader)

  const canTwoslash = $derived(
    start != null && end != null && lang && twoslashLangs.includes(lang?.toLowerCase()),
  )

  /**
   * Extract the code block from the current raw Markdown content.
   *
   * The challenge is that everything has been parsed, and possibly by Shiki which will
   * strip positional information since it modifies the tree.
   *
   * Try to preserve the positional information via the meta string, and then
   * introspect the current content.
   *
   * The "code start" is the line that contains all the attributes for the block.
   *
   * @example "```ts title=my_custom_title lang=code_language twoslash"
   */
  function extractCodeStart() {
    if (context?.content == null) {
      console.log('No content found')
      return
    }

    if (start == null || end == null) {
      console.log('Position not found', { start, end })
      return
    }

    const code = context.content.slice(start, end).toString()

    if (!code.startsWith('```')) {
      console.log('Multiline code block not detected', code)
      return
    }

    let index = code.indexOf('\n')

    if (index < 0) {
      console.log('No newline detected')
      return
    }

    return { code, index, start, content: context.content }
  }

  async function handleLanguageChange(value: string) {
    lang = value

    const codeStart = extractCodeStart()

    if (!codeStart) return

    const { code, index, content, start } = codeStart

    let firstLine = code.slice(0, index)

    let sections = firstLine.split(' ')

    // Assert that the first section is the code block start.
    if (!sections[0]?.match(codeBlockStartRegex)) {
      console.log('Invalid starting block found')
      return
    }

    sections[0] = '```' + lang

    if (sections.includes('twoslash')) {
      twoslashLoading = true

      let lastLineIndex = code.lastIndexOf('```')

      const source = code.slice(index, lastLineIndex)

      await context.postMessage({ type: 'prepare-types', source })
    }

    firstLine = sections.join(' ')

    const updatedContent = content.slice(0, start) + firstLine + content.slice(start + index)

    context.content = updatedContent

    // We want to refocus the trigger button when the user selects
    // an item from the list so users can continue navigating the
    // rest of the form with the keyboard.

    open = false

    await tick()

    triggerRef.focus()
  }

  async function toggleTwoslash() {
    if (!canTwoslash) {
      console.log('Invalid Twoslash language', lang)
      return
    }

    const codeStart = extractCodeStart()

    if (!codeStart) return

    const { code, index, start, content } = codeStart

    let firstLine = code.slice(0, index)

    let sections = firstLine.split(' ')

    if (sections.includes('twoslash')) {
      sections = sections.filter((section) => section !== 'twoslash')
    } else {
      sections.push('twoslash')

      twoslashLoading = true

      let lastLineIndex = code.lastIndexOf('```')

      const source = code.slice(index, lastLineIndex)

      await context.postMessage({ type: 'prepare-types', source })
    }

    firstLine = sections.join(' ')

    const updatedContent = content.slice(0, start) + firstLine + content.slice(start + index)

    context.content = updatedContent

    clearTimeout(timeout)

    // Ensure that the loading state gets reset eventually.
    timeout = setTimeout(() => {
      twoslashLoading = false
    }, 10_000)
  }

  $effect(() => {
    return () => {
      clearTimeout(timeout)
    }
  })
</script>

<!-- The code inside may be subject to special white-space rules when rendering code blocks. -->
<div
  class={cn(
    rest.lang && `language-${rest.lang}`,
    'vp-adaptive-theme vp-code',
    'group/code',
    'relative my-4 w-full',
    'bg-base-200 text-base-content',
    'rounded-field border',
  )}
  {...dataAttributes}
>
  {#if resolvedShowHeader}
    <!-- @see https://github.com/yuyinws/vitepress-plugin-group-icons/blob/62c2cf203c6b4f001433089816b341403efefeba/src/codegen.ts#L8-L53 -->
    <!-- A .vp-code-block-title followed by data-title={name with icon} will have an icon applied. -->
    <div
      class={cn(
        'code-header vp-code-block-title',
        // 'bg-neutral',
        'rounded-t-field',
        'group-has-[[name=sticky-pin]:checked]/code:sticky',
        'top-0 z-10 flex items-center justify-between gap-4 border-b px-4 py-1 pr-2',
      )}
    >
      <div class="flex items-center">
        <div data-tip="Open/collapse code" class="tooltip">
          <label
            class="btn btn-square btn-ghost btn-sm group-has-[[name=collapsed-code]:checked]/code:btn-active"
          >
            <input
              name="collapsed-code"
              type="checkbox"
              class="peer hidden"
              bind:checked={collapsed}
            />
            <span class="icon-[mdi--chevron-down] transition-transform peer-checked:-rotate-180"
            ></span>
          </label>
        </div>

        {#if langInfo}
          <Popover.Root bind:open>
            <Popover.Trigger bind:ref={triggerRef} class="btn btn-sm">
              <span>{langInfo.name}</span>
              <span class="icon-[mdi--chevron-down]"></span>
            </Popover.Trigger>

            <Popover.Content class="p-0">
              <Command.Root value={lang || ''}>
                <Command.Input placeholder="Search framework..." />

                <Command.List>
                  <Command.Empty>No language found.</Command.Empty>

                  <Command.Group>
                    {#each bundledLanguagesInfo as info (info.id)}
                      <Command.Item
                        value={info.id}
                        onclick={handleLanguageChange.bind(null, info.id)}
                      >
                        {info.name}
                      </Command.Item>
                    {/each}
                  </Command.Group>
                </Command.List>
              </Command.Root>
            </Popover.Content>
          </Popover.Root>
        {:else}
          <span data-title={title} class="font-mono text-sm">{title}</span>
        {/if}
      </div>

      <div class="hover pointer-events-auto">
        {#if canTwoslash}
          <span data-tip="Toggle Twoslash" class="tooltip">
            <button
              onclick={toggleTwoslash}
              class="btn btn-outline btn-sm btn-square p-1"
              class:btn-active={Boolean(rest.twoslash)}
              class:disabled={twoslashLoading}
            >
              {#if twoslashLoading}
                <span class="loading"></span>
              {:else}
                <TwoslashIcon class="size-full" />
              {/if}
            </button>
          </span>
        {/if}

        <div data-tip="Pin header to the top" class="tooltip">
          <label
            class="btn btn-square btn-ghost btn-sm group-has-[[name=sticky-pin]:checked]/code:btn-active"
          >
            <input name="sticky-pin" type="checkbox" checked class="hidden" />
            <span class="icon-[mdi--pin]"></span>
          </label>
        </div>

        <div data-tip="Toggle line numbers" class="tooltip">
          <label
            class="btn btn-square btn-ghost btn-sm group-has-[[name=line-count]:checked]/code:btn-active"
          >
            <input name="line-count" type="checkbox" class="hidden" />
            <span class="icon-[mdi--format-list-numbered]"></span>
          </label>
        </div>

        <div data-tip="Toggle line wrap" class="tooltip">
          <label
            class="btn btn-square btn-ghost btn-sm swap group-has-[[name=wrap]:checked]/code:btn-active"
          >
            <input name="wrap" type="checkbox" class="hidden" />
            <span class="swap-on icon-[mdi--wrap]"></span>
            <span class="swap-off icon-[mdi--wrap-disabled]"></span>
          </label>
        </div>

        <div data-tip="Copy code" class="tooltip">
          <CopyButton {ref} class="!btn-ghost btn-sm" />
        </div>
      </div>
    </div>
  {/if}

  {#if !collapsed}
    <div class="relative overflow-hidden" transition:slide>
      <div class="peer/wrap overflow-x-auto py-4">
        <pre
          {...rest}
          class={cn(
            rest.class,
            'group-has-[[name=line-count]:checked]/code:line-count',
            'group-has-[[name=wrap]:checked]/code:whitespace-pre-wrap',
            '!bg-transparent text-sm',
            '!align-super',
            '[&_code]:block [&_code]:px-6',
          )}
          bind:this={ref}>{@render children?.()}</pre>
      </div>

      {#if !resolvedShowHeader}
        <div
          class="code-extras peer/actions pointer-events-none absolute top-0 left-0 flex w-full justify-end p-2 opacity-0 transition-opacity peer-hover/wrap:opacity-100 hover:opacity-100"
        >
          <div class="hover pointer-events-auto">
            <div data-tip="Toggle line numbers" class="tooltip">
              <label
                class="btn btn-square btn-outline btn-sm group-has-[[name=line-count]:checked]/code:btn-active"
              >
                <input name="line-count" type="checkbox" class="hidden" />
                <span class="icon-[mdi--format-list-numbered]"></span>
              </label>
            </div>

            <div data-tip="Toggle line wrap" class="tooltip">
              <label
                class="btn btn-outline btn-square btn-sm swap group-has-[[name=wrap]:checked]/code:btn-active"
              >
                <input name="wrap" type="checkbox" class="hidden" />
                <span class="swap-on icon-[mdi--wrap]"></span>
                <span class="swap-off icon-[mdi--wrap-disabled]"></span>
              </label>
            </div>

            <div data-tip="Copy code" class="tooltip">
              <CopyButton {ref} class="btn-sm btn-square !btn-outline" />
            </div>
          </div>
        </div>
        <div
          class="code-extras pointer-events-none absolute top-0 left-0 flex w-full justify-end p-2 transition-opacity peer-hover/actions:opacity-0 peer-hover/wrap:opacity-0 hover:opacity-0"
        >
          {#if lang}
            <span class={cn('text-xs')}>{lang}</span>
          {/if}
        </div>
      {/if}
    </div>
  {/if}
</div>
