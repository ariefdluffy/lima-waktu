<script lang="ts">
  import type { PageData } from "./$types";
  let { data }: { data: PageData } = $props();
</script>

<svelte:head>
  <style>
    body { margin: 0; padding: 0; overflow: hidden; background: #0a0f1e; }
  </style>
</svelte:head>

{@html data.html}
