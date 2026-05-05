<script lang="ts">
 
  let { href, text } = $props();
</script>

<a 
  {href} 
  class="inline-flex items-center gap-2 text-text-secondary hover:text-haiti-blue transition-colors mb-6 font-medium group"
>
  <span class="transform group-hover:-translate-x-1 transition-transform">←</span> 
  {text}
</a>