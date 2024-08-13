---
title: Elysia.js Blog
layout: page
sidebar: false
editLink: false
search: false
head:
  - - meta
    - property: 'og:title'
      content: Blog - Elysia.js

  - - meta
    - name: 'description'
      content: Updates for Elysia.js from core maintainers.

  - - meta
    - property: 'og:description'
      content: Updates for Elysia.js from core maintainers.
---

<script setup>
    import Blogs from '../../src/components/blog/landing.vue'

    import { data } from '../../src/blogs.data.ts'
</script>

<Blogs :blogs="data" />
