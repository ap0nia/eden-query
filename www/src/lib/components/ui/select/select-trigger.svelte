<script lang="ts">
  import { Select as SelectPrimitive, type WithoutChild } from 'bits-ui'

  import { cn } from '$lib/utils/cn'

  let {
    ref = $bindable(null),
    class: className,
    children,
    size = 'default',
    ...restProps
  }: WithoutChild<SelectPrimitive.TriggerProps> & {
    size?: 'sm' | 'default'
  } = $props()
</script>

<SelectPrimitive.Trigger
  bind:ref
  data-slot="select-trigger"
  data-size={size}
  class={cn(
    // 'border-input',
    // 'border-base-content',

    'btn btn-outline',

    'flex w-fit items-center justify-between gap-2 rounded-md border',

    // 'bg-transparent',

    'px-3 py-2 text-sm whitespace-nowrap shadow-xs',

    //'transition-[color,box-shadow] outline-none',

    // 'focus-visible:border-ring',
    // 'focus-visible:ring-ring/50',
    // 'focus-visible:ring-[3px]',

    'aria-invalid:btn-error',

    // 'aria-invalid:ring-destructive/20',
    // 'dark:aria-invalid:ring-destructive/40',
    // 'aria-invalid:border-destructive',
    // 'dark:bg-input/30',
    // 'dark:hover:bg-input/50',

    // 'disabled:cursor-not-allowed',
    // 'disabled:opacity-50',

    'data-placeholder:text-base-content/70',
    // 'data-[placeholder]:text-muted-foreground',

    'data-[size=default]:btn-md',
    'data-[size=sm]:btn-sm',
    // 'data-[size=default]:h-9',
    // 'data-[size=sm]:h-8',

    '*:data-[slot=select-value]:line-clamp-1',
    '*:data-[slot=select-value]:flex',
    '*:data-[slot=select-value]:items-center',
    '*:data-[slot=select-value]:gap-2',

    '[&_svg]:pointer-events-none',
    '[&_svg]:shrink-0',
    "[&_svg:not([class*='size-'])]:size-4",
    "[&_svg:not([class*='text-'])]:text-base-content/70",
    // "[&_svg:not([class*='text-'])]:text-muted-foreground",

    className,
  )}
  {...restProps}
>
  {@render children?.()}
  <span class="icon-[mdi--chevron-down] size-4 opacity-50"></span>
</SelectPrimitive.Trigger>
