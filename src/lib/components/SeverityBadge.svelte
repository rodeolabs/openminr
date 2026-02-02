<script lang="ts">
  let { severity, confidence = 1.0 } = $props<{ severity: number, confidence?: number }>();
  
  // Professional P1-P4 priority system
  const priorities = [
    { label: 'P1', text: 'CRITICAL', class: 'bg-red-600/20 text-red-500 border-red-500/50 shadow-[0_0_10px_rgba(220,38,38,0.3)]' },
    { label: 'P2', text: 'HIGH', class: 'bg-orange-500/20 text-orange-500 border-orange-500/50' },
    { label: 'P3', text: 'MEDIUM', class: 'bg-yellow-500/20 text-yellow-500 border-yellow-500/50' },
    { label: 'P4', text: 'LOW', class: 'bg-blue-500/20 text-blue-500 border-blue-500/50' }
  ];
  
  // Map severity to priority index (1-4 -> 0-3)
  const priorityIndex = $derived(Math.min(Math.max(severity, 1), 4) - 1);
</script>

<div class="flex flex-col items-end gap-1">
  <span class="px-1.5 py-0.5 rounded-sm text-[8px] font-black tracking-[0.15em] border {priorities[priorityIndex].class}">
    {priorities[priorityIndex].label}
  </span>
  {#if confidence < 1}
    <span class="text-[6px] font-mono text-zinc-700 uppercase tracking-tighter">
      {(confidence * 100).toFixed(0)}% CONF
    </span>
  {/if}
</div>
