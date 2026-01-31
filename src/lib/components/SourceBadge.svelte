<script lang="ts">
  let { source, compact = false } = $props<{ source: string, compact?: boolean }>();
  
  // Parses the source string to apply platform-specific branding/colors.
  // This helps analysts quickly distinguish between AI-generated, Social, or Official intel.
  const getSourceInfo = (src: string) => {
    const lower = src.toLowerCase();
    
    if (lower.includes('x.com') || lower.includes('twitter')) {
      return { 
        label: compact ? 'X' : 'X.COM',
        color: 'bg-zinc-800 text-white border-zinc-600',
        icon: '𝕏'
      };
    }
    if (lower.includes('gdacs')) {
      return { 
        label: compact ? 'GDACS' : 'GDACS',
        color: 'bg-blue-900/50 text-blue-400 border-blue-700',
        icon: '⚠'
      };
    }
    if (lower.includes('gdelt')) {
      return { 
        label: compact ? 'GDELT' : 'GDELT',
        color: 'bg-purple-900/50 text-purple-400 border-purple-700',
        icon: '📰'
      };
    }
    if (lower.includes('grok')) {
      return { 
        label: compact ? 'GROK' : 'GROK-AI',
        color: 'bg-green-900/50 text-green-400 border-green-700',
        icon: '🤖'
      };
    }
    return { 
      label: compact ? 'INT' : 'INTEL',
      color: 'bg-zinc-800 text-zinc-400 border-zinc-700',
      icon: '•'
    };
  };
  
  // $derived ensures this re-calculates automatically if the 'source' prop changes.
  const info = $derived(getSourceInfo(source));
</script>

<span class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-sm text-[8px] font-mono uppercase tracking-wider border {info.color}">
  <span class="opacity-70">{info.icon}</span>
  {info.label}
</span>
