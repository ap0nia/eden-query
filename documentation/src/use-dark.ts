import { onMounted, ref } from 'vue'

export default function useDark() {
  const isDark = ref(false)

  onMounted(() => {
    isDark.value = document.documentElement.classList.contains('dark')

    const attrObserver = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.attributeName !== 'class') continue

        isDark.value = document.documentElement.classList.contains('dark')
      }
    })

    attrObserver.observe(document.documentElement, { attributes: true })

    return () => {
      attrObserver.disconnect()
    }
  })

  return isDark
}
