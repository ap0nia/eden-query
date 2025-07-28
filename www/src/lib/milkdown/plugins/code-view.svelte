<script lang="ts">
  import { useNodeViewContext } from '@prosemirror-adapter/svelte'
  import { bundledLanguagesInfo } from 'shiki'

  import CopyButton from '$lib/components/copy-button.svelte'
  import * as Command from '$lib/components/ui/command'
  import * as Popover from '$lib/components/ui/popover'
  import * as Tooltip from '$lib/components/ui/tooltip'
  import { aliasLanguages } from '$lib/shiki'
  import { cn } from '$lib/utils/cn'

  const contentRef = useNodeViewContext('contentRef')

  const node = useNodeViewContext('node')

  const setAttrs = useNodeViewContext('setAttrs')

  const attrs = $derived($node.attrs)

  let lang = $derived(
    (attrs['language'] && aliasLanguages.get(attrs['language'])) || attrs['language'],
  )

  const langInfo = $derived(
    bundledLanguagesInfo.find((info) => info.name === lang || info.id === lang),
  )

  let ref = $state<HTMLElement>()

  const title = $derived(attrs['title']?.toString()?.replace(/^"(.*)"$/, '$1') || lang)

  const resolvedShowHeader = $derived(Boolean(title) || true)

  let open = $state(false)

  let triggerRef = $state<HTMLButtonElement>(null!)

  async function handleLanguageChange(value: string) {
    setAttrs({ ...attrs, language: value })
  }
</script>

<Tooltip.Provider>
  <div
    class={cn(
      lang && `language-${lang}`,
      'vp-adaptive-theme vp-code',
      'group/code',
      'relative my-4 w-full',
      'bg-base-200 text-base-content',
      'rounded-field divide-y overflow-hidden border',
      'not-prose',
      'whitespace-normal',
    )}
  >
    {#if resolvedShowHeader}
      <div
        class={cn(
          'code-header vp-code-block-title',
          // 'bg-neutral',
          'rounded-t-field',
          'group-has-[[name=sticky-pin]:checked]/code:sticky',
          'top-0 z-10 flex items-center justify-between gap-4 px-4 py-1 pr-2',
        )}
      >
        <div class="flex items-center gap-0.5">
          {#if langInfo}
            <Popover.Root bind:open>
              <Tooltip.Root>
                <Tooltip.Trigger>
                  <Popover.Trigger bind:ref={triggerRef} class="btn btn-sm">
                    <span>{langInfo.name}</span>
                    <span class="icon-[mdi--chevron-down]"></span>
                  </Popover.Trigger>
                </Tooltip.Trigger>

                <Tooltip.Content>Language</Tooltip.Content>
              </Tooltip.Root>

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
          <Tooltip.Root>
            <Tooltip.Trigger>
              {#snippet child({ props })}
                <label
                  class="btn btn-square btn-ghost btn-sm group-has-[[name=sticky-pin]:checked]/code:btn-active"
                  {...props}
                >
                  <input name="sticky-pin" type="checkbox" checked class="hidden" />
                  <span class="icon-[mdi--pin]"></span>
                </label>
              {/snippet}
            </Tooltip.Trigger>

            <Tooltip.Content>Pin header to top</Tooltip.Content>
          </Tooltip.Root>

          <Tooltip.Root>
            <Tooltip.Trigger>
              {#snippet child({ props })}
                <label
                  class="btn btn-square btn-ghost btn-sm group-has-[[name=line-count]:checked]/code:btn-active"
                  {...props}
                >
                  <input name="line-count" type="checkbox" class="hidden" />
                  <span class="icon-[mdi--format-list-numbered]"></span>
                </label>
              {/snippet}
            </Tooltip.Trigger>

            <Tooltip.Content>Toggle line numbers</Tooltip.Content>
          </Tooltip.Root>

          <Tooltip.Root>
            <Tooltip.Trigger>
              {#snippet child({ props })}
                <label
                  class="btn btn-square btn-ghost btn-sm swap group-has-[[name=wrap]:checked]/code:btn-active"
                  {...props}
                >
                  <input name="wrap" type="checkbox" class="hidden" />
                  <span class="swap-on icon-[mdi--wrap]"></span>
                  <span class="swap-off icon-[mdi--wrap-disabled]"></span>
                </label>
              {/snippet}
            </Tooltip.Trigger>

            <Tooltip.Content>Toggle line wrap</Tooltip.Content>
          </Tooltip.Root>

          <Tooltip.Root>
            <Tooltip.Trigger>
              {#snippet child({ props })}
                <CopyButton {ref} class="!btn-ghost btn-sm" {...props} />
              {/snippet}
            </Tooltip.Trigger>

            <Tooltip.Content>Copy code</Tooltip.Content>
          </Tooltip.Root>
        </div>
      </div>
    {/if}

    <div class="relative overflow-hidden">
      <div class="peer/wrap overflow-x-auto py-4">
        <pre
          class={cn(
            'group-has-[[name=line-count]:checked]/code:line-count',
            'group-has-[[name=wrap]:checked]/code:whitespace-pre-wrap',
            '!bg-transparent text-sm',
            '!align-super',
            '[&_code]:block [&_code]:px-6',
          )}
          bind:this={ref}><code use:contentRef class="inline-block border-none!"></code></pre>
      </div>

      {#if resolvedShowHeader}
        <div
          class="code-extras peer/actions pointer-events-none absolute top-0 left-0 flex w-full justify-end p-2 opacity-0 transition-opacity peer-hover/wrap:opacity-100 hover:opacity-100"
        >
          <div class="hover pointer-events-auto">
            <Tooltip.Root>
              <Tooltip.Trigger>
                {#snippet child({ props })}
                  <label
                    class="btn btn-square btn-outline btn-sm group-has-[[name=line-count]:checked]/code:btn-active"
                    {...props}
                  >
                    <input name="line-count" type="checkbox" class="hidden" />
                    <span class="icon-[mdi--format-list-numbered]"></span>
                  </label>
                {/snippet}
              </Tooltip.Trigger>

              <Tooltip.Content>Toggle line numbers</Tooltip.Content>
            </Tooltip.Root>

            <Tooltip.Root>
              <Tooltip.Trigger>
                {#snippet child({ props })}
                  <label
                    class="btn btn-outline btn-square btn-sm swap group-has-[[name=wrap]:checked]/code:btn-active"
                    {...props}
                  >
                    <input name="wrap" type="checkbox" class="hidden" />
                    <span class="swap-on icon-[mdi--wrap]"></span>
                    <span class="swap-off icon-[mdi--wrap-disabled]"></span>
                  </label>
                {/snippet}
              </Tooltip.Trigger>

              <Tooltip.Content>Toggle line wrap</Tooltip.Content>
            </Tooltip.Root>

            <Tooltip.Root>
              <Tooltip.Trigger>
                {#snippet child({ props })}
                  <CopyButton {ref} class="btn-sm btn-square !btn-outline" {...props} />
                {/snippet}
              </Tooltip.Trigger>

              <Tooltip.Content>Copy code</Tooltip.Content>
            </Tooltip.Root>
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
  </div>
</Tooltip.Provider>
