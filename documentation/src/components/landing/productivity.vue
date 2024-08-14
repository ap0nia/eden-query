<script setup>
import 'shiki-magic-move/dist/style.css'

import { useIntersectionObserver } from '@vueuse/core'
import { ShikiMagicMove } from 'shiki-magic-move/vue'
import { getHighlighter } from 'shiki'
import { ref, onMounted } from 'vue'

import { productivityCodeBlocks } from '../../productivity-code-blocks'

const step = ref(0)

const highlighter = ref(null)

onMounted(async () => {
  highlighter.value = await getHighlighter({
    themes: ['nord'],
    langs: ['javascript', 'typescript'],
  })
})

const target = ref(null)

function animate() {
  step.value = 1
}

const { stop } = useIntersectionObserver(target, ([{ isIntersecting }], observerElement) => {
  if (isIntersecting) {
    animate()
  }
})
</script>

<template>
  <div ref="target">
    <ShikiMagicMove
      v-if="highlighter"
      lang="ts"
      theme="nord"
      :highlighter="highlighter"
      :code="productivityCodeBlocks[step]"
      :options="{ duration: 800, stagger: 0.3, lineNumbers: true }"
    />
  </div>
</template>
