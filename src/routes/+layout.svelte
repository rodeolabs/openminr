<script lang="ts">
	import '../app.css';
	let { children } = $props();
</script>

<!-- 
    Command Center Layout
    We removed the global header here because the HUD interface (page.svelte) 
    now manages its own dedicated tactical header (HUDHeader).
    This prevents the "Double Top Bar" issue.
-->
<div class="h-screen w-screen bg-brand-dark overflow-hidden font-sans">
    {@render children()}
</div>
