import { PageHeader } from "../../ui";
import { get_active_sellers } from "../../store/Reducers/sellerSlice";
import SellersList from "../../components/admin/SellersList";

const Sellers = () => (
  <>
    <PageHeader
      title="Продавці"
      description="Активні продавці маркетплейсу. Відкрийте картку, щоб змінити статус або комісію."
      breadcrumbs={[{ label: "Головна", to: "/admin/dashboard" }, { label: "Продавці" }]}
    />
    <SellersList fetchThunk={get_active_sellers} caption="Активні продавці" emptyTitle="Активних продавців поки немає" />
  </>
);

export default Sellers;
