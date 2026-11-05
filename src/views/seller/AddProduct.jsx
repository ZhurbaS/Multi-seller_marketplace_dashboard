import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import { MdInventory, MdPhotoLibrary } from "react-icons/md";
import { get_category } from "../../store/Reducers/categorySlice";
import { add_product, messageClear } from "../../store/Reducers/productSlice";
import { defaultRules, appendRulesToFormData } from "../../components/saleRules";
import { Button, Field, PageHeader } from "../../ui";
import ProductFormFields from "../../components/seller/ProductFormFields";
import { emptyProductState, focusFirstError, validateProduct } from "../../components/seller/productFormUtils";
import ImageUploader from "../../components/seller/ImageUploader";
import { FormActionsBar, FormSection } from "../../components/seller/FormKit";
import { useUnsavedChanges } from "../../components/seller/useUnsavedChanges";

const MAX_IMAGES = 10;
const emptySpecs = () => [{ key: "", value: "" }];

const AddProduct = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const formRef = useRef(null);
  const { categories } = useSelector((state) => state.category);
  const { loader, successMessage, errorMessage } = useSelector((state) => state.product);

  useEffect(() => {
    dispatch(get_category({ searchValue: "", perPage: "", page: "" }));
  }, [dispatch]);

  const [state, setState] = useState(emptyProductState);
  const [category, setCategory] = useState("");
  const [rules, setRules] = useState(defaultRules);
  const [specifications, setSpecifications] = useState(emptySpecs);
  const [images, setImages] = useState([]);
  const [imageShow, setImageShow] = useState([]);
  const [submitted, setSubmitted] = useState(false);

  // Звільняємо object URL при видаленні/розмонтуванні.
  const urlsRef = useRef([]);
  useEffect(() => {
    urlsRef.current = imageShow.map((i) => i.url);
  }, [imageShow]);
  useEffect(() => () => urlsRef.current.forEach((u) => URL.revokeObjectURL(u)), []);

  const dirty = useMemo(
    () =>
      JSON.stringify(state) !== JSON.stringify(emptyProductState) ||
      !!category ||
      images.length > 0 ||
      specifications.some((s) => s.key.trim() || s.value.trim()) ||
      JSON.stringify(rules) !== JSON.stringify(defaultRules),
    [state, category, images, specifications, rules],
  );
  const { element: leaveDialog, guard } = useUnsavedChanges(dirty && !loader);

  const errors = useMemo(
    () => validateProduct({ state, category, rules, specifications, imagesCount: images.length, requireImages: true }),
    [state, category, rules, specifications, images.length],
  );
  const shownErrors = submitted ? errors : {};

  const onField = (name, value) => setState((s) => ({ ...s, [name]: value }));

  const addImages = (files) => {
    setImages((prev) => [...prev, ...files]);
    setImageShow((prev) => [...prev, ...files.map((f) => ({ url: URL.createObjectURL(f) }))]);
  };

  const changeImage = (i, img) => {
    if (!img) return;
    setImageShow((prev) => {
      const next = [...prev];
      if (next[i]) URL.revokeObjectURL(next[i].url);
      next[i] = { url: URL.createObjectURL(img) };
      return next;
    });
    setImages((prev) => {
      const next = [...prev];
      next[i] = img;
      return next;
    });
  };

  const removeImage = (i) => {
    setImageShow((prev) => {
      if (prev[i]) URL.revokeObjectURL(prev[i].url);
      return prev.filter((_, index) => index !== i);
    });
    setImages((prev) => prev.filter((_, index) => index !== i));
  };

  const moveImage = (from, to) => {
    if (to < 0 || to >= images.length) return;
    const move = (arr) => {
      const next = [...arr];
      const [x] = next.splice(from, 1);
      next.splice(to, 0, x);
      return next;
    };
    setImages(move);
    setImageShow(move);
  };

  const add = (e) => {
    e.preventDefault();
    setSubmitted(true);
    if (Object.keys(errors).length) {
      toast.error("Перевірте виділені поля");
      requestAnimationFrame(() => focusFirstError(errors, formRef.current));
      return;
    }
    const formData = new FormData();
    formData.append("name", state.name);
    formData.append("description", state.description);
    formData.append("price", state.price);
    formData.append("stock", state.stock);
    formData.append("discount", state.discount);
    formData.append("brand", state.brand);
    formData.append("shopName", "TechScout");
    formData.append("category", category);
    formData.append("specifications", JSON.stringify(specifications.filter((s) => s.key.trim() && s.value.trim())));

    appendRulesToFormData(formData, rules);

    for (let i = 0; i < images.length; i++) {
      formData.append("images", images[i]);
    }

    dispatch(add_product(formData));
  };

  useEffect(() => {
    if (successMessage) {
      toast.success(successMessage);
      dispatch(messageClear());
      setState(emptyProductState);
      imageShow.forEach((i) => URL.revokeObjectURL(i.url));
      setImageShow([]);
      setImages([]);
      setCategory("");
      setSpecifications(emptySpecs());
      setRules(defaultRules);
      setSubmitted(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
    if (errorMessage) {
      toast.error(errorMessage);
      dispatch(messageClear());
    }
    // imageShow навмисно не в залежностях: скидання лише при новому повідомленні
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [successMessage, errorMessage, dispatch]);

  const toProducts = () => guard(() => navigate("/seller/dashboard/products"));

  return (
    <div className="mx-auto w-full max-w-5xl">
      <PageHeader
        title="Додати товар"
        description="Заповніть картку: обов'язкові поля позначені зірочкою. Товар з'явиться в магазині одразу після збереження."
        breadcrumbs={[{ label: "Товари", to: "/seller/dashboard/products" }, { label: "Новий товар" }]}
        actions={
          <Button variant="secondary" icon={<MdInventory />} onClick={toProducts}>
            Усі товари
          </Button>
        }
      />

      <form ref={formRef} onSubmit={add} encType="multipart/form-data" noValidate aria-busy={loader || undefined}>
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
          disabled={loader}
          imagesSection={
            <FormSection
              title="Зображення"
              description={`До ${MAX_IMAGES} фото, перше — головне. Перетягуйте плитки, щоб змінити порядок.`}
              icon={<MdPhotoLibrary />}
            >
              <Field
                label="Фото товару"
                required
                error={shownErrors.images}
                hint="JPG, PNG або WebP до 10 МБ. Рекомендуємо від 5 фото на світлому фоні."
              >
                <ImageUploader
                  items={imageShow}
                  onAdd={addImages}
                  onRemove={removeImage}
                  onReplace={changeImage}
                  onMove={moveImage}
                  max={MAX_IMAGES}
                  disabled={loader}
                  invalid={!!shownErrors.images}
                />
              </Field>
            </FormSection>
          }
        />

        <FormActionsBar
          dirty={dirty}
          loading={loader}
          submitLabel="Додати товар"
          savedText="Заповніть форму, щоб додати товар"
          onCancel={toProducts}
        />
      </form>
      {leaveDialog}
    </div>
  );
};

export default AddProduct;
