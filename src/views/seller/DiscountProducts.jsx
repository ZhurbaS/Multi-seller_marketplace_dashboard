import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import { MdDeleteOutline, MdEdit, MdLocalOffer, MdOpenInNew } from "react-icons/md";
import api from "../../api/api";
import { delete_product, messageClear } from "../../store/Reducers/productSlice";
import { Badge, Button, ConfirmDialog, FilterBar, IconButton, Money, PageHeader, Pagination, Select, Table } from "../../ui";
import { ProductThumb, StockChip } from "../../components/seller/ProductCells";
import { PER_PAGE_OPTIONS, frontProductUrl, useDebounced } from "../../components/seller/listUtils";

// Скільки товарів продавця переглядаємо, щоб відібрати ті, що зі знижкою (фільтр — на клієнті).
const FETCH_LIMIT = 500;

const priceAfter = (p) => Math.round(((Number(p.price) || 0) * (100 - (Number(p.discount) || 0))) / 100);

const DiscountProducts = () => {
  const dispatch = useDispatch();
  const { successMessage, errorMessage } = useSelector((state) => state.product);

  const [all, setAll] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const searchValue = useDebounced(searchInput.trim());
  const [perPage, setPerPage] = useState(10);
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setLoadError("");
    api
      .get(`/products-get?page=1&searchValue=${encodeURIComponent(searchValue)}&perPage=${FETCH_LIMIT}`, { withCredentials: true })
      .then(({ data }) => {
        if (alive) setAll(Array.isArray(data?.products) ? data.products : []);
      })
      .catch((e) => {
        if (alive) setLoadError(e?.response?.data?.error || "Не вдалося завантажити товари");
      })
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [searchValue]);

  useEffect(() => {
    if (successMessage) {
      toast.success(successMessage);
      dispatch(messageClear());
      if (toDelete) setAll((list) => list.filter((p) => p._id !== toDelete._id));
      setToDelete(null);
      setDeleting(false);
    }
    if (errorMessage) {
      toast.error(errorMessage);
      dispatch(messageClear());
      setToDelete(null);
      setDeleting(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [successMessage, errorMessage]);

  const discounted = useMemo(() => all.filter((p) => Number(p.discount) > 0), [all]);
  const pageRows = discounted.slice((currentPage - 1) * perPage, currentPage * perPage);

  const columns = [
    {
      key: "name",
      header: "Товар",
      primary: true,
      className: "max-w-[22rem]",
      render: (p) => (
        <div className="flex min-w-0 items-center gap-3">
          <ProductThumb src={p.images?.[0]} />
          <div className="min-w-0">
            <Link to={`/seller/dashboard/edit-product/${p._id}`} className="line-clamp-2 break-words font-medium text-(--ink) hover:text-(--brand-ink) hover:underline" title={p.name}>
              {p.name}
            </Link>
            <p className="truncate text-xs text-(--ink-2)">{[p.brand, p.category?.name].filter(Boolean).join(" · ") || "—"}</p>
          </div>
        </div>
      ),
    },
    { key: "discount", header: "Знижка", align: "right", sortable: true, sortValue: (p) => Number(p.discount), render: (p) => <Badge tone="danger">−{p.discount} %</Badge> },
    { key: "price", header: "Ціна", align: "right", sortable: true, sortValue: (p) => Number(p.price), render: (p) => <Money value={p.price} className="text-(--ink-2) line-through" /> },
    {
      key: "final",
      header: "Зі знижкою",
      align: "right",
      sortable: true,
      sortValue: priceAfter,
      render: (p) => <Money value={priceAfter(p)} className="font-semibold text-(--sale)" />,
    },
    { key: "stock", header: "Наявність", align: "right", render: (p) => <StockChip stock={p.stock} /> },
    {
      key: "actions",
      header: <span className="sr-only">Дії</span>,
      cardLabel: "Дії",
      align: "right",
      render: (p) => (
        <div className="flex items-center justify-end gap-1">
          <IconButton as={Link} to={`/seller/dashboard/edit-product/${p._id}`} icon={<MdEdit />} label="Змінити знижку" />
          <IconButton as="a" href={frontProductUrl(p.slug)} target="_blank" rel="noreferrer" icon={<MdOpenInNew />} label="Переглянути на сайті" />
          <IconButton icon={<MdDeleteOutline />} label="Видалити товар" className="text-(--danger)" onClick={() => setToDelete(p)} />
        </div>
      ),
    },
  ];

  return (
    <div className="mx-auto w-full">
      <PageHeader
        title="Товари зі знижкою"
        description="Товари, для яких задано знижку. Змінити чи прибрати знижку можна в картці товару."
        breadcrumbs={[{ label: "Товари", to: "/seller/dashboard/products" }, { label: "Зі знижкою" }]}
      />

      <FilterBar
        search={{
          value: searchInput,
          onChange: (v) => {
            setSearchInput(v);
            setCurrentPage(1);
          },
          placeholder: "Пошук за назвою, брендом…",
        }}
        onReset={searchInput ? () => setSearchInput("") : undefined}
      >
        <Select
          aria-label="Кількість на сторінці"
          size="sm"
          value={perPage}
          onChange={(e) => {
            setPerPage(parseInt(e.target.value));
            setCurrentPage(1);
          }}
          options={PER_PAGE_OPTIONS}
        />
      </FilterBar>

      <Table
        caption="Товари зі знижкою"
        columns={columns}
        rows={pageRows}
        loading={loading}
        empty={
          loadError
            ? { icon: <MdLocalOffer />, title: "Помилка завантаження", text: loadError }
            : searchValue
              ? { icon: <MdLocalOffer />, title: "Нічого не знайдено", text: `За запитом «${searchValue}» товарів зі знижкою немає.` }
              : {
                  icon: <MdLocalOffer />,
                  title: "Товарів зі знижкою немає",
                  text: "Вкажіть знижку в картці товару — і він з'явиться тут та в розділі акцій магазину.",
                  action: (
                    <Button as={Link} to="/seller/dashboard/products" variant="secondary">
                      До товарів
                    </Button>
                  ),
                }
        }
      />

      <Pagination page={currentPage} total={discounted.length} perPage={perPage} onChange={setCurrentPage} />

      <ConfirmDialog
        open={!!toDelete}
        title="Видалити товар?"
        confirmLabel="Видалити назавжди"
        loading={deleting}
        onClose={() => setToDelete(null)}
        onConfirm={() => {
          setDeleting(true);
          dispatch(delete_product(toDelete._id));
        }}
      >
        <p className="break-words font-semibold text-(--ink)">{toDelete?.name}</p>
        <p className="mt-2 text-sm text-(--ink-2)">Будуть видалені фото, відгуки та згадки в кошиках і списках бажань. Цю дію не можна скасувати.</p>
      </ConfirmDialog>
    </div>
  );
};

export default DiscountProducts;
