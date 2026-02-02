<script lang="ts">
	import { page } from '$app/state';
	import { AlertTriangle, RefreshCcw, Home } from 'lucide-svelte';
	
	// Extract error information
	const status = $derived(page.status);
	const errorMessage = $derived(page.error?.message || 'An unexpected error occurred');
</script>

<div class="min-h-screen bg-brand-dark flex items-center justify-center p-4">
	<div class="max-w-md w-full bg-zinc-900/50 border border-brand-border p-8 rounded-sm backdrop-blur-sm">
		<!-- Error Icon -->
		<div class="w-16 h-16 bg-red-950/30 border border-red-900/50 rounded-sm flex items-center justify-center mx-auto mb-6">
			<AlertTriangle size={32} class="text-red-500" />
		</div>
		
		<!-- Status Code -->
		<div class="text-center mb-2">
			<span class="text-5xl font-black text-red-500/20">{status}</span>
		</div>
		
		<!-- Title -->
		<h1 class="text-lg font-black uppercase tracking-widest text-white text-center mb-4">
			System Error
		</h1>
		
		<!-- Error Message -->
		<p class="text-sm text-zinc-400 text-center mb-6 leading-relaxed">
			{errorMessage}
		</p>
		
		<!-- Action Buttons -->
		<div class="flex gap-3">
			<button 
				onclick={() => window.location.reload()}
				class="flex-1 flex items-center justify-center gap-2 py-3 bg-brand-accent text-black font-bold uppercase tracking-wider text-xs hover:bg-white transition-colors"
			>
				<RefreshCcw size={14} />
				Retry
			</button>
			
			<a 
				href="/"
				class="flex-1 flex items-center justify-center gap-2 py-3 border border-brand-border text-zinc-400 font-bold uppercase tracking-wider text-xs hover:bg-zinc-800 hover:text-white transition-colors"
			>
				<Home size={14} />
				Home
			</a>
		</div>
		
	<!-- Technical Details (for debugging) -->
	{#if (page.error as any)?.stack && import.meta.env.DEV}
		<div class="mt-6 pt-6 border-t border-brand-border/30">
			<details class="text-xs">
				<summary class="text-zinc-600 cursor-pointer hover:text-zinc-400 transition-colors">
					Stack Trace (Development Only)
				</summary>
				<pre class="mt-2 p-3 bg-black/50 text-red-400/70 font-mono text-[10px] overflow-x-auto">{(page.error as any).stack}</pre>
			</details>
		</div>
	{/if}
	</div>
</div>
