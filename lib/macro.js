// Compile a roff macro.
export function macro(name, value = '') {
  if (value && value.charAt(0) !== '\n') {
    value = ' ' + value
  }

  return '.' + name + value
}
