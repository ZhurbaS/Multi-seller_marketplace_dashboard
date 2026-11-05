import React from "react";
import { PLACEMENT_COLORS, sizeLabel } from "./bannerUtils";
import { Card, CardHeader } from "../../../ui";

// Каркаси сторінок: які плейсменти де розташовані
const PAGES = [
  { id: "home", title: "Головна", slots: ["announcement", "home_hero", "home_mid"] },
  { id: "catalog", title: "Каталог / пошук / категорія", slots: ["announcement", "catalog_top"] },
  { id: "product", title: "Сторінка товару", slots: ["announcement", "product_promo"] },
  { id: "cart", title: "Кошик", slots: ["announcement", "cart_promo"] },
];

const Sk = ({ className = "" }) => <div className={`rounded-sm bg-(--line) ${className}`} aria-hidden="true" />;
const Row = ({ n = 4 }) => (
  <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${n}, minmax(0,1fr))` }} aria-hidden="true">
    {Array.from({ length: n }).map((_, i) => (
      <Sk key={i} className="aspect-[4/5]" />
    ))}
  </div>
);

const Slot = ({ p, onOpen, className = "", stat }) => {
  if (!p) return null;
  const color = PLACEMENT_COLORS[p.id] || "var(--chart-1)";
  return (
    <button
      type="button"
      onClick={() => onOpen(p.id)}
      className={`flex w-full items-center justify-center rounded-sm px-1 py-1 text-center text-[10px] font-semibold leading-tight text-(--on-brand) hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-(--brand) ${className}`}
      style={{ background: color, textShadow: "0 1px 2px rgba(0,0,0,.45)" }}
      title={`${p.name} — відкрити`}
      aria-label={`${p.name}: ${stat}. Відкрити вкладку`}
    >
      {p.name}
    </button>
  );
};

const SiteMap = ({ placements, stats, onOpen }) => {
  const byId = Object.fromEntries(placements.map((p) => [p.id, p]));
  const st = (id) => `${stats[id]?.live || 0} показується з ${stats[id]?.total || 0}`;
  const S = (id, cls) => <Slot p={byId[id]} onOpen={onOpen} className={cls} stat={st(id)} />;
  const header = <div className="h-3 rounded-sm bg-(--line-strong)" aria-hidden="true" />;

  const wire = {
    home: (
      <>
        {S("announcement", "h-4")}
        {header}
        {S("home_hero", "aspect-[3/1]")}
        <Row n={5} />
        {S("home_mid", "aspect-[4/1]")}
        <Row n={5} />
      </>
    ),
    catalog: (
      <>
        {S("announcement", "h-4")}
        {header}
        <div className="flex gap-1">
          <div className="w-1/5 flex flex-col gap-1" aria-hidden="true">
            {Array.from({ length: 7 }).map((_, i) => (
              <Sk key={i} className="h-1.5" />
            ))}
          </div>
          <div className="flex-1 flex flex-col gap-1">
            {S("catalog_top", "aspect-[5/1]")}
            <Row n={4} />
            <Row n={4} />
          </div>
        </div>
      </>
    ),
    product: (
      <>
        {S("announcement", "h-4")}
        {header}
        <div className="flex gap-1">
          <Sk className="w-1/2 aspect-square" />
          <div className="w-1/2 flex flex-col gap-1">
            <Sk className="h-2 w-4/5" />
            <Sk className="h-2 w-1/3" />
            <div className="h-3 w-1/2 rounded-sm bg-(--cta)" aria-hidden="true" />
            {S("product_promo", "aspect-[2/1]")}
          </div>
        </div>
        <Row n={5} />
      </>
    ),
    cart: (
      <>
        {S("announcement", "h-4")}
        {header}
        <div className="flex gap-1">
          <div className="flex-1 flex flex-col gap-1">
            {S("cart_promo", "aspect-[5/1]")}
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex gap-1 items-center" aria-hidden="true">
                <Sk className="w-5 h-5" />
                <Sk className="h-1.5 flex-1" />
              </div>
            ))}
          </div>
          <Sk className="w-1/4 h-16" />
        </div>
      </>
    ),
  };

  return (
    <div className="flex flex-col gap-4">
      <Card className="pb-4 sm:pb-5">
        <CardHeader
          title="Де показуються банери"
          description={
            <>
              Кольорові блоки — місця для банерів (плейсменти). Натисніть блок, щоб перейти до його банерів. Стрічка
              оголошення показується над шапкою на <b>усіх</b> сторінках.
            </>
          }
        />
      </Card>

      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {PAGES.map((pg) => (
          <Card key={pg.id} padded className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold text-(--ink)">{pg.title}</h3>
            <div className="flex flex-col gap-1 rounded-(--r-md) border border-(--line) bg-(--surface-2) p-1.5">{wire[pg.id]}</div>
            <ul className="flex flex-col gap-2 text-xs text-(--ink-2)">
              {pg.slots
                .filter((id) => byId[id])
                .map((id) => {
                  const p = byId[id];
                  return (
                    <li key={id} className="flex gap-2">
                      <span
                        className="w-3 h-3 mt-0.5 rounded-sm shrink-0"
                        style={{ background: PLACEMENT_COLORS[id] }}
                        aria-hidden="true"
                      />
                      <span className="flex flex-col">
                        <button type="button" onClick={() => onOpen(id)} className="min-h-6 self-start text-left font-semibold text-(--brand-ink) underline-offset-2 hover:underline">
                          {p.name}
                        </button>
                        {p.kind === "text" ? (
                          <span>Текстова смуга (без зображення)</span>
                        ) : (
                          <>
                            <span>ПК: {sizeLabel(p.desktop)}</span>
                            <span>Мобільний: {sizeLabel(p.mobile)}</span>
                          </>
                        )}
                        <span>
                          Ліміт показу: {p.max} · {st(id)}
                        </span>
                      </span>
                    </li>
                  );
                })}
            </ul>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default SiteMap;
