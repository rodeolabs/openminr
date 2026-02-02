<script lang="ts">
	import { Loader2 } from 'lucide-svelte';
	
	let { message = 'Initializing Systems...' } = $props<{ message?: string }>();
</script>

<div class="h-full w-full flex flex-col items-center justify-center bg-brand-dark text-white p-8">
	<!-- Animated Logo/Icon -->
	<div class="relative w-16 h-16 mb-6">
		<div class="absolute inset-0 border-2 border-brand-accent/20 rounded-sm animate-ping"></div>
		<div class="relative w-16 h-16 border-2 border-brand-accent rounded-sm flex items-center justify-center bg-brand-accent/10">
			<Loader2 size={28} class="text-brand-accent animate-spin" />
		</div>
	</div>
	
	<!-- Loading Message -->
	<h2 class="text-sm font-black uppercase tracking-[0.2em] text-white mb-2">
		{message}
	</h2>
	
	<!-- Loading Bar -->
	<div class="w-48 h-1 bg-zinc-800 rounded-full overflow-hidden mt-4">
		<div class="h-full bg-brand-accent animate-pulse" style="width: 60%"></div>
	</div>
	
	<!-- Status Text -->
	<p class="mt-4 text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
		Establishing Secure Connection
	</p>
</div>
