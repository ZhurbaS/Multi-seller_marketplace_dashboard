// Допоміжне для оболонки: групування меню та активний пункт.

/** Групує пункти за `group`, зберігаючи порядок першої появи; без групи — на початку. */
export function groupNav(items = []) {
  const order = [];
  const map = new Map();
  for (const it of items) {
    const g = it.group || "";
    if (!map.has(g)) {
      map.set(g, []);
      order.push(g);
    }
    map.get(g).push(it);
  }
  order.sort((a, b) => (a === "" ? -1 : b === "" ? 1 : 0));
  return order.map((g) => ({ group: g, items: map.get(g) }));
}

/** Активний пункт: точний збіг або найдовший path-префікс (по сегментах). */
export function findActive(items = [], pathname = "") {
  let best = null;
  for (const it of items) {
    if (!it.path) continue;
    if (pathname === it.path || pathname.startsWith(`${it.path}/`)) {
      if (!best || it.path.length > best.path.length) best = it;
    }
  }
  return best;
}
