import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { MdCheckCircle, MdErrorOutline } from "react-icons/md";
import { active_stripe_connect_account, messageClear } from "../store/Reducers/sellerSlice";
import { Button, EmptyState, Spinner } from "../ui";

const Success = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { successMessage, errorMessage, loader } = useSelector((state) => state.seller);

  const queryParams = new URLSearchParams(window.location.search);
  const activeCode = queryParams.get("activeCode");

  useEffect(() => {
    dispatch(active_stripe_connect_account(activeCode));
  }, [activeCode, dispatch]);

  const redirect = () => {
    dispatch(messageClear());
    navigate("/");
  };

  const action = <Button onClick={redirect}>До панелі керування</Button>;

  return (
    <main className="flex min-h-dvh items-center justify-center bg-(--page) px-4">
      <div className="w-full max-w-lg rounded-(--r-lg) border border-(--line) bg-(--surface) shadow-(--shadow-2)">
        {loader ? (
          <div className="flex flex-col items-center gap-3 p-10 text-(--ink-2)">
            <Spinner label="Активуємо платіжний акаунт…" />
            <span>Активуємо платіжний акаунт…</span>
          </div>
        ) : errorMessage ? (
          <EmptyState icon={<MdErrorOutline />} title="Не вдалося активувати акаунт" text={errorMessage} action={action} />
        ) : successMessage ? (
          <EmptyState icon={<MdCheckCircle />} title="Акаунт активовано" text={successMessage} action={action} />
        ) : null}
      </div>
    </main>
  );
};

export default Success;
