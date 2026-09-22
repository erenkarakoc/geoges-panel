// No overlay here. Without this, a slot keeps its previous page on client-side navigation, so a
// dialog would stay open after moving on.
export default function NoModal() {
  return null;
}
