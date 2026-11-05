import React, { useCallback, useEffect, useMemo, useState } from "react";
import { MdAdd, MdErrorOutline, MdRefresh } from "react-icons/md";
import { useSearchParams } from "react-router-dom";
import api from "../../api/api";
import {
  DEFAULT_LIMITS,
  DEFAULT_SETTINGS,
  PLACEMENT_COLORS,
  errMsg,
  mergeSettings,
  normalizePlacements,
  statusOf,
} from "./banners/bannerUtils";
import { Button, Card, PageHeader, Skeleton, Tabs, cx } from "../../ui";
import SiteMap from "./banners/SiteMap";
import PlacementTab from "./banners/PlacementTab";
import BannerForm from "./banners/BannerForm";
import SettingsTab from "./banners/SettingsTab";
import LegacyTab from "./banners/LegacyTab";

const bySort = (a, b) =>
  (Number(a.sort) || 0) - (Number(b.sort) || 0) || new Date(b.createdAt || 0) - new Date(a.createdAt || 0);

const Banners = () => {
  const [params, setParams] = useSearchParams();
  const [placements, setPlacements] = useState(null);
  const [limits, setLimits] = useState(DEFAULT_LIMITS);
  const [banners, setBanners] = useState([]);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [legacy, setLegacy] = useState([]);
  const [categories, setCategories] = useState([]);
  const [catError, setCatError] = useState("");
  const [loadError, setLoadError] = useState("");
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // { placementId, banner|null }

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    const [meta, list, sett, leg, cats] = await Promise.allSettled([
      api.get("/admin/banners/meta"),
      api.get("/admin/banners", { params: { placement: "" } }),
      api.get("/admin/settings/banners"),
      api.get("/admin/banners/legacy"),
      api.get("/category-get"),
    ]);
    setPlacements(normalizePlacements(meta.status === "fulfilled" ? meta.value.data.placements : null));
    if (meta.status === "fulfilled" && meta.value.data.limits) setLimits({ ...DEFAULT_LIMITS, ...meta.value.data.limits });
    if (list.status === "fulfilled") {
      setBanners(list.value.data.banners || []);
    } else {
      setLoadError(errMsg(list.reason, "Не вдалося завантажити банери"));
    }
    const s =
      sett.status === "fulfilled"
        ? sett.value.data.settings
        : list.status === "fulfilled"
        ? list.value.data.settings
        : null;
    setSettings(mergeSettings(s));
    setLegacy(leg.status === "fulfilled" ? leg.value.data.banners || [] : []);
    if (cats.status === "fulfilled") {
      setCategories((cats.value.data.categories || []).map((c) => c.name).filter(Boolean).sort((a, b) => a.localeCompare(b, "uk")));
      setCatError("");
    } else setCatError("Не вдалося завантажити категорії");
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const grouped = useMemo(() => {
    const g = {};
    (placements || []).forEach((p) => (g[p.id] = []));
    banners.forEach((b) => {
      if (g[b.placement]) g[b.placement].push(b);
    });
    Object.values(g).forEach((arr) => arr.sort(bySort));
    return g;
  }, [banners, placements]);

  const stats = useMemo(() => {
    const out = {};
    Object.entries(grouped).forEach(([id, arr]) => {
      out[id] = { total: arr.length, live: arr.filter((b) => statusOf(b) === "live").length };
    });
    return out;
  }, [grouped]);

  const tabs = useMemo(() => {
    const t = [{ id: "map", label: "Карта сайту" }];
    (placements || []).forEach((p) => t.push({ id: p.id, label: p.name, placement: p }));
    t.push({ id: "settings", label: "Налаштування" });
    if (legacy.length) t.push({ id: "legacy", label: "Старі банери продавців", count: legacy.length });
    return t;
  }, [placements, legacy.length]);

  const tabParam = params.get("tab");
  const tab = tabs.some((t) => t.id === tabParam) ? tabParam : "map";
  const setTab = useCallback(
    (id) => {
      setParams((p) => {
        const n = new URLSearchParams(p);
        n.set("tab", id);
        return n;
      });
    },
    [setParams]
  );

  const onSaved = (banner, isNew) => {
    if (banner) {
      setBanners((all) =>
        isNew
          ? [...all, { ...banner, sort: banner.sort ?? Math.max(0, ...all.filter((x) => x.placement === banner.placement).map((x) => Number(x.sort) || 0)) + 1 }]
          : all.map((x) => (x._id === banner._id ? banner : x))
      );
    } else {
      load();
    }
    setEditing(null);
  };

  const closeForm = useCallback(() => setEditing(null), []);

  const current = tabs.find((t) => t.id === tab);
  const placement = current?.placement;
  const editPlacement = editing && placements?.find((p) => p.id === editing.placementId);
  const heroLive = stats.home_hero?.live || 0;

  const kitTabs = tabs.map((t) => {
    const st = t.placement ? stats[t.id] : null;
    return {
      value: t.id,
      count: t.count || undefined,
      label: (
        <span className="inline-flex items-center gap-2">
          {t.placement && (
            <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: PLACEMENT_COLORS[t.id] || "var(--chart-1)" }} aria-hidden="true" />
          )}
          {t.label}
          {st && (
            <span
              className={cx(
                "rounded-full px-1.5 text-xs tabular-nums",
                st.live ? "bg-(--success-soft) text-(--success)" : "bg-(--surface-2) text-(--ink-2)"
              )}
              title={`${st.live} показується з ${st.total}`}
            >
              <span className="sr-only">показується </span>
              {st.live}/{st.total}
            </span>
          )}
        </span>
      ),
    };
  });

  return (
    <div className="flex min-w-0 flex-col gap-4 pb-10">
      <PageHeader
        title="Банери"
        description="Рекламні банери й оголошення на сайті: де показуються, за розкладом, для яких пристроїв і аудиторії. Перегляди й кліки рахуються автоматично."
        breadcrumbs={[{ label: "Налаштування сайту" }, { label: "Банери" }]}
        actions={
          placement ? (
            <Button icon={<MdAdd />} onClick={() => setEditing({ placementId: placement.id, banner: null })}>
              Новий банер
            </Button>
          ) : null
        }
        className="mb-0 sm:mb-0"
      />

      {loading && !placements ? (
        <Card padded className="flex flex-col gap-3" aria-busy="true">
          <span className="sr-only">Завантаження банерів…</span>
          <Skeleton className="h-11 w-full" />
          <Skeleton className="h-40 w-full" />
          <Skeleton lines={3} />
        </Card>
      ) : (
        <>
          {loadError && (
            <div
              role="alert"
              className="flex min-w-0 flex-wrap items-center justify-between gap-3 rounded-(--r-md) border-l-4 border-(--danger) bg-(--danger-soft) p-3 text-sm text-(--ink)"
            >
              <span className="inline-flex min-w-0 items-start gap-2">
                <MdErrorOutline aria-hidden="true" className="mt-0.5 shrink-0 text-lg text-(--danger)" />
                <span className="min-w-0 break-words">{loadError}</span>
              </span>
              <Button size="sm" variant="secondary" icon={<MdRefresh />} onClick={load}>
                Спробувати ще раз
              </Button>
            </div>
          )}

          <Tabs tabs={kitTabs} value={tab} onChange={(id) => setTab(id)} ariaLabel="Розділи банерів" idPrefix="bn" />

          <div id={`bn-panel-${tab}`} role="tabpanel" aria-labelledby={`bn-tab-${tab}`} tabIndex={-1} className="min-w-0 outline-none">
            {tab === "map" && <SiteMap placements={placements} stats={stats} onOpen={(id) => {
                  setTab(id);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }} />}
            {placement && (
              <PlacementTab
                key={placement.id}
                placement={placement}
                banners={grouped[placement.id] || []}
                setBanners={setBanners}
                settings={settings}
                legacyCount={heroLive ? 0 : legacy.length}
                onCreate={() => setEditing({ placementId: placement.id, banner: null })}
                onEdit={(b) => setEditing({ placementId: placement.id, banner: b })}
              />
            )}
            {tab === "settings" && <SettingsTab settings={settings} onSaved={setSettings} />}
            {tab === "legacy" && (
              <LegacyTab legacy={legacy} hasNewHero={heroLive > 0} onImported={(b) => b && setBanners((all) => [...all, b])} />
            )}
          </div>
        </>
      )}

      {editing && editPlacement && (
        <BannerForm
          key={editing.banner?._id || `new-${editing.placementId}`}
          placement={editPlacement}
          banner={editing.banner}
          categories={categories}
          catError={catError}
          limits={limits}
          settings={settings}
          onSaved={onSaved}
          onClose={closeForm}
        />
      )}
    </div>
  );
};

export default Banners;
