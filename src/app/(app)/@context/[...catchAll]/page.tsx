// No context row here. Pages without an open object must match a slot that renders nothing:
// on client-side navigation a slot otherwise keeps showing the previous page's row.
export default function NoContextRow() {
  return null;
}
