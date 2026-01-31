<script lang="ts">
  import { supabase } from '$lib/supabase/client';
  import { 
    UserCheck, 
    AlertTriangle, 
    CheckCircle, 
    XCircle, 
    MessageSquare, 
    Send,
    Loader2
  } from 'lucide-svelte';

  // Svelte 5 Runes: $props() declares the inputs for this component.
  // Note the default value assignment for analystId and onUpdate.
  let { 
    incident, 
    analystId = 'ANALYST-01', // Placeholder for authenticated user ID
    onUpdate = () => {}
  } = $props<{ 
    incident: any, 
    analystId?: string,
    onUpdate?: () => void 
  }>();

  // Svelte 5 Runes: $state() replaces 'let' for reactive variables.
  let isLoading = $state(false);
  let showNoteInput = $state(false);
  let showEscalateInput = $state(false);
  let showResolveInput = $state(false);
  let noteContent = $state('');
  let noteType = $state<'observation' | 'assessment' | 'action' | 'handoff'>('observation');
  let escalationReason = $state('');
  let resolutionSummary = $state('');
  let notes = $state<any[]>([]);

  // Svelte 5 Runes: $derived() automatically updates these values whenever dependencies (incident) change.
  // This logic encapsulates the "State Machine" rules for what an analyst can do at each stage.
  const isClaimed = $derived(incident?.status === 'claimed');
  const isClaimedByMe = $derived(incident?.claimed_by === analystId);
  const canClaim = $derived(incident?.status === 'active');
  const canEscalate = $derived(['active', 'claimed'].includes(incident?.status));
  const canResolve = $derived(['active', 'claimed', 'escalated'].includes(incident?.status));

  // Unified handler for all analyst state transitions.
  // Calls the generic /api/actions endpoint which handles the database logic and audit logging.
  async function performAction(action: string, extra: Record<string, any> = {}) {
    if (isLoading) return;
    isLoading = true;

    try {
      const res = await fetch('/api/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          incident_id: incident.id,
          action,
          analyst_id: analystId,
          ...extra
        })
      });

      const data = await res.json();
      if (data.success) {
        onUpdate();
        showNoteInput = false;
        showEscalateInput = false;
        showResolveInput = false;
        noteContent = '';
        escalationReason = '';
        resolutionSummary = '';
        
        if (action === 'add_note') {
          await loadNotes();
        }
      }
    } catch (e) {
      console.error('Action failed:', e);
    } finally {
      isLoading = false;
    }
  }

  async function loadNotes() {
    if (!incident?.id) return;
    
    const res = await fetch(`/api/actions?incident_id=${incident.id}`);
    const data = await res.json();
    notes = data.notes || [];
  }

  // Svelte 5 Runes: $effect() replaces onMount/afterUpdate for side-effects.
  // This runs whenever incident.id changes to fetch the latest notes.
  $effect(() => {
    if (incident?.id) {
      loadNotes();
    }
  });
</script>

