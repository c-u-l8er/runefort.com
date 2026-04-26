// Svelte action: move the element to document.body on mount and restore on
// destroy. Solves the "position: fixed stuck inside a filtered/transformed
// ancestor" problem — a backdrop-filter or transform on any ancestor turns
// that ancestor into the containing block for position:fixed descendants,
// which clips modals to a header bar, etc.
//
// Usage: <div use:portal class="backdrop">...</div>

/** @param {HTMLElement} node */
export function portal(node) {
  const original = node.parentNode;
  const originalNext = node.nextSibling;
  document.body.appendChild(node);
  return {
    destroy() {
      if (original && node.isConnected) {
        if (originalNext) original.insertBefore(node, originalNext);
        else original.appendChild(node);
      }
    },
  };
}
