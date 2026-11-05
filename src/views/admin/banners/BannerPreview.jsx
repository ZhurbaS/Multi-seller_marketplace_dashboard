import React from "react";
import { FaImage } from "react-icons/fa";
import { sizeLabel } from "./bannerUtils";

// Візуал одного банера (image/text) у режимі desktop або mobile
export const BannerVisual = ({ b, placement, mode = "desktop", desktopUrl, mobileUrl, dismissible = false, compact = false }) => {
  if (b.kind === "text") {
    return (
      <div
        className={`w-full flex items-center justify-center gap-x-3 gap-y-1 flex-wrap text-center ${
          mode === "mobile" || compact ? "px-6 py-1.5 text-[11px]" : "px-8 py-2 text-sm"
        } relative`}
        style={{ background: b.bgColor || "#1e293b", color: b.textColor || "#ffffff" }}
      >
        <span className="font-semibold">{b.headline || "Текст оголошення"}</span>
        {b.subline && <span className="opacity-90">{b.subline}</span>}
        {b.ctaLabel && b.linkType !== "none" && (
          <span className="underline font-semibold underline-offset-2">{b.ctaLabel} →</span>
        )}
        {dismissible && (
          <span className="absolute right-2 top-1/2 -translate-y-1/2 opacity-80" aria-hidden="true">
            ✕
          </span>
        )}
      </div>
    );
  }
  const size = mode === "mobile" ? placement?.mobile || placement?.desktop : placement?.desktop;
  const src = mode === "mobile" ? mobileUrl || desktopUrl : desktopUrl;
  const ratio = size ? `${size.width} / ${size.height}` : "3 / 1";
  const hasText = b.headline || b.subline || (b.ctaLabel && b.linkType !== "none");
  return (
    <div className="relative w-full overflow-hidden rounded-(--r-sm) bg-(--surface-2)" style={{ aspectRatio: ratio }}>
      {src ? (
        <img src={src} alt={b.alt || ""} className="absolute inset-0 w-full h-full object-cover object-center" />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-(--ink-2) text-[11px] gap-1 p-1 text-center">
          <FaImage className="text-lg" aria-hidden="true" />
          <span>{sizeLabel(size)}</span>
        </div>
      )}
      {hasText && (
        <div
          className={`absolute inset-y-0 left-0 flex flex-col justify-center gap-1 text-(--on-header) ${
            mode === "mobile" || compact ? "p-2 w-[80%]" : "p-4 w-[60%]"
          }`}
          style={{ background: "linear-gradient(90deg, rgba(0,0,0,.55), rgba(0,0,0,0))" }}
        >
          {b.headline && (
            <span className={`font-bold leading-tight ${mode === "mobile" || compact ? "text-[11px]" : "text-base"}`}>{b.headline}</span>
          )}
          {b.subline && (
            <span className={`leading-snug opacity-90 ${mode === "mobile" || compact ? "text-[9px] line-clamp-2" : "text-xs"}`}>
              {b.subline}
            </span>
          )}
          {b.ctaLabel && b.linkType !== "none" && (
            <span
              className={`self-start rounded-(--r-sm) bg-(--surface) text-(--ink) font-semibold ${
                mode === "mobile" || compact ? "text-[9px] px-1.5 py-0.5" : "text-xs px-2 py-1"
              }`}
            >
              {b.ctaLabel}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

const Sk = ({ className = "" }) => <div className={`rounded-(--r-sm) bg-(--surface-2) ${className}`} />;
const Header = ({ mobile }) => (
  <div className="flex items-center justify-between px-2 py-1.5 bg-(--header-bg)">
    <span className="text-[9px] font-bold text-(--on-header)">TechScout</span>
    {!mobile && <div className="flex-1 mx-3 h-2.5 rounded bg-(--header-hover)" />}
    <span className="h-2.5 w-6 rounded bg-(--cta)" />
  </div>
);
const Tiles = ({ n = 4 }) => (
  <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }}>
    {Array.from({ length: n }).map((_, i) => (
      <div key={i} className="flex flex-col gap-1">
        <Sk className="aspect-square" />
        <Sk className="h-1.5 w-3/4" />
      </div>
    ))}
  </div>
);

// Рамка-імітація місця розміщення: показує банер у контексті сторінки
export const PlacementFrame = ({ placementId, mode, children, highlight = true }) => {
  const mobile = mode === "mobile";
  const slot = (
    <div className={highlight ? "rounded-(--r-sm) ring-2 ring-(--brand) ring-offset-1 ring-offset-(--surface)" : ""} aria-label="Місце банера">
      {children}
    </div>
  );
  let body;
  switch (placementId) {
    case "announcement":
      body = (
        <>
          {slot}
          <Header mobile={mobile} />
          <div className="p-2 flex flex-col gap-1.5">
            <Sk className="h-12" />
            <Tiles n={mobile ? 2 : 4} />
          </div>
        </>
      );
      break;
    case "home_hero":
      body = (
        <>
          <Header mobile={mobile} />
          <div className="p-2 flex flex-col gap-1.5">
            {slot}
            <Tiles n={mobile ? 2 : 5} />
          </div>
        </>
      );
      break;
    case "home_mid":
      body = (
        <>
          <Header mobile={mobile} />
          <div className="p-2 flex flex-col gap-1.5">
            <Sk className="h-8" />
            <Tiles n={mobile ? 2 : 5} />
            {slot}
            <Tiles n={mobile ? 2 : 5} />
          </div>
        </>
      );
      break;
    case "catalog_top":
      body = (
        <>
          <Header mobile={mobile} />
          <div className="p-2 flex gap-2">
            {!mobile && (
              <div className="w-1/5 flex flex-col gap-1">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Sk key={i} className="h-1.5" />
                ))}
              </div>
            )}
            <div className="flex-1 flex flex-col gap-1.5 min-w-0">
              {slot}
              <Tiles n={mobile ? 2 : 4} />
            </div>
          </div>
        </>
      );
      break;
    case "product_promo":
      body = (
        <>
          <Header mobile={mobile} />
          <div className={`p-2 flex gap-2 ${mobile ? "flex-col" : ""}`}>
            <Sk className={mobile ? "aspect-square" : "w-1/2 aspect-square"} />
            <div className={`flex flex-col gap-1.5 ${mobile ? "" : "w-1/2"}`}>
              <Sk className="h-2.5 w-4/5" />
              <Sk className="h-2 w-1/3" />
              <div className="h-4 w-1/2 rounded bg-(--cta)" />
              {slot}
            </div>
          </div>
        </>
      );
      break;
    case "cart_promo":
      body = (
        <>
          <Header mobile={mobile} />
          <div className="p-2 flex flex-col gap-1.5">
            {slot}
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex gap-1.5 items-center">
                <Sk className="w-6 h-6" />
                <Sk className="h-1.5 flex-1" />
              </div>
            ))}
          </div>
        </>
      );
      break;
    default:
      body = <div className="p-2">{slot}</div>;
  }
  return (
    <div
      className={`overflow-hidden bg-(--surface) shadow-(--shadow-2) ${
        mobile ? "mx-auto w-[260px] max-w-full rounded-[18px] border-4 border-(--ink)" : "w-full rounded-(--r-md) border border-(--line)"
      }`}
    >
      {!mobile && (
        <div className="flex items-center gap-1 px-2 py-1 bg-(--surface-2)" aria-hidden="true">
          <span className="w-1.5 h-1.5 rounded-full bg-(--danger)" />
          <span className="w-1.5 h-1.5 rounded-full bg-(--warning)" />
          <span className="w-1.5 h-1.5 rounded-full bg-(--success)" />
        </div>
      )}
      {body}
    </div>
  );
};
