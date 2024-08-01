<script lang="ts">
  import { eden } from './eden'

  const sleep = eden.api.sleep.get.createQuery({})
</script>

<!--
@component
Component that loads a slow query.
-->

<div>
  <p>
    <span>Result: </span>

    {#if $sleep.isLoading}
      <span>Loading...</span>
    {:else}
      <span>{$sleep.data}</span>
    {/if}
  </p>
</div>
