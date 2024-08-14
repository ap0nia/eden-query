<script setup lang="ts">
import { useData } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import { nextTick, provide, ref } from 'vue'

import useDark from '../../../src/use-dark'
import Ray from '../../../src/components/ray.vue'

const isDark = useDark()
const { isDark: darkTheme } = useData()

function transitionsEnabled() {
  if (typeof document !== 'undefined' && 'startViewTransition' in document) {
    return window.matchMedia('(prefers-reduced-motion: no-preference)').matches
  }
  return false
}

provide('toggle-appearance', async ({ clientX: x, clientY: y }: MouseEvent) => {
  if (!transitionsEnabled() || typeof window === 'undefined' || window?.localStorage == null) {
    darkTheme.value = !darkTheme.value
    return
  }

  const lastSwitch = window.localStorage.getItem('theme-switch')

  if (lastSwitch !== null && !isNaN(+lastSwitch)) {
    const lastSwitchTime = +lastSwitch

    if (Date.now() - lastSwitchTime > 3 * 60 * 1000) {
      if (document.documentElement.classList.contains('-animated')) {
        document.documentElement.classList.remove('-animated')
      }
    } else {
      document.documentElement.classList.add('-animated')
    }
  }

  window.localStorage.setItem('theme-switch', Date.now().toString())

  const clipPath = [
    `circle(0px at ${x}px ${y}px)`,
    `circle(${Math.hypot(
      Math.max(x, innerWidth - x),
      Math.max(y, innerHeight - y),
    )}px at ${x}px ${y}px)`,
  ]

  // @ts-expect-error
  if (document.startViewTransition !== undefined)
    // @ts-expect-error
    await document.startViewTransition(async () => {
      darkTheme.value = !darkTheme.value
      await nextTick()
    }).ready
})
</script>

<template>
  <link rel="preload" as="image" href="/assets/elysia_v.webp" fetchpriority="high" />
  <link rel="preload" as="image" href="/assets/shigure-ui.webp" fetchpriority="low" />
  <DefaultTheme.Layout>
    <template #doc-top>
      <Ray
        class="h-[220px] top-0 left-0 opacity-25 dark:opacity-[.55] pointer-events-none"
        static
      />
    </template>
  </DefaultTheme.Layout>
</template>

<style>
:root {
  --switch-duration: 1.75s;
  --switch-name: scale;
}

.-animated {
  --switch-duration: 1s;
  --switch-name: scale-fast;
}

::view-transition-group(root) {
  animation-timing-function: var(--expo-in);
  z-index: 100;
}

::view-transition-new(root) {
  mask: url('/assets/shigure-ui.webp') center / 0 no-repeat;
  animation: var(--switch-name) var(--switch-duration);
}

::view-transition-old(root),
.dark::view-transition-old(root) {
  animation: var(--switch-name) var(--switch-duration);
}

@keyframes scale {
  0% {
    mask-size: 0;
  }
  10% {
    mask-size: 50vmax;
  }
  90% {
    mask-size: 50vmax;
  }
  100% {
    mask-size: 2000vmax;
  }
}

@keyframes scale-fast {
  0% {
    mask-size: 0;
  }
  10% {
    mask-size: 50vmax;
  }
  80% {
    mask-size: 50vmax;
  }
  100% {
    mask-size: 2000vmax;
  }
}

.VPSwitchAppearance {
  width: 22px !important;
}

.VPSwitchAppearance .check {
  transform: none !important;
}

html.dark {
  @apply bg-slate-900;
}
</style>
