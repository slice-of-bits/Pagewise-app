<script lang="ts">
    let { href } = $props();
    let image_url = "http://localhost:8000/image" + href;
</script>
<img src={image_url} alt="Image" class="max-w-full h-auto mx-auto my-4" />
