import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import { MdCheck, MdClose, MdInfoOutline, MdOutlineRateReview, MdStar } from "react-icons/md";
import {
  get_admin_reviews,
  review_status_update,
  messageClear,
} from "../../store/Reducers/reviewSlice";
import { Button, Card, EmptyState, Field, PageHeader, Pagination, Skeleton, StatusChip, Tabs, Textarea, formatDate } from "../../ui";

const TABS = [
  { value: "pending", label: "Очікують" },
  { value: "approved", label: "Опубліковані" },
  { value: "rejected", label: "Відхилені" },
];

const STATUS_CHIP = {
  pending: { tone: "warning", label: "Очікує модерації" },
  approved: { tone: "success", label: "Опубліковано" },
  rejected: { tone: "danger", label: "Відхилено" },
};

const EMPTY_TEXT = {
  pending: "Нових відгуків на модерацію немає.",
  approved: "Опублікованих відгуків поки немає.",
  rejected: "Відхилених відгуків немає.",
};

const PER_PAGE = 10;

function Stars({ rating }) {
  const r = Number(rating) || 0;
  return (
    <span className="inline-flex items-center gap-0.5 text-lg" role="img" aria-label={`Оцінка ${r} з 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <MdStar key={n} aria-hidden="true" className={n <= r ? "text-(--star)" : "text-(--line-strong)/50"} />
      ))}
      <span className="ml-1 text-sm font-semibold tabular-nums text-(--ink)">{r}</span>
    </span>
  );
}

const ReviewModeration = () => {
  const dispatch = useDispatch();
  const { reviews, totalReview, pendingCount, loader, successMessage, errorMessage } = useSelector((state) => state.review);

  const [status, setStatus] = useState("pending");
  const [currentPage, setCurrentPage] = useState(1);
  // Id відгуку, для якого зараз відкрито поле примітки при відхиленні
  const [rejectingId, setRejectingId] = useState(null);
  const [adminNote, setAdminNote] = useState("");
  // Id відгуку, дію над яким зараз виконуємо (для loading кнопок)
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    dispatch(get_admin_reviews({ pageNo: currentPage, status }));
  }, [dispatch, currentPage, status]);

  useEffect(() => {
    if (successMessage) {
      toast.success(successMessage);
      dispatch(messageClear());
      setRejectingId(null);
      setAdminNote("");
      dispatch(get_admin_reviews({ pageNo: currentPage, status }));
    }
    if (errorMessage) {
      toast.error(errorMessage);
      dispatch(messageClear());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [successMessage, errorMessage]);

  const changeTab = (value) => {
    setStatus(value);
    setCurrentPage(1);
    setRejectingId(null);
    setAdminNote("");
  };

  const run = (reviewId, thunk) => {
    setBusyId(reviewId);
    Promise.resolve(dispatch(thunk)).finally(() => setBusyId(null));
  };

  const approve = (reviewId) => {
    run(reviewId, review_status_update({ reviewId, status: "approved" }));
  };

  const reject = (reviewId) => {
    run(reviewId, review_status_update({ reviewId, status: "rejected", adminNote }));
  };

  const dateOf = (r) => (r.createdAt ? formatDate(r.createdAt) : r.date);
  const list = reviews || [];
  const showSkeleton = loader && list.length === 0;

  return (
    <>
      <PageHeader
        title="Модерація відгуків"
        description="Перевіряйте відгуки покупців перед публікацією."
        breadcrumbs={[{ label: "Головна", to: "/admin/dashboard" }, { label: "Відгуки" }]}
      />

      <div className="mb-4 flex min-w-0 items-start gap-3 rounded-(--r-lg) border border-(--line) bg-(--brand-soft) p-3 text-sm text-(--ink) sm:p-4">
        <MdInfoOutline aria-hidden="true" className="mt-0.5 shrink-0 text-lg text-(--brand-ink)" />
        <p className="min-w-0 break-words">
          Відхиляйте лише відгуки, що порушують правила (образи, спам, чужі персональні дані, реклама). Не відхиляйте відгуки лише за те, що вони
          негативні: це порушує вимоги споживчого законодавства. Текст відгуку редагувати не можна.
        </p>
      </div>

      <div className="mb-4 overflow-x-auto scrollbar-thin">
        <Tabs
          ariaLabel="Статус відгуків"
          idPrefix="reviews"
          value={status}
          onChange={changeTab}
          tabs={TABS.map((t) => ({ ...t, count: t.value === "pending" && pendingCount > 0 ? pendingCount : undefined }))}
        />
      </div>

      <div id={`reviews-panel-${status}`} role="tabpanel" aria-busy={loader || undefined}>
        {showSkeleton ? (
          <div className="flex flex-col gap-3">
            {[0, 1, 2].map((i) => (
              <Card key={i} padded>
                <div className="flex items-center gap-3">
                  <Skeleton width="3rem" height="3rem" />
                  <div className="flex-1">
                    <Skeleton width="40%" />
                    <Skeleton width="25%" className="mt-2" />
                  </div>
                </div>
                <Skeleton lines={3} className="mt-4" />
              </Card>
            ))}
          </div>
        ) : list.length === 0 ? (
          <Card>
            <EmptyState icon={<MdOutlineRateReview />} title="Відгуків у цьому списку немає" text={EMPTY_TEXT[status]} />
          </Card>
        ) : (
          <ul className="flex flex-col gap-3">
            {list.map((r) => {
              const chip = STATUS_CHIP[r.status || status] || STATUS_CHIP[status];
              const busy = busyId === r._id;
              return (
                <li key={r._id}>
                  <Card as="article" padded>
                    <div className="flex min-w-0 flex-wrap items-start justify-between gap-3">
                      <div className="flex min-w-0 flex-1 items-center gap-3">
                        {r.productId?.images?.[0] ? (
                          <img className="h-12 w-12 shrink-0 rounded-(--r-md) border border-(--line) object-cover" src={r.productId.images[0]} alt="" loading="lazy" />
                        ) : (
                          <span aria-hidden="true" className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-(--r-md) bg-(--surface-2) text-xl text-(--ink-2)">
                            <MdOutlineRateReview />
                          </span>
                        )}
                        <div className="min-w-0">
                          <p className="break-words font-semibold text-(--ink)">{r.productId?.name || "Товар видалено"}</p>
                          <p className="truncate text-xs text-(--ink-2)">
                            {r.name} · {dateOf(r)}
                          </p>
                        </div>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        <Stars rating={r.rating} />
                        {chip && <StatusChip tone={chip.tone}>{chip.label}</StatusChip>}
                      </div>
                    </div>

                    <p className="mt-3 whitespace-pre-wrap break-words text-[0.9375rem] leading-6 text-(--ink)">{r.review}</p>

                    {r.adminNote && (
                      <p className="mt-3 rounded-(--r-md) bg-(--surface-2) px-3 py-2 text-xs text-(--ink-2)">
                        <span className="font-medium text-(--ink)">Примітка модератора:</span> {r.adminNote}
                      </p>
                    )}

                    {rejectingId === r._id ? (
                      <form
                        className="mt-4 flex flex-col gap-3"
                        onSubmit={(e) => {
                          e.preventDefault();
                          reject(r._id);
                        }}
                      >
                        <Field label="Причина відхилення" hint="Необов'язково, бачите лише ви">
                          <Textarea value={adminNote} onChange={(e) => setAdminNote(e.target.value)} rows={2} maxLength={500} autoFocus />
                        </Field>
                        <div className="flex flex-wrap gap-2">
                          <Button type="submit" variant="danger" loading={busy}>
                            Підтвердити відхилення
                          </Button>
                          <Button
                            variant="secondary"
                            disabled={busy}
                            onClick={() => {
                              setRejectingId(null);
                              setAdminNote("");
                            }}
                          >
                            Скасувати
                          </Button>
                        </div>
                      </form>
                    ) : (
                      (status !== "approved" || status !== "rejected") && (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {status !== "approved" && (
                            <Button icon={<MdCheck />} loading={busy} onClick={() => approve(r._id)}>
                              Опублікувати
                            </Button>
                          )}
                          {status !== "rejected" && (
                            <Button
                              variant="secondary"
                              icon={<MdClose />}
                              disabled={busy}
                              onClick={() => {
                                setRejectingId(r._id);
                                setAdminNote("");
                              }}
                            >
                              Відхилити
                            </Button>
                          )}
                        </div>
                      )
                    )}
                  </Card>
                </li>
              );
            })}
          </ul>
        )}

        <Pagination page={currentPage} total={totalReview || 0} perPage={PER_PAGE} onChange={setCurrentPage} />
      </div>
    </>
  );
};

export default ReviewModeration;
