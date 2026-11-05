/** Склеює класи, ігноруючи falsy. */
export function cx(...parts) {
  return parts.flat(Infinity).filter(Boolean).join(" ");
}
