<script>
  import "../app.css";
  import { page } from "$app/stores";
  let { children } = $props();

  // Hide the portfolio nav on interactive app surfaces where a fixed
  // 56px top bar conflicts with fullscreen layouts (spatial fort UI,
  // factory demo, auth flows). Marketing homepage (/) keeps the nav.
  const hideNav = $derived(
    $page.url.pathname.startsWith("/app") ||
      $page.url.pathname.startsWith("/factory") ||
      $page.url.pathname.startsWith("/auth")
  );
</script>

{#if !hideNav}
  <amp-nav property="runefort"></amp-nav>
{/if}
{@render children()}
