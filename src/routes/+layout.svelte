<script lang="ts">
	import '../app.css';
	import { page } from '$app/state';
	let { children } = $props();
</script>

<div class="flex h-screen w-screen flex-col bg-brand-dark overflow-hidden font-sans">
	<header class="flex h-12 items-center justify-between border-b border-brand-border bg-[#050505] px-4">
		<div class="flex items-center gap-6">
			<div class="flex items-center gap-2">
				<div class="h-4 w-4 bg-brand-accent rounded-sm"></div>
				<h1 class="text-sm font-black tracking-[0.1em] text-white">OPENMINR</h1>
			</div>

			<nav class="flex items-center gap-6 text-[11px] font-bold uppercase tracking-wider text-zinc-500">
				<a href="/" class="hover:text-white transition-colors {page.url.pathname === '/' ? 'text-white border-b-2 border-brand-accent py-3.5' : 'py-3.5 border-b-2 border-transparent'}">Monitor</a>
				<a href="/intel" class="hover:text-white transition-colors {page.url.pathname === '/intel' ? 'text-white border-b-2 border-brand-accent py-3.5' : 'py-3.5 border-b-2 border-transparent'}">Archive</a>
			</nav>
		</div>

		<div class="flex items-center gap-4">
			<div class="h-7 w-7 rounded bg-zinc-800 flex items-center justify-center font-bold text-xs text-zinc-400">A</div>
		</div>
	</header>

	<main class="flex-1 overflow-hidden">
		{@render children()}
	</main>
</div>
