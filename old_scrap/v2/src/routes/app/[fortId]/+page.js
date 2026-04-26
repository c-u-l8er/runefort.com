/** @type {import('./$types').PageLoad} */
export function load({ params }) {
  return { fortId: params.fortId };
}
