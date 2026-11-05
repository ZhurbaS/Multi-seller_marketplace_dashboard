import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import { MdAdd, MdDeleteOutline, MdEdit, MdInventory2, MdOpenInNew, MdWallpaper } from "react-icons/md";
import { get_products, delete_product, messageClear } from "../../store/Reducers/productSlice";
import { Badge, Button, ConfirmDialog, FilterBar, IconButton, Money, PageHeader, Pagination, Select, Table } from "../../ui";
import { ProductThumb, StockChip } from "../../components/seller/ProductCells";
import { PER_PAGE_OPTIONS, frontProductUrl, useDebounced } from "../../components/seller/listUtils";

const Products = () => {
  const dispatch = useDispatch();
  const { products, totalProduct, successMessage, errorMessage } = useSelector((state) => state.product);

  const [currentPage, setCurrentPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const searchValue = useDebounced(searchInput.trim());
  const [perPage, setPerPage] = useState(10);
  const [loading, setLoading] = useState(true);
  // Товар, для якого відкрито вікно підтвердження видалення
  const [productToDelete, setProductToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = () => {
    setLoading(true);
    return dispatch(get_products({ perPage: parseInt(perPage), page: parseInt(currentPage), searchValue })).finally(() => setLoading(false));
  };

  useEffect(() => {
    if (successMessage) {
      toast.success(successMessage);
      dispatch(messageClear());
      setProductToDelete(null);
      setDeleting(false);
      // Оновлюємо сторінку списку, щоб підтягнути наступний товар замість видаленого
      load();
    }
    if (errorMessage) {
      toast.error(errorMessage);
      dispatch(messageClear());
      setProductToDelete(null);
      setDeleting(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [successMessage, errorMessage]);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchValue, currentPage, perPage]);

  // Якщо після видалення сторінка спорожніла — на попередню.
  useEffect(() => {
    if (!loading && currentPage > 1 && products.length === 0 && totalProduct > 0) setCurrentPage((p) => p - 1);
  }, [loading, products.length, totalProduct, currentPage]);

  const actions = (product) => (
    <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
      <IconButton as={Link} to={`/seller/dashboard/edit-product/${product._id}`} icon={<MdEdit />} label="Редагувати" />
      <IconButton as={Link} to={`/seller/dashboard/add-banner/${product._id}`} icon={<MdWallpaper />} label="Банер товару" />
      <IconButton as="a" href={frontProductUrl(product.slug)} target="_blank" rel="noreferrer" icon={<MdOpenInNew />} label="Переглянути на сайті" />
      <IconButton icon={<MdDeleteOutline />} label="Видалити товар" className="text-(--danger)" onClick={() => setProductToDelete(product)} />
    </div>
  );

  const columns = [
    {
      key: "name",
      header: "Товар",
      primary: true,
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
      className: "max-w-[22rem]",
    },
    { key: "category", header: "Категорія", render: (p) => p.category?.name || "—", hideOnCard: true },
    { key: "price", header: "Ціна", align: "right", render: (p) => <Money value={p.price} /> },
    {
      key: "discount",
      header: "Знижка",
      align: "right",
      render: (p) => (p.discount ? <Badge tone="danger">−{p.discount} %</Badge> : <span className="text-(--ink-2)">Без знижки</span>),
    },
    { key: "stock", header: "Наявність", align: "right", render: (p) => <StockChip stock={p.stock} /> },
    { key: "actions", header: <span className="sr-only">Дії</span>, cardLabel: "Дії", align: "right", render: actions },
  ];

  return (
    <div className="mx-auto w-full">
      <PageHeader
        title="Товари"
        description={totalProduct ? `Усього товарів: ${totalProduct}` : "Керуйте асортиментом магазину"}
        actions={
          <Button as={Link} to="/seller/dashboard/add-product" icon={<MdAdd />}>
            Додати товар
          </Button>
        }
      />

      <FilterBar
        search={{ value: searchInput, onChange: (v) => { setSearchInput(v); setCurrentPage(1); }, placeholder: "Пошук за назвою, брендом…" }}
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
        caption="Список товарів"
        columns={columns}
        rows={products}
        loading={loading && products.length === 0}
        skeletonRows={perPage > 10 ? 10 : perPage}
        empty={
          searchValue
            ? { icon: <MdInventory2 />, title: "Нічого не знайдено", text: `За запитом «${searchValue}» товарів немає.`, action: <Button variant="secondary" onClick={() => setSearchInput("")}>Скинути пошук</Button> }
            : {
                icon: <MdInventory2 />,
                title: "Товарів поки немає",
                text: "Додайте перший товар — він одразу з'явиться в магазині.",
                action: (
                  <Button as={Link} to="/seller/dashboard/add-product" icon={<MdAdd />}>
                    Додати товар
                  </Button>
                ),
              }
        }
        className={loading && products.length > 0 ? "opacity-60 transition-opacity" : undefined}
      />

      <Pagination page={currentPage} total={totalProduct} perPage={perPage} onChange={setCurrentPage} />

      <ConfirmDialog
        open={!!productToDelete}
        title="Видалити товар?"
        confirmLabel="Видалити назавжди"
        tone="danger"
        loading={deleting}
        onClose={() => setProductToDelete(null)}
        onConfirm={() => {
          setDeleting(true);
          dispatch(delete_product(productToDelete._id));
        }}
      >
        <p className="break-words font-semibold text-(--ink)">{productToDelete?.name}</p>
        <p className="mt-2 text-sm text-(--ink-2)">
          Будуть видалені фото, відгуки та згадки в кошиках і списках бажань. Історія вже оформлених замовлень збережеться. Цю дію не
          можна скасувати.
        </p>
      </ConfirmDialog>
    </div>
  );
};

export default Products;
