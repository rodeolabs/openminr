<script lang="ts">
	let { rows = 5 } = $props<{ rows?: number }>();
</script>

<div class="space-y-3 p-4 animate-pulse">
	{#each Array(rows) as _, i}
		<div class="flex gap-3 items-center">
			<!-- Severity Indicator -->
			<div class="w-1 h-12 bg-zinc-800 rounded-full"></div>
			
			<!-- Content -->
			<div class="flex-1 space-y-2">
				<!-- Title line -->
				<div class="h-3 bg-zinc-800 rounded w-3/4"></div>
				<!-- Meta line -->
				<div class="flex gap-2">
					<div class="h-2 bg-zinc-800 rounded w-16"></div>
					<div class="h-2 bg-zinc-800 rounded w-24"></div>
				</div>
			</div>
		</div>
	{/each}
</div>
