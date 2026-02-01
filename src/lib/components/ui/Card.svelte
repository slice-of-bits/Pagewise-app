<script lang="ts">
    let { children } = $props();
</script>

<div class="bg-gray-100 rounded-md p-2 md:p-4 shadow-lg overflow-auto">
    {@render children()}
</div>