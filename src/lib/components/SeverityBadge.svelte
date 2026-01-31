<script lang="ts">
  let { severity, confidence = 1.0 } = $props<{ severity: number, confidence?: number }>();
  
  const labels = ['CRITICAL', 'HIGH', 'ELEVATED', 'LOW', 'MINIMAL'];
  
  // Maps severity to the Tailwind utility classes defined in app.css
  const severityClasses = [
    'bg-red-600/20 text-red-500 border-red-500/50 shadow-[0_0_10px_rgba(220,38,38,0.2)] animate-pulse',
    'bg-orange-500/20 text-orange-500 border-orange-500/50',
    'bg-yellow-400/10 text-yellow-400 border-yellow-400/50',
    'bg-blue-400/10 text-blue-400 border-blue-400/50',
    'bg-zinc-800/50 text-zinc-500 border-zinc-700/50'
  ];
</script>

<div class="flex flex-col items-end gap-1">
  <span class="px-1.5 py-0.5 rounded-sm text-[8px] font-black tracking-[0.1em] border {severityClasses[severity - 1]}">
    {labels[severity - 1]}
  </span>
  {#if confidence < 1}
    <span class="text-[6px] font-mono text-zinc-700 uppercase tracking-tighter">
      Confidence: {(confidence * 100).toFixed(0)}%
    </span>
  {/if}
</div>
