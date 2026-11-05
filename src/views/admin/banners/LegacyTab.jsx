import React, { useState } from "react";
import toast from "react-hot-toast";
import { MdFileDownload } from "react-icons/md";
import { Button, Card, CardHeader, StatusChip as KitStatusChip } from "../../../ui";
import api from "../../../api/api";
import { errMsg, fmtDate } from "./bannerUtils";
import { Notice } from "./ui";

const LegacyTab = ({ legacy, hasNewHero, onImported }) => {
  const [busyId, setBusyId] = useState("");
  const [done, setDone] = useState({});

  const doImport = async (b) => {
    setBusyId(b._id);
    try {
      const { data } = await api.post(`/admin/banners/legacy/${b._id}/import`);
      setDone((d) => ({ ...d, [b._id]: true }));
      onImported(data.banner);
      toast.success(data.message || "Імпортовано у «Головну карусель» (вимкнено — перевірте й увімкніть)");
    } catch (err) {
      toast.error(errMsg(err, "Не вдалося імпортувати"));
    } finally {
      setBusyId("");
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <Card className="flex flex-col gap-2">
        <CardHeader title="Старі банери продавців" />
        <p className="px-4 pb-4 text-sm text-(--ink-2) sm:px-5 sm:pb-5">
          Раніше продавці додавали банер до свого товару. Ці банери показуються на головній <b>лише як запасний варіант</b>
          — коли в «Головній каруселі» немає жодного банера, що зараз показується. Імпорт створює копію в новій системі
          (вимкнену, з посиланням на товар і alt = назва товару), після чого її можна відредагувати, додати мобільне
          зображення, розклад і увімкнути.
        </p>
      </Card>
      {hasNewHero && (
        <Notice>
          У «Головній каруселі» вже є банери, що показуються, — старі банери на сайті зараз не відображаються.
        </Notice>
      )}
      <ul className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
        {legacy.map((b) => {
          const imported = done[b._id] || b.imported;
          return (
            <li key={b._id} className="flex min-w-0 flex-col gap-2 rounded-(--r-lg) border border-(--line) bg-(--surface) p-3 text-(--ink) shadow-(--shadow-1)">
              <div className="aspect-[3/1] w-full overflow-hidden rounded-(--r-md) bg-(--surface-2)">
                {b.banner || b.image ? (
                  <img src={b.banner || b.image} alt="" className="w-full h-full object-cover" loading="lazy" />
                ) : null}
              </div>
              <span className="break-words text-sm font-medium">{b.productName || b.name || "Товар без назви"}</span>
              <span className="text-xs text-(--ink-2)">
                {b.sellerName ? `${b.sellerName} · ` : ""}
                {fmtDate(b.createdAt)}
              </span>
              {imported ? (
                <KitStatusChip tone="success" className="mt-auto self-start">
                  Імпортовано
                </KitStatusChip>
              ) : (
                <Button
                  variant="secondary"
                  icon={<MdFileDownload />}
                  loading={busyId === b._id}
                  disabled={!!busyId}
                  onClick={() => doImport(b)}
                  className="mt-auto"
                  fullWidth
                >
                  {busyId === b._id ? "Імпорт…" : "Імпортувати в нову систему"}
                </Button>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default LegacyTab;
