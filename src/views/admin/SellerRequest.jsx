import { PageHeader } from "../../ui";
import { get_seller_request } from "./../../store/Reducers/sellerSlice";
import SellersList from "../../components/admin/SellersList";

const SellerRequest = () => (
  <>
    <PageHeader
      title="Запити продавців"
      description="Нові продавці, що очікують перевірки. Відкрийте картку й оберіть статус «Активний», щоб схвалити."
      breadcrumbs={[{ label: "Головна", to: "/admin/dashboard" }, { label: "Продавці", to: "/admin/dashboard/sellers" }, { label: "Запити" }]}
    />
    <SellersList
      fetchThunk={get_seller_request}
      showShop={false}
      caption="Запити продавців"
      emptyTitle="Нових запитів немає"
      emptyText="Коли продавець зареєструється, його заявка з'явиться тут."
    />
  </>
);

export default SellerRequest;
