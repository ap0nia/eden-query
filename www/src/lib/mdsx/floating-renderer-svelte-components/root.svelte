<script lang="ts">
  import {
    arrow,
    offset,
    shift,
    size,
    useDismiss,
    useFloating,
    useHover,
    useInteractions,
    useRole,
  } from '@skeletonlabs/floating-ui-svelte'
  import { Portal } from 'bits-ui'
  import { /* getContext, */ type Snippet } from 'svelte'
  import { fade } from 'svelte/transition'

  // const context: any = getContext('FLOATING')

  type Props = {
    skipTransition?: boolean
    classes?: Record<string, boolean>
    children?: Snippet
    popper?: Snippet
    class?: string
    open?: boolean
    'popper-class': string
    theme?: string
  }

  let {
    children,
    classes,
    skipTransition,
    popper,
    class: className,
    open: initialOpen,
    'popper-class': popperClass,
    theme,
  }: Props = $props()

  let open = $state(initialOpen)

  let arrowElement = $state<HTMLElement | undefined>()

  const floating = useFloating({
    placement: 'bottom-start',
    get open() {
      return open
    },
    get middleware() {
      return [
        offset({
          mainAxis: 5,
          crossAxis: 0,
        }),
        shift(),
        arrow({
          element: arrowElement!,
        }),
        size({
          apply({ middlewareData, availableWidth, availableHeight }) {
            middlewareData['availableWidth'] = availableWidth
            middlewareData['availableHeight'] = availableHeight
          },
        }),
      ]
    },
    onOpenChange,
  })

  const role = useRole(floating.context, { role: 'tooltip' })

  const hover = useHover(floating.context, { move: false, delay: { open: 0, close: 50 } })

  const dismiss = useDismiss(floating.context)

  const interactions = useInteractions([role, hover, dismiss])

  const shown = $derived(floating.open)

  const result = $derived(floating.middlewareData)

  const themeClasses = $derived.by(() => {
    return theme?.split(' ').map((name) => `v-popper--theme-${name}`) ?? []
  })

  async function onOpenChange(value: boolean) {
    open = value
  }
</script>

<!-- DO NOT FORMAT THIS FILE! -->
<!-- Since this may appear within a code block, the whitespace is significant. -->
<!-- prettier-ignore-start -->
<div
  bind:this={floating.elements.reference}
  {...interactions.getReferenceProps()}
  class="v-popper {className}"
>{@render children?.()}
</div><Portal><div
    aria-hidden={!shown}
    data-popper-placement={floating.placement.split('-')[0]}
    class="v-popper v-popper__popper {popperClass} {themeClasses.join(' ')}"
    class:v-popper__popper--shown={shown}
    class:v-popper__popper--hidden={!shown}
    class:v-popper__popper--show-from={classes?.['showFrom']}
    class:v-popper__popper--show-to={classes?.['showTo']}
    class:v-popper__popper--hide-from={classes?.['hideFrom']}
    class:v-popper__popper--hide-to={classes?.['hideTo']}
    class:v-popper__popper--skip-transition={skipTransition}
    class:v-popper__popper--no-positioning={!result}
    class:v-popper--shown={floating.open}
    bind:this={floating.elements.floating}
    style={floating.floatingStyles}
    {...interactions.getFloatingProps()}
  >
    {#if open}
      <div transition:fade={{ duration: 200 }}>
        <div class="v-popper__wrapper">
          <div class="v-popper__inner">
            {@render popper?.()}
          </div>
          <div
            bind:this={arrowElement}
            class="v-popper__arrow-container"
            style:left="{floating.middlewareData.arrow?.x}px"
            style="position: absolute; z-index: 100"
          >
            <div class="v-popper__arrow-outer"></div>
            <div class="v-popper__arrow-inner"></div>
          </div>
        </div>
      </div>
    {/if}
  </div>
</Portal>
<!-- prettier-ignore-end -->
