import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { MdArrowBack, MdChatBubbleOutline, MdSearch, MdSend, MdStorefront } from "react-icons/md";
import {
  get_admin_message,
  get_sellers,
  messageClear,
  send_message_seller_admin,
  updateSellerMessage,
} from "../../store/Reducers/chatSlice";
import { socket } from "../../utils/utils";
import { PageHeader, Input, Button, IconButton, EmptyState, cx, formatDate } from "../../ui";

const Avatar = ({ src, name, online, size = "md" }) => (
  <span className={cx("relative inline-flex shrink-0", size === "sm" ? "h-9 w-9" : "h-10 w-10")}>
    {src ? (
      <img src={src} alt="" className="h-full w-full rounded-full border border-(--line) object-cover" />
    ) : (
      <span className="flex h-full w-full items-center justify-center rounded-full bg-(--brand-soft) text-sm font-semibold text-(--brand-ink)" aria-hidden="true">
        {String(name || "?").slice(0, 1).toUpperCase()}
      </span>
    )}
    {online && (
      <span className="absolute right-0 bottom-0 h-2.5 w-2.5 rounded-full border-2 border-(--surface) bg-(--success)" aria-label="онлайн" />
    )}
  </span>
);

const ChatSeller = () => {
  const scrollRef = useRef(null);
  const { sellerId } = useParams();
  const [text, setText] = useState("");
  const [q, setQ] = useState("");
  const [receiverMessage, setReceiverMessage] = useState("");

  const { sellers, activeSeller, seller_admin_message, currentSeller, successMessage } = useSelector((state) => state.chat);
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(get_sellers());
  }, [dispatch]);

  const send = (e) => {
    e.preventDefault();
    if (!sellerId || !text.trim()) return;
    dispatch(
      send_message_seller_admin({
        senderId: "",
        receiverId: sellerId,
        message: text,
        senderName: "Підтримка адміна",
      }),
    );
    setText("");
  };

  useEffect(() => {
    if (sellerId) dispatch(get_admin_message(sellerId));
  }, [sellerId, dispatch]);

  useEffect(() => {
    if (successMessage) {
      socket.emit("send_message_admin_to_seller", seller_admin_message[seller_admin_message.length - 1]);
      dispatch(messageClear());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [successMessage]);

  useEffect(() => {
    const onMsg = (msg) => setReceiverMessage(msg);
    socket.on("received_seller_message", onMsg);
    return () => socket.off("received_seller_message", onMsg);
  }, []);

  useEffect(() => {
    if (receiverMessage) {
      if (receiverMessage.senderId === sellerId && receiverMessage.receiverId === "") {
        dispatch(updateSellerMessage(receiverMessage));
      } else {
        toast.success(`${receiverMessage.senderName} надіслав повідомлення`);
        dispatch(messageClear());
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [receiverMessage]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [seller_admin_message]);

  const isOnline = (id) => (activeSeller || []).some((a) => a.sellerId === id);
  const list = (sellers || []).filter((s) => !q || String(s.name || "").toLowerCase().includes(q.toLowerCase()));

  return (
    <div>
      <PageHeader
        title="Чат із продавцями"
        description="Підтримка продавців у реальному часі."
        breadcrumbs={[{ label: "Огляд", to: "/admin/dashboard" }, { label: "Чат із продавцями" }]}
      />

      <div className="flex h-[calc(100dvh-220px)] min-h-[420px] min-w-0 overflow-hidden rounded-(--r-lg) border border-(--line) bg-(--surface) shadow-(--shadow-1)">
        {/* Список продавців: на мобільних — окремий екран, коли співрозмовника не обрано */}
        <aside
          aria-label="Продавці"
          className={cx("flex min-w-0 flex-col border-(--line) md:w-72 md:shrink-0 md:border-r", sellerId ? "hidden md:flex" : "flex w-full")}
        >
          <div className="border-b border-(--line) p-3">
            <Input
              type="search"
              inputMode="search"
              size="sm"
              aria-label="Пошук продавця"
              placeholder="Пошук продавця"
              leftIcon={<MdSearch />}
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <nav className="min-h-0 flex-1 overflow-y-auto p-2">
            {list.length === 0 ? (
              <EmptyState compact icon={<MdStorefront />} title={q ? "Нічого не знайдено" : "Продавців поки немає"} />
            ) : (
              list.map((s) => (
                <Link
                  key={s._id}
                  to={`/admin/dashboard/chat-sellers/${s._id}`}
                  aria-current={sellerId === s._id ? "page" : undefined}
                  className={cx(
                    "flex min-h-[52px] min-w-0 items-center gap-3 rounded-(--r-md) px-2.5 py-2 text-sm",
                    sellerId === s._id ? "bg-(--brand-soft) text-(--brand-ink)" : "text-(--ink) hover:bg-(--surface-2)",
                  )}
                >
                  <Avatar src={s.image} name={s.name} online={isOnline(s._id)} size="sm" />
                  <span className="min-w-0 flex-1 truncate font-medium">{s.name}</span>
                </Link>
              ))
            )}
          </nav>
        </aside>

        <section aria-label="Повідомлення" className={cx("min-w-0 flex-1 flex-col", sellerId ? "flex" : "hidden md:flex")}>
          {sellerId ? (
            <>
              <header className="flex min-w-0 items-center gap-3 border-b border-(--line) px-3 py-2.5 sm:px-4">
                <IconButton as={Link} to="/admin/dashboard/chat-sellers" icon={<MdArrowBack />} label="До списку продавців" className="md:hidden" />
                <Avatar src={currentSeller?.image} name={currentSeller?.name} online={isOnline(sellerId)} />
                <div className="min-w-0">
                  <p className="truncate font-semibold text-(--ink)">{currentSeller?.name || "Продавець"}</p>
                  <p className="text-xs text-(--ink-2)">{isOnline(sellerId) ? "онлайн" : "не в мережі"}</p>
                </div>
              </header>

              <div className="min-h-0 flex-1 space-y-2 overflow-y-auto bg-(--surface-2) p-3 sm:p-4" role="log" aria-live="polite">
                {(seller_admin_message || []).length === 0 ? (
                  <EmptyState compact icon={<MdChatBubbleOutline />} title="Повідомлень ще немає" text="Напишіть продавцю першим." />
                ) : (
                  seller_admin_message.map((m, i) => {
                    const fromSeller = m.senderId === sellerId;
                    return (
                      <div key={m._id || i} className={cx("flex min-w-0", fromSeller ? "justify-start" : "justify-end")}>
                        <div
                          className={cx(
                            "max-w-[85%] min-w-0 rounded-(--r-lg) px-3 py-2 text-sm shadow-(--shadow-1) lg:max-w-[70%]",
                            fromSeller ? "rounded-bl-(--r-sm) bg-(--surface) text-(--ink)" : "rounded-br-(--r-sm) bg-(--brand) text-(--on-brand)",
                          )}
                        >
                          <p className="break-words whitespace-pre-wrap">{m.message}</p>
                          {m.createdAt && (
                            <p className={cx("mt-1 text-[11px] tabular-nums", fromSeller ? "text-(--ink-2)" : "opacity-80")}>
                              {formatDate(m.createdAt, { withTime: true })}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={scrollRef} />
              </div>

              <form onSubmit={send} className="flex min-w-0 gap-2 border-t border-(--line) p-3">
                <Input
                  className="min-w-0 flex-1"
                  aria-label="Повідомлення"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Введіть повідомлення"
                  autoComplete="off"
                  enterKeyHint="send"
                />
                <Button type="submit" icon={<MdSend />} disabled={!text.trim()}>
                  <span className="hidden sm:inline">Надіслати</span>
                </Button>
              </form>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center p-6">
              <EmptyState icon={<MdChatBubbleOutline />} title="Оберіть продавця" text="Виберіть співрозмовника зі списку ліворуч, щоб відкрити листування." />
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default ChatSeller;
