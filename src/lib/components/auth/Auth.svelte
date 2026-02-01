<script lang="ts">
    import {browser} from '$app/environment';

    import {PUBLIC_AUTH_CLIENT_ID, PUBLIC_API_HOST} from '$env/static/public';

    import {
        OidcContext,
        LoginButton,
        isAuthenticated
    } from '@dopry/svelte-oidc';
    import Card from '$lib/components/ui/Card.svelte';

    let {children} = $props();
</script>

{#if browser}
    <OidcContext
            issuer={`${PUBLIC_API_HOST}/oauth/`}
            client_id={PUBLIC_AUTH_CLIENT_ID}
            redirect_uri={window.location.origin}
    >
        {#if !$isAuthenticated}
            {@render children()}
        {:else}
            <div class="min-h-svh flex items-center justify-center">
                <div>
                    <h1 class="text-center mb-12 text-4xl font-bold">DocPond</h1>
                    <Card>
                        <img class="w-128 px-12 mx-auto" src="/docpond-mid.png" alt="blauwe schuit logo">
                        <div class="flex items-center justify-center">
                            <LoginButton classes="rounded px-2 py-1 bg-slate-300 hover:bg-slate-500">Login</LoginButton>
                        </div>
                    </Card>
                </div>
            </div>
        {/if}
    </OidcContext>
{/if}