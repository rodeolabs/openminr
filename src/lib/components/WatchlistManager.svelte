<script lang="ts">
  import { onMount } from 'svelte';
  import { supabase } from '$lib/supabase/client';
  import { Plus, Trash2, X, Tag } from 'lucide-svelte';

  let { onClose } = $props<{ onClose: () => void }>();

  let watchlists = $state<any[]>([]);
  let newKeyword = $state('');
  let newCategory = $state('Security');

  async function fetchWatchlist() {
    // Direct RLS-protected query to Supabase.
    // The policy ensures users only see/edit their own organization's watchlist.
    const { data } = await supabase.from('watchlists').select('*').order('created_at', { ascending: false });
    watchlists = data || [];
  }

  async function addKeyword() {
    if (!newKeyword.trim()) return;
    
    const { error } = await supabase.from('watchlists').insert({
      keyword: newKeyword.trim().toLowerCase(),
      category: newCategory
    });

    if (!error) {
      newKeyword = '';
      fetchWatchlist();
    }
  }

  async function removeKeyword(id: string) {
    await supabase.from('watchlists').delete().eq('id', id);
    fetchWatchlist();
  }

  onMount(fetchWatchlist);
</script>

<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
  <div class="w-full max-w-lg bg-brand-dark border border-brand-border shadow-2xl rounded-sm flex flex-col max-h-[80vh]">
    
    <header class="p-4 border-b border-brand-border flex justify-between items-center bg-zinc-900/50">
      <div class="flex items-center gap-3">
        <Tag size={16} class="text-brand-accent" />
        <h2 class="text-sm font-black uppercase tracking-widest text-white">Tactical Watchlist</h2>
      </div>
      <button onclick={onClose} class="text-zinc-500 hover:text-white transition-colors">
        <X size={18} />
      </button>
    </header>

    <div class="p-4 border-b border-brand-border bg-zinc-900/20">
      <div class="flex gap-2">
        <input 
          type="text" 
          bind:value={newKeyword} 
          placeholder="New keyword (e.g. 'biolabs')" 
          class="flex-1 bg-zinc-950 border border-brand-border px-3 py-2 text-xs text-white outline-none focus:border-brand-accent transition-colors"
          onkeydown={(e) => e.key === 'Enter' && addKeyword()}
        />
        <select 
          bind:value={newCategory}
          class="bg-zinc-950 border border-brand-border px-3 py-2 text-xs text-zinc-400 outline-none focus:border-brand-accent transition-colors"
        >
          <option value="Security">Security</option>
          <option value="Infrastructure">Infrastructure</option>
          <option value="Cyber">Cyber</option>
          <option value="Civil">Civil</option>
          <option value="Military">Military</option>
        </select>
        <button 
          onclick={addKeyword}
          class="bg-brand-accent px-3 text-white hover:bg-red-500 transition-colors"
        >
          <Plus size={16} />
        </button>
      </div>
      <p class="mt-2 text-[10px] text-zinc-500 font-mono">
        These keywords drive the global ingestion engine. Adding a keyword here will instruct the system to scan open sources for this topic immediately upon the next sync.
      </p>
    </div>

    <div class="flex-1 overflow-y-auto p-4 space-y-2">
      {#each watchlists as item (item.id)}
        <div class="flex items-center justify-between p-3 bg-zinc-900/30 border border-brand-border/30 rounded-sm group hover:border-brand-border transition-colors">
          <div class="flex flex-col">
            <span class="text-xs font-bold text-zinc-200 uppercase tracking-wide">{item.keyword}</span>
            <span class="text-[9px] text-zinc-500 font-mono uppercase">{item.category}</span>
          </div>
          <button 
            onclick={() => removeKeyword(item.id)}
            class="text-zinc-600 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
          >
            <Trash2 size={14} />
          </button>
        </div>
      {/each}
      
      {#if watchlists.length === 0}
        <div class="text-center py-8 text-zinc-600 text-xs italic">
          No active keywords. System is blind.
        </div>
      {/if}
    </div>

  </div>
</div>
