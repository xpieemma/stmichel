<script lang="ts">
  import { passportCount } from '$lib/stores/passport';
  import { goto } from '$app/navigation';
</script>

<button type="button" class="passport-widget" onclick={() => goto('/passport')}>
  <span class="icon">🛂</span>
  <div class="info">
    <span class="label">Paspò Festival</span>
    <div><span class="count">{$passportCount}</span><span class="badge">Kache</span></div>
  </div>
</button>

<style>
  .passport-widget {
    background: none; border: none; width: 100%; text-align: left; cursor: pointer; font: inherit; color: inherit;
    position: fixed; bottom: 80px; right: 20px;
    display: flex; align-items: center; gap: 10px;
    background: linear-gradient(135deg, var(--bg-primary) 0%, var(--bg-card) 100%);
    border: 1.2px solid var(--accent-blue); border-radius: 60px;
    padding: 10px 18px 10px 14px; box-shadow: var(--shadow-md);
    cursor: pointer; z-index: 100;
  }
  .icon { font-size: 28px; }
  .label { font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase; }
  .count { font-size: 1.3rem; font-weight: 700; color: var(--text-primary); }
  .badge { background: var(--accent-blue); color: white; font-size: 0.7rem; padding: 2px 8px; border-radius: 40px; margin-left: 6px; }
  .passport-widget:active { transform: scale(0.97); }
</style>
