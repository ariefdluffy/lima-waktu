<script lang="ts">
    import Toast from "$lib/components/admin/Toast.svelte";

    let { children } = $props();
</script>

{@render children()}

<Toast />
