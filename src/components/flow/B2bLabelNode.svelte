<script>
  let { data } = $props();
  const isHighlight = data.highlight ?? false;
</script>

<div class="b2b-label" class:highlight={isHighlight}>
  {data.text}
</div>

<style>
  .b2b-label {
    font-family: "JetBrains Mono", monospace;
    font-size: 0.6rem;
    color: #7a7770;
    letter-spacing: 0.04em;
    white-space: nowrap;
    pointer-events: none;
  }
  .b2b-label.highlight {
    color: #e8a84c;
  }
</style>
