import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { get_seller_message, messageClear, send_message_seller_admin, updateAdminMessage } from "../../store/Reducers/chatSlice";
import { socket } from "../../utils/utils";
import { PageHeader } from "../../ui";
import { Avatar, Composer, MessageList } from "../../components/seller/ChatKit";

const SellerToAdmin = () => {
  const { seller_admin_message, successMessage } = useSelector((state) => state.chat);
  const { userInfo } = useSelector((state) => state.auth);
  const [text, setText] = useState("");

  const dispatch = useDispatch();

  const send = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    dispatch(
      send_message_seller_admin({
        senderId: userInfo._id,
        receiverId: "",
        message: text,
        senderName: userInfo.name,
      }),
    );
    setText("");
  };

  useEffect(() => {
    dispatch(get_seller_message());
  }, [dispatch]);

  useEffect(() => {
    const onMsg = (msg) => dispatch(updateAdminMessage(msg));
    socket.on("received_admin_message", onMsg);
    return () => socket.off("received_admin_message", onMsg);
  }, [dispatch]);

  useEffect(() => {
    if (successMessage) {
      socket.emit("send_message_seller_to_admin", seller_admin_message[seller_admin_message.length - 1]);
      dispatch(messageClear());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [successMessage]);

  return (
    <div className="mx-auto w-full max-w-4xl">
      <PageHeader title="Підтримка" description="Питання щодо магазину, виплат чи модерації — напишіть адміністрації." />

      <section
        aria-label="Чат з підтримкою"
        className="flex h-[calc(100dvh-220px)] min-h-[420px] min-w-0 flex-col overflow-hidden rounded-(--r-lg) border border-(--line) bg-(--surface) shadow-(--shadow-1)"
      >
        <header className="flex min-w-0 items-center gap-3 border-b border-(--line) px-3 py-2.5 sm:px-4">
          <Avatar src="/images/adminNEW.jpg" name="Підтримка" />
          <div className="min-w-0">
            <p className="truncate font-semibold text-(--ink)">Підтримка TechScout</p>
            <p className="text-xs text-(--ink-2)">Зазвичай відповідаємо протягом робочого дня</p>
          </div>
        </header>

        <MessageList
          messages={seller_admin_message || []}
          isMine={(m) => m.senderId === userInfo._id}
          emptyTitle="Повідомлень ще немає"
          emptyText="Опишіть питання — адміністратор відповість тут."
        />

        <Composer value={text} onChange={setText} onSubmit={send} />
      </section>
    </div>
  );
};

export default SellerToAdmin;
