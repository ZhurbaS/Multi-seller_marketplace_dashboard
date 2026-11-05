import { PageHeader } from "../../ui";
import { get_deactive_sellers } from "../../store/Reducers/sellerSlice";
import SellersList from "../../components/admin/SellersList";

const DeactiveSellers = () => (
  <>
    <PageHeader
      title="Неактивні продавці"
      description="Продавці, яких деактивовано. Їхні товари не показуються в магазині."
      breadcrumbs={[{ label: "Головна", to: "/admin/dashboard" }, { label: "Продавці", to: "/admin/dashboard/sellers" }, { label: "Неактивні" }]}
    />
    <SellersList fetchThunk={get_deactive_sellers} caption="Неактивні продавці" emptyTitle="Неактивних продавців немає" />
  </>
);

export default DeactiveSellers;
