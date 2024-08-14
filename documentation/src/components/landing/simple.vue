<script setup>
import Productivity from './productivity.vue'
</script>

<template>
  <article class="flex justify-between w-full max-w-6xl mx-auto my-8 gap-12">
    <section class="flex flex-col w-full">
      <header class="flex flex-col justify-center items-start">
        <h2
          class="text-5xl md:text-6xl md:leading-tight font-bold text-transparent bg-clip-text bg-gradient-to-br from-lime-300 to-cyan-300"
        >
          Made for Humans
        </h2>
        <h2 class="text-3xl leading-tight font-medium text-gray-400 mb-8">
          Productivity
          <span
            class="text-4xl text-transparent bg-clip-text bg-gradient-to-br from-lime-400 to-cyan-400"
          >
            ++
          </span>
        </h2>
      </header>

      <p class="text-xl text-gray-400 w-full max-w-lg mb-8">
        If you have ever spent more time writing code for the framework instead of your application,
        then there's something wrong with the framework.
      </p>

      <p class="text-xl text-gray-400 w-full max-w-lg mb-8">
        Elysia prioritizes developer experience by experimenting with design decisions to craft the
        best ergonomics.
      </p>

      <p class="text-xl text-gray-400 w-full max-w-lg">
        <span>Built-in features such as </span>
        <span>strict type validation, </span>
        <span>robust type system, </span>
        <span>and automatic documentation generation, </span>
        <span>make Elysia an ideal framework for building servers with TypeScript.</span>
      </p>
    </section>

    <section class="flex items-center">
      <Productivity />
    </section>
  </article>
</template>
