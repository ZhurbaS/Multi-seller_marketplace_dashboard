import React, { useEffect, useState } from "react";
import Search from "../components/Search";
import { Link } from "react-router-dom";
import Pagination from "../Pagination";
import { FaEdit, FaEye } from "react-icons/fa";
import { FaTrash } from "react-icons/fa6";
import { useDispatch, useSelector } from "react-redux";
import {
  get_products,
  delete_product,
  messageClear,
} from "../../store/Reducers/productSlice";
import { RiImageEditLine } from "react-icons/ri";
import toast from "react-hot-toast";

const Products = () => {
  const dispatch = useDispatch();
  const { products, totalProduct, successMessage, errorMessage } = useSelector(
    (state) => state.product
  );

  const [currentPage, setCurrentPage] = useState(1);
  const [searchValue, setSearchValue] = useState("");
  const [perPage, setPerPage] = useState(5);
  // Товар, для якого відкрито вікно підтвердження видалення
  const [productToDelete, setProductToDelete] = useState(null);

  useEffect(() => {
    if (successMessage) {
      toast.success(successMessage);
      dispatch(messageClear());
      setProductToDelete(null);
      // Оновлюємо сторінку списку, щоб підтягнути наступний товар замість видаленого
      dispatch(
        get_products({
          perPage: parseInt(perPage),
          page: parseInt(currentPage),
          searchValue,
        })
      );
    }
    if (errorMessage) {
      toast.error(errorMessage);
      dispatch(messageClear());
      setProductToDelete(null);
    }
  }, [successMessage, errorMessage]);

  useEffect(() => {
    const obj = {
      perPage: parseInt(perPage),
      page: parseInt(currentPage),
      searchValue,
    };
    dispatch(get_products(obj));
  }, [searchValue, currentPage, perPage]);

  return (
    <div className="px-2 lg:px-7 pt-5">
      <h1 className="text-[#000000] font-semibold text-lg mb-3">Всі товари</h1>
      <div className="w-full p-4 bg-[#6a5fdf] rounded-md">
        <Search
          setPerPage={setPerPage}
          setSearchValue={setSearchValue}
          searchValue={searchValue}
        />

        <div className="relative overflow-x-auto nmt-5">
          <table className="w-full text-sm text-left text-[#d0d2d6]">
            <thead className="text-sm text-[#d0d2d6] uppercase border-b border-slate-700 ">
              <tr>
                <th scope="col" className="py-3 px-4">
                  №
                </th>
                <th scope="col" className="py-3 px-4">
                  Зображення
                </th>
                <th scope="col" className="py-3 px-4">
                  Назва
                </th>
                <th scope="col" className="py-3 px-4">
                  Категорія
                </th>
                <th scope="col" className="py-3 px-4">
                  Бренд
                </th>
                <th scope="col" className="py-3 px-4">
                  Ціна
                </th>
                <th scope="col" className="py-3 px-4">
                  Знижка
                </th>
                <th scope="col" className="py-3 px-4">
                  Наявність
                </th>
                <th scope="col" className="py-3 px-4">
                  Дія
                </th>
              </tr>
            </thead>

            <tbody>
              {products.map((product, i) => (
                <tr key={i}>
                  <td
                    scope="row"
                    className="py-1 px-6 font-medium whitespace-nowrap"
                  >
                    {i + 1}
                  </td>
                  <td
                    scope="row"
                    className="py-1 px-4 font-medium whitespace-nowrap"
                  >
                    <img
                      className="w-[45px] h-[45px] "
                      src={product.images[0]}
                      alt=""
                    />
                  </td>
                  <td
                    scope="row"
                    className="py-1 px-4 font-medium whitespace-nowrap"
                  >
                    {product?.name?.slice(0, 15)}...
                  </td>
                  <td
                    scope="row"
                    className="py-1 px-4 font-medium whitespace-nowrap"
                  >
                    {product.category?.name}
                  </td>
                  <td
                    scope="row"
                    className="py-1 px-4 font-medium whitespace-nowrap"
                  >
                    {product.brand}
                  </td>
                  <td
                    scope="row"
                    className="py-1 px-4 font-medium whitespace-nowrap"
                  >
                    ₴{product.price}
                  </td>
                  <td
                    scope="row"
                    className="py-1 px-4 font-medium whitespace-nowrap"
                  >
                    {product.discount === 0 ? (
                      <span>Без знижки</span>
                    ) : (
                      <span>{product.discount} %</span>
                    )}
                  </td>
                  <td
                    scope="row"
                    className="py-1 px-4 font-medium whitespace-nowrap"
                  >
                    {product.stock <= 0 ? (
                      <span className="px-2 py-[2px] rounded bg-red-500 text-white text-xs">
                        Немає в наявності
                      </span>
                    ) : product.stock <= 3 ? (
                      <span className="px-2 py-[2px] rounded bg-yellow-500 text-black text-xs">
                        Закінчується: {product.stock}
                      </span>
                    ) : (
                      product.stock
                    )}
                  </td>
                  <td
                    scope="row"
                    className="py-1 px-4 font-medium whitespace-nowrap"
                  >
                    <div className="flex justify-start items-center gap-4">
                      <Link
                        to={`/seller/dashboard/edit-product/${product._id}`}
                        className="p-[6px] bg-yellow-500 rounded hover:shadow-lg hover:shadow-yellow-500/50  "
                      >
                        <FaEdit />
                      </Link>

                      <Link
                        to={`/seller/dashboard/add-banner/${product._id}`}
                        className="p-[6px] bg-sky-500 rounded hover:shadow-lg hover:shadow-yellow-500/50  "
                      >
                        <RiImageEditLine />
                      </Link>

                      <a
                        href={`${import.meta.env.VITE_PRODUCTION_FRONT}/product/details/${product.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        title="Переглянути на сайті"
                        className="p-[6px] bg-green-500 rounded hover:shadow-lg hover:shadow-green-500/50  "
                      >
                        <FaEye />
                      </a>
                      <button
                        type="button"
                        title="Видалити товар"
                        onClick={() => setProductToDelete(product)}
                        className="p-[6px] bg-red-500 rounded hover:shadow-lg hover:shadow-red-500/50  "
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {totalProduct <= perPage ? (
          ""
        ) : (
          <div className="w-full flex justify-end mt-4 bottom-4 right-4">
            <Pagination
              pageNumber={currentPage}
              setPageNumber={setCurrentPage}
              totalItem={totalProduct}
              perPage={perPage}
              showItem={3}
            />
          </div>
        )}
      </div>

      {productToDelete && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 px-4"
          onClick={() => setProductToDelete(null)}
        >
          <div
            className="w-full max-w-[420px] p-5 bg-[#6a5fdf] rounded-md text-[#d0d2d6] shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold mb-2">Видалити товар?</h2>
            <p className="text-sm mb-1">
              Ви збираєтесь назавжди видалити товар:
            </p>
            <p className="text-sm font-semibold mb-3 break-words">
              {productToDelete.name}
            </p>
            <p className="text-xs mb-4">
              Будуть видалені фото, відгуки та згадки в кошиках і списках
              бажань. Історія вже оформлених замовлень збережеться. Цю дію не
              можна скасувати.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setProductToDelete(null)}
                className="bg-slate-700 text-white rounded-md px-4 py-1 text-sm"
              >
                Скасувати
              </button>
              <button
                type="button"
                onClick={() => dispatch(delete_product(productToDelete._id))}
                className="bg-red-500 hover:shadow-lg hover:shadow-red-500/50 text-white rounded-md px-4 py-1 text-sm"
              >
                Видалити
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;
