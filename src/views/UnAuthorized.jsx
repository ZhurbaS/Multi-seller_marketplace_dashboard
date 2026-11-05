import { MdLock } from "react-icons/md";
import { Link } from "react-router-dom";
import { Button, EmptyState } from "../ui";

const UnAuthorized = () => (
  <main className="flex min-h-dvh items-center justify-center bg-(--page) px-4">
    <div className="w-full max-w-lg rounded-(--r-lg) border border-(--line) bg-(--surface) shadow-(--shadow-2)">
      <EmptyState
        icon={<MdLock />}
        title="Немає доступу"
        text="У вас немає прав для перегляду цієї сторінки. Увійдіть під іншим акаунтом або поверніться на головну."
        action={
          <Button as={Link} to="/">
            На головну
          </Button>
        }
      />
    </div>
  </main>
);

export default UnAuthorized;
