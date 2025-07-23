<script lang="ts">
  import { Select as SelectPrimitive, type WithoutChild } from 'bits-ui'

  import { cn } from '$lib/utils/cn'

  let {
    ref = $bindable(null),
    class: className,
    value,
    label,
    children: childrenProp,
    ...restProps
  }: WithoutChild<SelectPrimitive.ItemProps> = $props()
</script>

<SelectPrimitive.Item
  bind:ref
  {value}
  data-slot="select-item"
  class={cn(
    'btn btn-sm btn-ghost',

    'justify-start text-xs! font-normal',

    'relative flex w-full cursor-default items-center gap-2 rounded-sm py-1.5 pr-8 pl-2 text-sm outline-hidden select-none',

    'data-highlighted:btn-active!',
    // 'data-[highlighted]:bg-accent',
    // 'data-[highlighted]:text-accent-foreground',

    'data-disabled:btn-disabled!',
    // 'data-[disabled]:pointer-events-none',
    // 'data-[disabled]:opacity-50',

    '[&_svg]:shrink-0',
    '[&_svg]:pointer-events-none',
    "[&_svg:not([class*='size-'])]:size-4",
    "[&_svg:not([class*='text-'])]:text-base-content/70",
    // "[&_svg:not([class*='text-'])]:text-muted-foreground",

    '*:[span]:last:flex',
    '*:[span]:last:items-center',
    '*:[span]:last:gap-2',
    className,
  )}
  {...restProps}
>
  {#snippet children({ selected, highlighted })}
    <span class="absolute right-2 flex size-3.5 items-center justify-center">
      {#if selected}
        <span class="icon-[mdi--check] size-4"></span>
      {/if}
    </span>

    {#if childrenProp}
      {@render childrenProp({ selected, highlighted })}
    {:else}
      {label || value}
    {/if}
  {/snippet}
</SelectPrimitive.Item>
