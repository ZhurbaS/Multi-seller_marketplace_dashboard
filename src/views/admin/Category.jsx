import React, { useEffect, useState } from "react";
import { MdAdd, MdCategory, MdDeleteOutline, MdEdit } from "react-icons/md";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import {
  categoryAdd,
  messageClear,
  get_category,
  updateCategory,
  deleteCategory,
} from "./../../store/Reducers/categorySlice";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Drawer,
  Field,
  FilterBar,
  IconButton,
  Input,
  PageHeader,
  Pagination,
  Select,
  Table,
  useConfirm,
} from "../../ui";
import ImageDropzone from "../../components/admin/ImageDropzone";

const EMPTY = { name: "", image: "" };
const PER_PAGE_OPTIONS = [5, 10, 20].map((n) => ({ value: n, label: `${n} на сторінці` }));

const Category = () => {
  const dispatch = useDispatch();
  const { loader, successMessage, errorMessage, categories, totalCategory } = useSelector((state) => state.category);
  const [confirm, confirmEl] = useConfirm();

  const [currentPage, setCurrentPage] = useState(1);
  const [searchValue, setSearchValue] = useState("");
  const [perPage, setPerPage] = useState(5);
  const [show, setShow] = useState(false);
  const [imageShow, setImage] = useState("");
  const [isEdit, setIsEdit] = useState(false);
  const [editId, setEditId] = useState(null);
  const [listLoading, setListLoading] = useState(true);
  const [errors, setErrors] = useState({});

  const [state, setState] = useState(EMPTY);

  const resetForm = () => {
    setState(EMPTY);
    setImage("");
    setIsEdit(false);
    setEditId(null);
    setErrors({});
  };

  const onFile = (file) => {
    setImage(URL.createObjectURL(file));
    setState((s) => ({ ...s, image: file }));
    setErrors((e) => ({ ...e, image: "" }));
  };

  const addOrUpdateCategory = (e) => {
    e.preventDefault();
    const next = {};
    if (!state.name.trim()) next.name = "Вкажіть назву категорії";
    if (!isEdit && !state.image) next.image = "Додайте зображення категорії";
    setErrors(next);
    if (Object.keys(next).length) return;
    if (isEdit) {
      dispatch(updateCategory({ id: editId, ...state }));
    } else {
      dispatch(categoryAdd(state));
    }
  };

  useEffect(() => {
    if (successMessage) {
      toast.success(successMessage);
      dispatch(messageClear());
      resetForm();
      setShow(false);
    }
    if (errorMessage) {
      toast.error(typeof errorMessage === "string" ? errorMessage : errorMessage?.error || "Сталася помилка");
      dispatch(messageClear());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [successMessage, errorMessage]);

  useEffect(() => {
    const obj = {
      perPage: parseInt(perPage),
      page: parseInt(currentPage),
      searchValue,
    };
    setListLoading(true);
    Promise.resolve(dispatch(get_category(obj))).finally(() => setListLoading(false));
  }, [searchValue, currentPage, perPage, dispatch]);

  const handleEdit = (category) => {
    setState({ name: category.name, image: category.image });
    setImage(category.image);
    setEditId(category._id);
    setIsEdit(true);
    setErrors({});
    // На ≥lg форма вже видима праворуч — drawer лише для мобільних.
    const wide = typeof window !== "undefined" && window.matchMedia?.("(min-width: 1024px)").matches;
    setShow(!wide);
  };

  const openNew = () => {
    resetForm();
    setShow(true);
  };

  const handleDelete = async (d) => {
    const ok = await confirm({
      title: "Видалити категорію?",
      text: `Категорію «${d.name}» буде видалено. Цю дію не можна скасувати.`,
      confirmLabel: "Видалити",
      tone: "danger",
    });
    if (ok) dispatch(deleteCategory(d._id));
  };

  const columns = [
    {
      key: "n",
      header: "№",
      width: "56px",
      hideOnCard: true,
      render: (_, i) => <span className="tabular-nums text-(--ink-2)">{(currentPage - 1) * perPage + i + 1}</span>,
    },
    {
      key: "name",
      header: "Категорія",
      primary: true,
      render: (d) => (
        <span className="flex min-w-0 items-center gap-3">
          {d.image ? (
            <img src={d.image} alt="" className="h-11 w-11 shrink-0 rounded-(--r-md) border border-(--line) bg-(--surface-2) object-cover" />
          ) : (
            <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-(--r-md) bg-(--surface-2) text-(--ink-2)" aria-hidden="true">
              <MdCategory />
            </span>
          )}
          <span className="min-w-0 break-words font-medium">{d.name}</span>
        </span>
      ),
    },
    {
      key: "actions",
      header: "Дії",
      align: "right",
      cardLabel: "Дії",
      render: (d) => (
        <span className="inline-flex items-center justify-end gap-1">
          <IconButton icon={<MdEdit />} label={`Змінити «${d.name}»`} size="sm" variant="secondary" onClick={() => handleEdit(d)} />
          <IconButton icon={<MdDeleteOutline />} label={`Видалити «${d.name}»`} size="sm" variant="ghost" className="text-(--danger)" onClick={() => handleDelete(d)} />
        </span>
      ),
    },
  ];

  const form = (
    <form onSubmit={addOrUpdateCategory} noValidate className="flex flex-col gap-4">
      <Field label="Назва категорії" required error={errors.name}>
        <Input
          value={state.name}
          onChange={(e) => {
            setState({ ...state, name: e.target.value });
            if (errors.name) setErrors({ ...errors, name: "" });
          }}
          name="category_name"
          autoComplete="off"
          placeholder="Напр., Смартфони"
          maxLength={80}
        />
      </Field>
      <Field label="Зображення" required={!isEdit} error={errors.image} hint={isEdit ? "Залиште як є, щоб не змінювати" : undefined}>
        <ImageDropzone onFile={onFile} preview={imageShow} invalid={!!errors.image} disabled={loader} heightClass="h-52" />
      </Field>
      <div className="flex flex-wrap gap-2 pt-1">
        <Button type="submit" loading={loader} className="flex-1">
          {isEdit ? "Зберегти зміни" : "Додати категорію"}
        </Button>
        {isEdit && (
          <Button variant="secondary" onClick={resetForm} disabled={loader}>
            Скасувати
          </Button>
        )}
      </div>
    </form>
  );

  return (
    <div>
      <PageHeader
        title="Категорії"
        description="Категорії каталогу магазину: назва та зображення для вітрини."
        actions={
          <Button icon={<MdAdd />} onClick={openNew} className="lg:hidden">
            Додати категорію
          </Button>
        }
      />

      <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
        <div className="min-w-0">
          <FilterBar
            search={{
              value: searchValue,
              onChange: (v) => {
                setSearchValue(v);
                setCurrentPage(1);
              },
              placeholder: "Пошук категорії",
            }}
          >
            <Select
              aria-label="Кількість на сторінці"
              options={PER_PAGE_OPTIONS}
              value={perPage}
              onChange={(e) => {
                setPerPage(parseInt(e.target.value));
                setCurrentPage(1);
              }}
              className="w-44"
            />
          </FilterBar>
          <Table
            caption="Категорії"
            columns={columns}
            rows={categories}
            loading={listLoading && !categories.length}
            empty={{
              icon: <MdCategory />,
              title: searchValue ? "Нічого не знайдено" : "Категорій ще немає",
              text: searchValue ? "Спробуйте інший запит." : "Додайте першу категорію — вона з'явиться в каталозі.",
            }}
          />
          <Pagination page={currentPage} total={totalCategory || 0} perPage={perPage} onChange={setCurrentPage} />
        </div>

        <Card className="hidden self-start lg:sticky lg:top-[calc(var(--topbar-h)+1rem)] lg:block">
          <CardHeader
            title={isEdit ? "Змінити категорію" : "Нова категорія"}
            description={isEdit ? "Оновіть назву або зображення." : "Заповніть назву та додайте зображення."}
            icon={<MdCategory />}
          />
          <CardBody>{form}</CardBody>
        </Card>
      </div>

      <Drawer open={show} onClose={() => setShow(false)} title={isEdit ? "Змінити категорію" : "Нова категорія"} className="lg:hidden">
        <div className="p-5">{form}</div>
      </Drawer>
      {confirmEl}
    </div>
  );
};

export default Category;
