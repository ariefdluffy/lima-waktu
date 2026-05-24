<script lang="ts">
    import { page } from "$app/stores";
    import { goto } from "$app/navigation";
    import { onMount } from "svelte";
    import { showToast } from "$lib/stores/toast";

    onMount(() => {
        const toastParam = $page.url.searchParams.get("toast");
        if (toastParam === "login_success") {
            showToast("Berhasil masuk sebagai Superadmin!", "info");
        }
        goto("/superadmin/dashboard", { replaceState: true });
    });
</script>
