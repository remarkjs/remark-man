// Wrap `value` with double quotes, and escape internal double quotes.
export function quote(value) {
  return '"' + String(value).replace(/"/g, '\\"') + '"'
}
