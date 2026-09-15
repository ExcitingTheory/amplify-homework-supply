export function getAsyncContentState({ loaded, error, items = [] }) {
  if (error) return "error";
  if (!loaded) return "loading";
  return items.length > 0 ? "success-with-data" : "success-empty";
}
