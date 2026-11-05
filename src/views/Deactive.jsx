import { MdBlock } from "react-icons/md";
import { Link } from "react-router-dom";
import { Button, Card, EmptyState } from "../ui";

const Deactive = () => (
  <Card className="mx-auto mt-6 max-w-2xl">
    <EmptyState
      icon={<MdBlock />}
      title="Акаунт деактивовано"
      text="Доступ до продажу тимчасово обмежено. Зверніться до підтримки маркетплейсу, щоб дізнатися причину та відновити роботу."
      action={
        <Button variant="secondary" as={Link} to="/seller/dashboard/chat-support">
          Написати в підтримку
        </Button>
      }
    />
  </Card>
);

export default Deactive;
