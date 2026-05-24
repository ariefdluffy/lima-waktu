<script lang="ts">
    let { children } = $props();
</script>

<svelte:head>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <link rel="icon" href="/icon/favicon-32.svg" type="image/svg+xml" />
</svelte:head>

{@render children()}

<style>
    :global(body) {
        margin: 0;
        padding: 0;
        overflow: hidden;
        background: #0a0f1e;
    }
</style>
