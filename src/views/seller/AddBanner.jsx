import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import { MdInventory, MdWallpaper } from "react-icons/md";
import { add_banner, get_banner, messageClear, update_banner } from "../../store/Reducers/bannerSlice";
import { Button, Card, CardBody, CardHeader, ImageDrop, PageHeader, Skeleton } from "../../ui";
import { FormActionsBar } from "../../components/seller/FormKit";
import { useUnsavedChanges } from "../../components/seller/useUnsavedChanges";

// Банер на сайті 3:1, на телефонах обрізається по центру до 2:1.
const HINT =
  "Рекомендований розмір 1600×533 px (співвідношення 3:1), JPG/WebP до 300 КБ. На телефонах обрізається по центру до 2:1 — важливий текст тримайте в центральних 60 % ширини.";

const AddBanner = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { productId } = useParams();
  const { loader, successMessage, errorMessage, banner } = useSelector((state) => state.banner);

  const [image, setImage] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [fetching, setFetching] = useState(true);

  const { element: leaveDialog, guard } = useUnsavedChanges(!!image && !loader);

  useEffect(() => {
    if (successMessage) {
      toast.success(successMessage);
      dispatch(messageClear());
      setImage(null);
      setSubmitted(false);
    }
    if (errorMessage) {
      toast.error(errorMessage);
      dispatch(messageClear());
    }
  }, [successMessage, errorMessage, dispatch]);

  useEffect(() => {
    setFetching(true);
    dispatch(get_banner(productId)).finally(() => setFetching(false));
  }, [productId, dispatch]);

  const current = banner && (!banner.productId || String(banner.productId) === String(productId)) ? banner : null;
  const error = submitted && !image ? "Оберіть зображення банера" : "";

  const submit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    if (!image) return;
    const formData = new FormData();
    formData.append("mainban", image);
    if (current) {
      dispatch(update_banner({ info: formData, bannerId: current._id }));
    } else {
      formData.append("productId", productId);
      dispatch(add_banner(formData));
    }
  };

  const toProducts = () => guard(() => navigate("/seller/dashboard/products"));

  return (
    <div className="mx-auto w-full max-w-4xl">
      <PageHeader
        title={current ? "Банер товару" : "Додати банер"}
        description="Банер показується в каруселі на головній сторінці магазину й веде на цей товар."
        breadcrumbs={[{ label: "Товари", to: "/seller/dashboard/products" }, { label: "Банер" }]}
        actions={
          <Button variant="secondary" icon={<MdInventory />} onClick={toProducts}>
            Усі товари
          </Button>
        }
      />

      <form onSubmit={submit} noValidate aria-busy={loader || undefined} className="flex flex-col gap-4 sm:gap-5">
        {fetching ? (
          <Card>
            <CardBody className="flex flex-col gap-3">
              <Skeleton width="30%" height="1.25rem" />
              <Skeleton height="auto" className="aspect-[3/1] w-full" rounded="md" />
            </CardBody>
          </Card>
        ) : (
          current && (
            <Card as="section">
              <CardHeader title="Поточний банер" description="Так банер виглядає зараз (3:1)." icon={<MdWallpaper />} />
              <CardBody>
                <img src={current.banner} alt="Поточний банер товару" className="aspect-[3/1] w-full rounded-(--r-md) border border-(--line) bg-(--surface-2) object-cover" />
              </CardBody>
            </Card>
          )
        )}

        <Card as="section">
          <CardHeader
            title={current ? "Нове зображення" : "Зображення банера"}
            description={current ? "Оберіть файл, щоб замінити поточний банер." : "Оберіть файл для банера."}
            icon={<MdWallpaper />}
          />
          <CardBody className="flex flex-col gap-4">
            <ImageDrop
              label="Файл банера"
              required
              value={image}
              onChange={setImage}
              maxSizeMb={5}
              error={error}
              hint={HINT}
              disabled={loader}
              emptyText="Перетягніть зображення банера сюди або натисніть, щоб обрати"
              previewClassName="sm:w-80 aspect-[3/1] object-cover"
            />
            {image && (
              <div>
                <p className="mb-2 text-sm font-medium text-(--ink)">Прев'ю на телефоні (2:1)</p>
                <PhonePreview file={image} />
              </div>
            )}
          </CardBody>
        </Card>

        <FormActionsBar
          dirty={!!image}
          loading={loader}
          submitLabel={current ? "Оновити банер" : "Додати банер"}
          savedText={current ? "Банер опубліковано" : "Оберіть зображення"}
          onCancel={toProducts}
        />
      </form>
      {leaveDialog}
    </div>
  );
};

function PhonePreview({ file }) {
  const [url, setUrl] = useState("");
  useEffect(() => {
    const u = URL.createObjectURL(file);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [file]);
  if (!url) return null;
  return <img src={url} alt="Прев'ю банера на телефоні" className="aspect-[2/1] w-full max-w-xs rounded-(--r-md) border border-(--line) object-cover" />;
}

export default AddBanner;
