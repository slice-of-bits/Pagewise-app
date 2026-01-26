<script lang="ts">
    import SvelteMarkdown from 'svelte-markdown'
    import ImageComponent from "$lib/components/markdownrenders/ImageComponent.svelte";
    let { content } = $props();

    let renderers = {
        image: ImageComponent
    };

</script>
<div class="prose overflow-y-auto">
    <!--{content}-->
    <SvelteMarkdown source={content} renderers={renderers}/>
</div>