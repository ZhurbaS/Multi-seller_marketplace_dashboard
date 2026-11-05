import { MdHourglassTop } from "react-icons/md";
import { Link } from "react-router-dom";
import { Button, Card, EmptyState } from "../ui";

const Pending = () => (
  <Card className="mx-auto mt-6 max-w-2xl">
    <EmptyState
      icon={<MdHourglassTop />}
      title="Акаунт на модерації"
      text="Ми перевіряємо дані вашого магазину. Після схвалення адміністратором кабінет стане доступним повністю — зазвичай це займає до 1–2 робочих днів."
      action={
        <Button variant="secondary" as={Link} to="/seller/dashboard/profile">
          Перевірити профіль
        </Button>
      }
    />
  </Card>
);

export default Pending;
