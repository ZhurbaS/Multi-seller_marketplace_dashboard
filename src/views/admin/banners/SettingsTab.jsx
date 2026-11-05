import React, { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { MdSave, MdUndo } from "react-icons/md";
import api from "../../../api/api";
import { errMsg, mergeSettings } from "./bannerUtils";
import { Button, Card, CardBody, CardHeader, Field, Input, StickyActions, useUnsavedChanges } from "../../../ui";
import { Toggle } from "./ui";

const toForm = (settings) => ({
  ...settings,
  home_hero: { ...settings.home_hero, intervalSec: String(settings.home_hero.intervalSec) },
});

const SettingsTab = ({ settings, onSaved }) => {
  const initial = useMemo(() => toForm(settings), [settings]);
  const [s, setS] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [touched, setTouched] = useState(false);
  const interval = Number(s.home_hero.intervalSec);
  const intervalErr = !Number.isInteger(interval) || interval < 3 || interval > 15 ? "Ціле число від 3 до 15 секунд." : "";
  const dirty = JSON.stringify(s) !== JSON.stringify(initial);
  useUnsavedChanges(dirty);

  const save = async (e) => {
    e?.preventDefault();
    setTouched(true);
    if (intervalErr) return toast.error("Перевірте інтервал автопрокрутки");
    setBusy(true);
    try {
      const payload = { home_hero: { ...s.home_hero, intervalSec: interval }, announcement: s.announcement };
      const { data } = await api.put("/admin/settings/banners", payload);
      const next = mergeSettings(data.settings || payload);
      onSaved(next);
      setS(toForm(next));
      setTouched(false);
      toast.success(data.message || "Налаштування збережено");
    } catch (err) {
      toast.error(errMsg(err, "Не вдалося зберегти налаштування"));
    } finally {
      setBusy(false);
    }
  };

  const hh = (p) => setS((x) => ({ ...x, home_hero: { ...x.home_hero, ...p } }));
  const showErr = (touched || s.home_hero.intervalSec !== initial.home_hero.intervalSec) && s.home_hero.autoplay ? intervalErr : "";

  return (
    <form onSubmit={save} noValidate className="flex max-w-[760px] flex-col gap-4">
      <Card>
        <CardHeader title="Головна карусель" description="Як прокручуються слайди банерів на головній сторінці." />
        <CardBody className="flex flex-col gap-4">
          <Toggle checked={!!s.home_hero.autoplay} onChange={(v) => hh({ autoplay: v })} label="Автопрокрутка слайдів" />
          <div className="max-w-[260px]">
            <Field
              label="Інтервал, секунд"
              error={showErr}
              hint="Рекомендовано 5–8 с. Прокрутка зупиняється при наведенні та фокусі."
            >
              <Input
                id="bn-interval"
                type="number"
                inputMode="numeric"
                min="3"
                max="15"
                step="1"
                disabled={!s.home_hero.autoplay}
                value={s.home_hero.intervalSec}
                onChange={(e) => hh({ intervalSec: e.target.value })}
                onBlur={() => setTouched(true)}
                invalid={!!showErr}
              />
            </Field>
          </div>
          <p className="text-sm text-(--ink-2)">
            Дослідження (NN/g) показують, що після першого слайда банери клікають рідко, а занадто швидка прокрутка заважає
            читати. Тримайте до 5–6 слайдів і ставте найважливіший першим.
          </p>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Стрічка оголошення" description="Тонка смуга над шапкою на всіх сторінках." />
        <CardBody className="flex flex-col gap-3">
          <Toggle
            checked={!!s.announcement.dismissible}
            onChange={(v) => setS((x) => ({ ...x, announcement: { ...x.announcement, dismissible: v } }))}
            label="Відвідувач може закрити стрічку (✕)"
          />
          <p className="text-sm text-(--ink-2)">
            Закриття запам'ятовується в браузері для конкретного оголошення: нове оголошення знову з'явиться.
          </p>
        </CardBody>
      </Card>

      <StickyActions dirty={dirty}>
        <Button
          variant="secondary"
          icon={<MdUndo />}
          disabled={!dirty || busy}
          onClick={() => {
            setS(initial);
            setTouched(false);
          }}
        >
          Скасувати зміни
        </Button>
        <Button type="submit" icon={<MdSave />} loading={busy} disabled={!dirty}>
          Зберегти налаштування
        </Button>
      </StickyActions>
    </form>
  );
};

export default SettingsTab;