<div class="space-y-4">
  {#if isClaimed}
    <div class="p-3 rounded-sm border {isClaimedByMe ? 'bg-green-950/30 border-green-800/50' : 'bg-yellow-950/30 border-yellow-800/50'}">
      <div class="flex items-center gap-2 text-xs">
        <UserCheck size={14} class={isClaimedByMe ? 'text-green-500' : 'text-yellow-500'} />
        <span class="font-bold {isClaimedByMe ? 'text-green-400' : 'text-yellow-400'}">
          {isClaimedByMe ? 'You are working this incident' : `Claimed by ${incident.claimed_by}`}
        </span>
      </div>
      {#if incident.claimed_at}
        <span class="text-[9px] text-zinc-500 font-mono ml-5">
          Since {new Date(incident.claimed_at).toLocaleTimeString()}
        </span>
      {/if}
    </div>
  {/if}

  <div class="grid grid-cols-2 gap-2">
    {#if canClaim}
      <button 
        onclick={() => performAction('claim')}
        disabled={isLoading}
        class="flex items-center justify-center gap-2 py-2.5 bg-green-900/50 border border-green-700/50 text-green-400 hover:bg-green-800/50 transition-colors text-[10px] font-bold uppercase tracking-wider disabled:opacity-50"
      >
        <UserCheck size={14} />
        Claim
      </button>
    {:else if isClaimedByMe}
      <button 
        onclick={() => performAction('unclaim')}
        disabled={isLoading}
        class="flex items-center justify-center gap-2 py-2.5 border border-zinc-700 text-zinc-400 hover:bg-zinc-800 transition-colors text-[10px] font-bold uppercase tracking-wider disabled:opacity-50"
      >
        <XCircle size={14} />
        Unclaim
      </button>
    {:else}
      <div class="py-2.5 text-center text-[9px] text-zinc-600 border border-zinc-800 bg-zinc-900/30">
        Claimed by other
      </div>
    {/if}

    <button 
      onclick={() => showNoteInput = !showNoteInput}
      class="flex items-center justify-center gap-2 py-2.5 border border-brand-border text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors text-[10px] font-bold uppercase tracking-wider"
    >
      <MessageSquare size={14} />
      Add Note
    </button>
  </div>

  {#if showNoteInput}
    <div class="p-3 bg-zinc-900/50 border border-brand-border space-y-2 animate-in slide-in-from-top duration-150">
      <div class="flex gap-2">
        {#each ['observation', 'assessment', 'action', 'handoff'] as type}
          <button 
            onclick={() => noteType = type as typeof noteType}
            class="text-[8px] font-bold uppercase px-2 py-1 border transition-colors {noteType === type ? 'bg-zinc-800 border-zinc-600 text-white' : 'border-zinc-800 text-zinc-600'}"
          >
            {type}
          </button>
        {/each}
      </div>
      <textarea 
        bind:value={noteContent}
        placeholder="Enter analyst note..."
        class="w-full bg-zinc-950 border border-brand-border text-xs text-white p-2 h-20 resize-none outline-none focus:border-brand-accent/50"
      ></textarea>
      <button 
        onclick={() => performAction('add_note', { note: noteContent, note_type: noteType })}
        disabled={!noteContent.trim() || isLoading}
        class="w-full py-2 bg-brand-accent text-white text-[10px] font-bold uppercase tracking-wider hover:bg-red-500 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {#if isLoading}
          <Loader2 size={12} class="animate-spin" />
        {:else}
          <Send size={12} />
        {/if}
        Submit Note
      </button>
    </div>
  {/if}

  <div class="grid grid-cols-2 gap-2">
    {#if canEscalate}
      <button 
        onclick={() => showEscalateInput = !showEscalateInput}
        class="flex items-center justify-center gap-2 py-2 border border-orange-800/50 text-orange-400 hover:bg-orange-900/30 transition-colors text-[10px] font-bold uppercase tracking-wider"
      >
        <AlertTriangle size={14} />
        Escalate
      </button>
    {/if}

    {#if canResolve}
      <button 
        onclick={() => showResolveInput = !showResolveInput}
        class="flex items-center justify-center gap-2 py-2 border border-blue-800/50 text-blue-400 hover:bg-blue-900/30 transition-colors text-[10px] font-bold uppercase tracking-wider"
      >
        <CheckCircle size={14} />
        Resolve
      </button>
    {/if}
  </div>

  {#if showEscalateInput}
    <div class="p-3 bg-orange-950/20 border border-orange-800/50 space-y-2 animate-in slide-in-from-top duration-150">
      <label for="escalate-reason" class="text-[9px] font-bold text-orange-400 uppercase tracking-wider">Escalation Reason</label>
      <textarea 
        id="escalate-reason"
        bind:value={escalationReason}
        placeholder="Why does this require senior attention?"
        class="w-full bg-zinc-950 border border-orange-800/50 text-xs text-white p-2 h-16 resize-none outline-none focus:border-orange-500"
      ></textarea>
      <button 
        onclick={() => performAction('escalate', { reason: escalationReason })}
        disabled={!escalationReason.trim() || isLoading}
        class="w-full py-2 bg-orange-600 text-white text-[10px] font-bold uppercase tracking-wider hover:bg-orange-500 transition-colors disabled:opacity-50"
      >
        Confirm Escalation
      </button>
    </div>
  {/if}

  {#if showResolveInput}
    <div class="p-3 bg-blue-950/20 border border-blue-800/50 space-y-2 animate-in slide-in-from-top duration-150">
      <label for="resolve-summary" class="text-[9px] font-bold text-blue-400 uppercase tracking-wider">Resolution Summary</label>
      <textarea 
        id="resolve-summary"
        bind:value={resolutionSummary}
        placeholder="Document how this was resolved..."
        class="w-full bg-zinc-950 border border-blue-800/50 text-xs text-white p-2 h-16 resize-none outline-none focus:border-blue-500"
      ></textarea>
      <button 
        onclick={() => performAction('resolve', { summary: resolutionSummary })}
        disabled={!resolutionSummary.trim() || isLoading}
        class="w-full py-2 bg-blue-600 text-white text-[10px] font-bold uppercase tracking-wider hover:bg-blue-500 transition-colors disabled:opacity-50"
      >
        Mark Resolved
      </button>
    </div>
  {/if}

  {#if !['resolved', 'dismissed'].includes(incident?.status)}
    <button 
      onclick={() => performAction('dismiss', { reason: 'Not actionable' })}
      disabled={isLoading}
      class="w-full py-2 border border-zinc-800 text-zinc-600 hover:bg-zinc-900 hover:text-zinc-400 transition-colors text-[10px] font-bold uppercase tracking-wider"
    >
      Dismiss as Not Actionable
    </button>
  {/if}

  {#if notes.length > 0}
    <div class="pt-4 border-t border-brand-border/30">
      <h5 class="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-3">
        Analyst Notes ({notes.length})
      </h5>
      <div class="space-y-2 max-h-48 overflow-y-auto">
        {#each notes as note}
          <div class="p-2 bg-zinc-900/30 border-l-2 border-zinc-600 text-xs">
            <div class="flex justify-between items-center mb-1">
              <span class="font-bold text-zinc-300">{note.analyst_id}</span>
              <span class="text-[8px] px-1.5 py-0.5 bg-zinc-800 text-zinc-500 uppercase">{note.note_type}</span>
            </div>
            <p class="text-zinc-400 text-[11px] leading-relaxed">{note.content}</p>
            <span class="text-[8px] text-zinc-600 font-mono">
              {new Date(note.created_at).toLocaleString()}
            </span>
          </div>
        {/each}
      </div>
    </div>
  {/if}
</div>
