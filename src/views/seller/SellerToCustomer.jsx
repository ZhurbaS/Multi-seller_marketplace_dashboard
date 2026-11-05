import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import { MdArrowBack, MdChatBubbleOutline, MdPeopleOutline, MdSearch } from "react-icons/md";
import { get_customer_message, get_customers, messageClear, send_message, updateMessage } from "../../store/Reducers/chatSlice";
import { socket } from "../../utils/utils";
import { EmptyState, IconButton, Input, PageHeader, cx } from "../../ui";
import { Avatar, Composer, MessageList } from "../../components/seller/ChatKit";

const SellerToCustomer = () => {
  const dispatch = useDispatch();

  const { userInfo } = useSelector((state) => state.auth);
  const { customers, messages, currentCustomer, successMessage } = useSelector((state) => state.chat);
  const [text, setText] = useState("");
  const [q, setQ] = useState("");

  const { customerId } = useParams();
  const [receiverMessage, setReceiverMessage] = useState("");

  useEffect(() => {
    if (userInfo?._id) dispatch(get_customers(userInfo._id));
  }, [dispatch, userInfo?._id]);

  useEffect(() => {
    if (customerId) dispatch(get_customer_message(customerId));
  }, [customerId, dispatch]);

  const send = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    dispatch(
      send_message({
        senderId: userInfo._id,
        receiverId: customerId,
        text,
        name: userInfo?.shopInfo?.shopName,
      }),
    );
    setText("");
  };

  useEffect(() => {
    if (successMessage) {
      socket.emit("send_seller_message", messages[messages.length - 1]);
      dispatch(messageClear());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [successMessage]);

  useEffect(() => {
    const onMsg = (msg) => setReceiverMessage(msg);
    socket.on("customer_message", onMsg);
    return () => socket.off("customer_message", onMsg);
  }, []);

  useEffect(() => {
    if (receiverMessage) {
      if (customerId === receiverMessage.senderId && userInfo._id === receiverMessage.receiverId) {
        dispatch(updateMessage(receiverMessage));
      } else {
        toast.success(`${receiverMessage.senderName} надіслав повідомлення`);
        dispatch(messageClear());
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [receiverMessage]);

  const list = (customers || []).filter((c) => !q || String(c.name || "").toLowerCase().includes(q.toLowerCase()));
  const activeName = currentCustomer?.name || (customers || []).find((c) => c.fdId === customerId)?.name || "Покупець";

  return (
    <div className="mx-auto w-full">
      <PageHeader title="Чат з покупцями" description="Відповідайте на запитання покупців про товари й замовлення." />

      <div className="flex h-[calc(100dvh-220px)] min-h-[420px] min-w-0 overflow-hidden rounded-(--r-lg) border border-(--line) bg-(--surface) shadow-(--shadow-1)">
        {/* Список покупців: на мобільних — окремий екран, поки співрозмовника не обрано */}
        <aside aria-label="Покупці" className={cx("min-w-0 flex-col border-(--line) md:flex md:w-72 md:shrink-0 md:border-r", customerId ? "hidden" : "flex w-full")}>
          <div className="border-b border-(--line) p-3">
            <Input
              type="search"
              inputMode="search"
              size="sm"
              aria-label="Пошук покупця"
              placeholder="Пошук покупця"
              leftIcon={<MdSearch />}
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <nav className="min-h-0 flex-1 overflow-y-auto p-2">
            {list.length === 0 ? (
              <EmptyState
                compact
                icon={<MdPeopleOutline />}
                title={q ? "Нічого не знайдено" : "Розмов поки немає"}
                text={q ? undefined : "Коли покупець напише вам зі сторінки товару, розмова з'явиться тут."}
              />
            ) : (
              list.map((c, i) => (
                <Link
                  key={c.fdId || i}
                  to={`/seller/dashboard/chat-customer/${c.fdId}`}
                  aria-current={customerId === c.fdId ? "page" : undefined}
                  className={cx(
                    "flex min-h-[52px] min-w-0 items-center gap-3 rounded-(--r-md) px-2.5 py-2 text-sm",
                    customerId === c.fdId ? "bg-(--brand-soft) text-(--brand-ink)" : "text-(--ink) hover:bg-(--surface-2)",
                  )}
                >
                  <Avatar src={c.image} name={c.name} size="sm" />
                  <span className="min-w-0 flex-1 truncate font-medium">{c.name}</span>
                </Link>
              ))
            )}
          </nav>
        </aside>

        <section aria-label="Повідомлення" className={cx("min-w-0 flex-1 flex-col md:flex", customerId ? "flex" : "hidden")}>
          {customerId ? (
            <>
              <header className="flex min-w-0 items-center gap-3 border-b border-(--line) px-3 py-2.5 sm:px-4">
                <IconButton as={Link} to="/seller/dashboard/chat-customer" icon={<MdArrowBack />} label="До списку покупців" className="md:hidden" />
                <Avatar src={currentCustomer?.image} name={activeName} />
                <p className="min-w-0 truncate font-semibold text-(--ink)">{activeName}</p>
              </header>
              <MessageList messages={messages || []} isMine={(m) => m.senderId !== customerId} emptyText="Напишіть покупцю першим." />
              <Composer value={text} onChange={setText} onSubmit={send} />
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center p-6">
              <EmptyState icon={<MdChatBubbleOutline />} title="Оберіть покупця" text="Виберіть співрозмовника зі списку ліворуч, щоб відкрити листування." />
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default SellerToCustomer;
