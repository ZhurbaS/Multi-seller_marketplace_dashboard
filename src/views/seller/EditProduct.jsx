import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import { MdInventory, MdPhotoLibrary } from "react-icons/md";
import { get_category } from "../../store/Reducers/categorySlice";
import { get_product, update_product, messageClear, product_image_update } from "../../store/Reducers/productSlice";
import { defaultRules, rulesFromProduct, rulesToPayload } from "../../components/saleRules";
import { Button, Card, CardBody, EmptyState, PageHeader, Skeleton } from "../../ui";
import ProductFormFields from "../../components/seller/ProductFormFields";
import { emptyProductState, focusFirstError, validateProduct } from "../../components/seller/productFormUtils";
import ImageUploader from "../../components/seller/ImageUploader";
import { FormActionsBar, FormSection } from "../../components/seller/FormKit";
import { useUnsavedChanges } from "../../components/seller/useUnsavedChanges";

const str = (v) => (v === null || v === undefined ? "" : String(v));

const snapshot = (state, category, specifications, rules) =>
  JSON.stringify({
    state,
    category,
    specifications: specifications.filter((s) => s.key.trim() || s.value.trim()),
    rules,
  });

const EditProduct = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const formRef = useRef(null);

  const dispatch = useDispatch();
  const { categories } = useSelector((state) => state.category);
  const { product, loader, successMessage, errorMessage } = useSelector((state) => state.product);

  useEffect(() => {
    dispatch(messageClear());
  }, [dispatch]);

  useEffect(() => {
    dispatch(get_category({ searchValue: "", perPage: "", page: "" }));
  }, [dispatch]);

  useEffect(() => {
    if (productId) dispatch(get_product(productId));
  }, [productId, dispatch]);

  const [state, setState] = useState(emptyProductState);
  const [category, setCategory] = useState("");
  const [rules, setRules] = useState(defaultRules);
  const [specifications, setSpecifications] = useState([{ key: "", value: "" }]);
  const [imageShow, setImageShow] = useState([]);
  const [busyImage, setBusyImage] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [baseline, setBaseline] = useState(null);
  const syncedId = useRef(null);

  const isCurrent = product && String(product._id) === String(productId);

  // Синхронізація форми з товаром. Повністю — лише при першому завантаженні цього товару;
  // після заміни фото оновлюємо тільки зображення, щоб не затерти незбережені правки.
  useEffect(() => {
    if (!isCurrent || categories.length === 0) return;
    if (Array.isArray(product.images)) setImageShow(product.images);
    if (syncedId.current === product._id) return;
    syncedId.current = product._id;

    const nextState = {
      name: product.name || "",
      description: product.description || "",
      discount: str(product.discount),
      price: str(product.price),
      brand: product.brand || "",
      stock: str(product.stock),
    };
    const nextRules = rulesFromProduct(product);
    const nextSpecs =
      Array.isArray(product.specifications) && product.specifications.length > 0
        ? product.specifications.map((s) => ({ key: s.key, value: s.value }))
        : [{ key: "", value: "" }];

    let nextCategory = "";
    if (product.category) {
      // product.category — ObjectId, об'єкт (populate) або (для старих товарів) назва
      const catObj =
        typeof product.category === "object"
          ? product.category
          : categories.find((c) => c._id === product.category || c.name === product.category);
      nextCategory = catObj ? catObj._id : "";
    }

    setState(nextState);
    setRules(nextRules);
    setSpecifications(nextSpecs);
    setCategory(nextCategory);
    setBaseline(snapshot(nextState, nextCategory, nextSpecs, nextRules));
  }, [product, categories, isCurrent]);

  useEffect(() => {
    if (successMessage) {
      toast.success(successMessage);
      dispatch(messageClear());
      setBusyImage(null);
    }
    if (errorMessage) {
      toast.error(errorMessage);
      dispatch(messageClear());
      setBusyImage(null);
    }
  }, [successMessage, errorMessage, dispatch]);

  const current = snapshot(state, category, specifications, rules);
  const dirty = baseline !== null && current !== baseline;
  const { element: leaveDialog, guard } = useUnsavedChanges(dirty && !loader);

  const errors = useMemo(
    () => validateProduct({ state, category, rules, specifications, imagesCount: imageShow.length, requireImages: false }),
    [state, category, rules, specifications, imageShow.length],
  );
  const shownErrors = submitted ? errors : {};

  const onField = (name, value) => setState((s) => ({ ...s, [name]: value }));

  const changeImage = (i, file) => {
    const img = imageShow[i];
    if (!img || !file) return;
    setBusyImage(i);
    dispatch(product_image_update({ oldImage: img, newImage: file, productId })).then((res) => {
      setBusyImage(null);
      if (product_image_update.rejected.match(res)) toast.error(res.payload?.error || "Не вдалося замінити фото");
    });
  };

  const update = async (e) => {
    e.preventDefault();
    setSubmitted(true);
    if (Object.keys(errors).length) {
      toast.error("Перевірте виділені поля");
      requestAnimationFrame(() => focusFirstError(errors, formRef.current));
      return;
    }
    const obj = {
      name: state.name,
      description: state.description,
      discount: state.discount,
      price: state.price,
      brand: state.brand,
      stock: state.stock,
      category,
      productId: productId,
      specifications: specifications.filter((s) => s.key.trim() && s.value.trim()),
      ...rulesToPayload(rules),
    };
    const res = await dispatch(update_product(obj));
    if (update_product.fulfilled.match(res)) {
      setBaseline(current);
      setSubmitted(false);
    }
  };

  const toProducts = () => guard(() => navigate("/seller/dashboard/products"));
  const loading = !isCurrent || baseline === null;

  return (
    <div className="mx-auto w-full max-w-5xl">
      <PageHeader
        title="Редагувати товар"
        description={loading ? "Завантаження товару…" : state.name || "Без назви"}
        breadcrumbs={[{ label: "Товари", to: "/seller/dashboard/products" }, { label: "Редагування" }]}
        actions={
          <Button variant="secondary" icon={<MdInventory />} onClick={toProducts}>
            Усі товари
          </Button>
        }
      />

      {loading ? (
        product === null ? (
          <Card>
            <EmptyState title="Товар не знайдено" text="Можливо, його видалено." action={<Button onClick={toProducts}>До списку товарів</Button>} />
          </Card>
        ) : (
          <div className="flex flex-col gap-4" aria-busy="true" aria-label="Завантаження форми">
            {[0, 1, 2].map((i) => (
              <Card key={i}>
                <CardBody className="flex flex-col gap-4">
                  <Skeleton width="30%" height="1.25rem" />
                  <Skeleton height="2.75rem" />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Skeleton height="2.75rem" />
                    <Skeleton height="2.75rem" />
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        )
      ) : (
        <form ref={formRef} onSubmit={update} noValidate aria-busy={loader || undefined}>
          <ProductFormFields
            state={state}
            onField={onField}
            category={category}
            onCategory={setCategory}
            categories={categories}
            specifications={specifications}
            setSpecifications={setSpecifications}
            rules={rules}
            setRules={setRules}
            errors={shownErrors}
            disabled={loader && busyImage === null}
            imagesSection={
              <FormSection
                title="Зображення"
                description="Наведіть на фото й натисніть «Замінити» або перетягніть новий файл на плитку — фото оновиться одразу."
                icon={<MdPhotoLibrary />}
              >
                {imageShow.length ? (
                  <ImageUploader
                    items={imageShow.map((url) => ({ url }))}
                    onReplace={changeImage}
                    busyIndex={busyImage}
                    disabled={busyImage !== null}
                  />
                ) : (
                  <p className="text-sm text-(--ink-2)">У товару немає зображень.</p>
                )}
              </FormSection>
            }
          />

          <FormActionsBar
            dirty={dirty}
            loading={loader && busyImage === null}
            submitLabel="Зберегти зміни"
            onCancel={toProducts}
          />
        </form>
      )}
      {leaveDialog}
    </div>
  );
};

export default EditProduct;
