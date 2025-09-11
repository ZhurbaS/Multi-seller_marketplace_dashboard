import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { get_category } from "../../store/Reducers/categorySlice";
import {
  get_product,
  update_product,
  messageClear,
  product_image_update,
} from "../../store/Reducers/productSlice";
import { overrideStyle } from "../../utils/utils";
import toast from "react-hot-toast";
import { PropagateLoader } from "react-spinners";

const EditProduct = () => {
  const { productId } = useParams();

  const dispatch = useDispatch();
  const { categories } = useSelector((state) => state.category);
  const { product, loader, successMessage, errorMessage } = useSelector(
    (state) => state.product
  );

  useEffect(() => {
    dispatch(messageClear());
  }, [dispatch]);

  useEffect(() => {
    dispatch(
      get_category({
        searchValue: "",
        perPage: "",
        page: "",
      })
    );
  }, []);

  useEffect(() => {
    if (productId) {
      dispatch(get_product(productId));
    }
  }, [productId]);

  const [state, setState] = useState({
    name: "",
    description: "",
    discount: "",
    price: "",
    brand: "",
    stock: "",
  });

  const inputHandle = (e) => {
    setState({
      ...state,
      [e.target.name]: e.target.value,
    });
  };

  const [cateShow, setCateShow] = useState(false);
  const [category, setCategory] = useState("");
  const [categoryText, setCategoryText] = useState(""); // текст для поля категорії
  const [allCategory, setAllCategory] = useState(categories);
  const [searchValue, setSearchValue] = useState("");

  const categorySearch = (e) => {
    const value = e.target.value;
    setSearchValue(value);
    if (value) {
      let filtered = allCategory.filter(
        (cat) => cat.name.toLowerCase().indexOf(value.toLowerCase()) > -1
      );
      setAllCategory(filtered);
    } else {
      setAllCategory(categories);
    }
  };

  const [imageShow, setImageShow] = useState([]);

  const changeImage = (img, files) => {
    if (files.length > 0) {
      dispatch(
        product_image_update({
          oldImage: img,
          newImage: files[0],
          productId,
        })
      );
    }
  };

  // useEffect to sync categories with local state
  useEffect(() => {
    setAllCategory(categories);
  }, [categories]);
  // useEffect(() => {
  //   if (categories.length > 0) {
  //     setAllCategory(categories);
  //   }
  // }, [categories]);

  // useEffect to sync product with form state
  useEffect(() => {
    if (!product || categories.length === 0) return;

    // синхронізуємо форму
    setState({
      name: product.name || "",
      description: product.description || "",
      discount: product.discount || "",
      price: product.price || "",
      brand: product.brand || "",
      stock: product.stock || "",
    });

    if (Array.isArray(product.images)) {
      setImageShow(product.images);
    }

    // дебаг для категорії
    console.log("categories", categories);
    console.log("product.category", product.category);

    // синхронізація категорії
    if (product.category) {
      // product.category зараз ObjectId або об’єкт через populate
      const catObj =
        typeof product.category === "object"
          ? product.category // якщо populate, беремо об’єкт
          : categories.find((c) => c._id === product.category); // якщо лише _id

      setCategory(catObj ? catObj._id : ""); // зберігаємо _id
      setCategoryText(catObj ? catObj.name : ""); // відображаємо name
    }
  }, [product, categories]);

  useEffect(() => {
    if (successMessage) {
      // console.log("Success message:", successMessage);
      toast.success(successMessage);
      dispatch(messageClear());
    }
    if (errorMessage) {
      // console.log("Error message:", errorMessage);
      toast.error(errorMessage);
      dispatch(messageClear());
    }
  }, [successMessage, errorMessage]);

  const update = (e) => {
    e.preventDefault();
    const obj = {
      name: state.name,
      description: state.description,
      discount: state.discount,
      price: state.price,
      brand: state.brand,
      stock: state.stock,
      category,
      productId: productId,
    };
    dispatch(update_product(obj));
  };

  return (
    <div className="px-2 lg:px-7 pt-5">
      <div className="w-full p-4 bg-[#6a5fdf] rounded-md ">
        <div className="flex justify-between items-center pb-4">
          <h1 className="text-[#d0d2d6] text-xl font-semibold">
            Змінити товар
          </h1>
          <Link
            to={"/seller/dashboard/products"}
            className="bg-blue-500 hover:shadow-blue-500/50 hover:shadow-lg text-white rounded-sm px-7 py-2 my-2"
          >
            Всі товари
          </Link>
        </div>
        <div>
          <form onSubmit={update}>
            <div className="flex flex-col mb-3 md:flex-row gap-4 w-full text-[#d0d2d6]">
              <div className="flex flex-col w-full gap-1">
                <label htmlFor="name">Назва товару</label>
                <input
                  className="px-4 py-2 focus:border-indigo-600 outline-none bg-[#6a5fdf] border border-slate-700 rounded-md text-[#d0d2d6]"
                  onChange={inputHandle}
                  value={state.name}
                  type="text"
                  name="name"
                  id="name"
                  placeholder="Назва товару"
                />
              </div>
              <div className="flex flex-col w-full gap-1">
                <label htmlFor="brand">Бренд товару</label>
                <input
                  className="px-4 py-2 focus:border-indigo-600 outline-none bg-[#6a5fdf] border border-slate-700 rounded-md text-[#d0d2d6]"
                  onChange={inputHandle}
                  value={state.brand}
                  type="text"
                  name="brand"
                  id="brand"
                  placeholder="Бренд товару"
                />
              </div>
            </div>

            <div className="flex flex-col mb-3 md:flex-row gap-4 w-full text-[#d0d2d6]">
              <div className="flex flex-col w-full gap-1 relative">
                <label htmlFor="category">Категорія</label>
                <input
                  readOnly
                  onClick={() => setCateShow(!cateShow)}
                  className="px-4 py-2 focus:border-indigo-600 outline-none bg-[#6a5fdf] border border-slate-700 rounded-md text-[#d0d2d6]"
                  onChange={inputHandle}
                  value={categoryText}
                  type="text"
                  id="category"
                  placeholder="--обрати категорію--"
                />
                <div
                  className={`absolute top-[101%] origin-top transition-transform duration-200 transform bg-[#475569] w-full ${
                    cateShow ? "scale-100" : "scale-0"
                  }`}
                >
                  <div className="w-full px-4 py-2 fixed">
                    <input
                      value={searchValue}
                      onChange={categorySearch}
                      className="px-3 py-1 w-full focus:border-indigo-500 outline-none bg-transparent border border-slate-700 rounded-md text-[#d0d2d6] overflow-hidden"
                      type="text"
                      placeholder="Пошук"
                    />
                  </div>
                  <div className="pt-14"></div>
                  <div className="flex justify-start items-start flex-col h-[200px] scrollbar-hide">
                    {allCategory.map((c, i) => (
                      <span
                        key={c.id || c._id || i}
                        className={`px-4 py-2 hover:bg-indigo-500 hover:text-white hover:shadow-lg w-full cursor-pointer ${
                          category === c._id && "bg-indigo-500"
                        }`}
                        onClick={() => {
                          setCateShow(false);
                          setCategory(c._id); // для збереження
                          setCategoryText(c.name); // для input
                          setSearchValue("");
                          setAllCategory(categories);
                        }}
                      >
                        {c.name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex flex-col w-full gap-1">
                <label htmlFor="stock">У наявності</label>
                <input
                  className="px-4 py-2 focus:border-indigo-600 outline-none bg-[#6a5fdf] border border-slate-700 rounded-md text-[#d0d2d6]"
                  onChange={inputHandle}
                  value={state.stock}
                  type="text"
                  name="stock"
                  id="stock"
                  placeholder="Кількість у наявності"
                />
              </div>
            </div>
            <div className="flex flex-col mb-3 md:flex-row gap-4 w-full text-[#d0d2d6]">
              <div className="flex flex-col w-full gap-1">
                <label htmlFor="price">Ціна</label>
                <input
                  className="px-4 py-2 focus:border-indigo-600 outline-none bg-[#6a5fdf] border border-slate-700 rounded-md text-[#d0d2d6]"
                  onChange={inputHandle}
                  value={state.price}
                  type="number"
                  name="price"
                  id="price"
                  placeholder="Ціна"
                />
              </div>
              <div className="flex flex-col w-full gap-1">
                <label htmlFor="discount">Знижка</label>
                <input
                  className="px-4 py-2 focus:border-indigo-600 outline-none bg-[#6a5fdf] border border-slate-700 rounded-md text-[#d0d2d6]"
                  onChange={inputHandle}
                  value={state.discount}
                  type="number"
                  name="discount"
                  id="discount"
                  placeholder="Знижка в %"
                />
              </div>
            </div>
            <div className="flex flex-col w-full gap-1 mb-5">
              <label htmlFor="description" className="text-[#d0d2d6]">
                Опис
              </label>
              <textarea
                className="px-4 py-2 focus:border-indigo-600 outline-none bg-[#6a5fdf] border border-slate-700 rounded-md text-[#d0d2d6]"
                onChange={inputHandle}
                value={state.description}
                name="description"
                id="description"
                placeholder="Опис"
                cols="10"
                rows="4"
              ></textarea>
            </div>
            <div className="grid lg:grid-cols-4 grid-cols-1 md:grid-cols-3 sm:grid-cols-2 sm:gap-4 md:gap-4 gap-3 w-fulltext-[#d0d2d6] mb-4">
              {Array.isArray(imageShow) &&
                imageShow.map((img, i) => (
                  <div key={i}>
                    <label htmlFor={i}>
                      <img src={img} alt="" />
                    </label>
                    <input
                      onChange={(e) => changeImage(img, e.target.files)}
                      type="file"
                      id={i}
                      className="hidden"
                    />
                  </div>
                ))}
            </div>
            <div className="flex">
              <button
                disabled={loader ? true : false}
                className="bg-red-500 w-[280px] hover:shadow-red-300/50 hover:shadow-lg text-white rounded-md px-7 py-2 mb-3"
              >
                {loader ? (
                  <PropagateLoader color="#fff" cssOverride={overrideStyle} />
                ) : (
                  "Зберегти зміни"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditProduct;
