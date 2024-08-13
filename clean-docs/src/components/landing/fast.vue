<script setup lang="ts">
const max = 2_454_631
const scale = (value: number) => (value / max) * 100
const scaleStyle = (value: number) => `width: ${((value / max) * 100).toFixed(2)}%`
const scalePadding = (value: number) => `padding-left: ${((value / max) * 100).toFixed(2)}%`
const format = new Intl.NumberFormat().format

import { frameworksByPerformance } from '../../frameworks'
</script>

<template>
  <article
    class="flex justify-between flex-col lg:flex-row items-center w-full max-w-6xl mx-auto my-8 gap-12"
  >
    <section class="flex flex-col w-full max-w-lg">
      <header class="flex flex-col justify-center items-start">
        <h2 class="text-3xl leading-tight font-medium text-gray-400 mb-4">
          <span
            class="leading-tight text-8xl font-bold bg-clip-text text-transparent bg-gradient-to-br from-lime-300 to-cyan-300"
          >
            21x
          </span>
          <span>faster than Express</span>
        </h2>
      </header>

      <p class="text-xl text-gray-400 w-full max-w-lg mb-4">
        Supercharged by Bun runtime, Static Code Analysis, and Dynamic Code Injection
      </p>

      <p class="text-xl text-gray-400 w-full max-w-lg">
        Being one of the top-performing TypeScript frameworks. Comparable to Go and Rust.
      </p>
    </section>

    <section class="w-full max-w-xl">
      <ol class="space-y-2 text-gray-500 dark:text-gray-400 text-lg">
        <li
          v-for="(framework, index) in frameworksByPerformance"
          class="flex flex-row w-full gap-4"
        >
          <template v-if="index === 0">
            <p class="flex items-end gap-2 w-full max-w-[6em] dark:text-gray-400">
              <span>{{ framework.name }}</span>
              <span class="text-gray-400 text-xs pb-1">{{ framework.runtime }}</span>
            </p>

            <div class="w-full h-7 relative">
              <div
                class="flex justify-end items-center text-sm font-bold text-white h-7 px-2.5 py-0.5 bg-gradient-to-r from-lime-200 to-cyan-300 rounded-full"
              >
                {{ format(framework.reqs) }} req/s
              </div>
            </div>
          </template>

          <template v-else>
            <p class="flex items-end gap-2 w-full max-w-[6em] dark:text-gray-400">
              {{ framework.name }}
              <span class="text-gray-400 text-xs pb-1">
                {{ framework.runtime }}
              </span>
            </p>

            <div class="w-full h-7 relative">
              <div
                class="flex justify-end items-center text-sm px-2.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded-full mr-auto h-7"
                :style="scaleStyle(framework.reqs)"
              >
                <span
                  v-if="scale(framework.reqs) > 40"
                  class="absolute z-1 flex items-center text-sm h-7"
                >
                  {{ format(framework.reqs) }}
                </span>
              </div>
              <span
                v-if="scale(framework.reqs) <= 40"
                class="absolute top-0 flex items-center text-sm h-7 left-2"
                :style="scalePadding(framework.reqs)"
              >
                {{ format(framework.reqs) }}
              </span>
            </div>
          </template>
        </li>
      </ol>

      <span class="text-sm text-gray-400 dark:text-gray-500">
        <span>Measured in requests/second. Results from official </span>
        <a
          href="https://www.techempower.com/benchmarks/#hw=ph&test=plaintext&section=data-r22"
          target="_blank"
          class="link-hover text-green-500 font-semibold"
        >
          TechEmpower Benchmark
        </a>
        <span>Round 22 (2023-10-17) in PlainText.</span>
      </span>
    </section>
  </article>
</template>
