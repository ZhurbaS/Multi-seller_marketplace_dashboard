import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { IoMdImages } from "react-icons/io";
import { IoMdCloseCircle } from "react-icons/io";
import { useDispatch, useSelector } from "react-redux";
import { get_category } from "../../store/Reducers/categorySlice";
import { add_product, messageClear } from "../../store/Reducers/productSlice";
import { overrideStyle } from "../../utils/utils";
import toast from "react-hot-toast";
import { PropagateLoader } from "react-spinners";

const AddProduct = () => {
  const dispatch = useDispatch();
  const { categories } = useSelector((state) => state.category);
  const { loader, successMessage, errorMessage } = useSelector(
    (state) => state.product
  );

  useEffect(() => {
    dispatch(
      get_category({
        searchValue: "",
        perPage: "",
        page: "",
      })
    );
  }, []);

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
  const [allCategory, setAllCategory] = useState([]);
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

  const [specifications, setSpecifications] = useState([
    { key: "", value: "" },
  ]);

  const specChange = (index, field, value) => {
    const updated = [...specifications];
    updated[index] = { ...updated[index], [field]: value };
    setSpecifications(updated);
  };

  const addSpecRow = () => {
    setSpecifications([...specifications, { key: "", value: "" }]);
  };

  const removeSpecRow = (index) => {
    setSpecifications(specifications.filter((_, i) => i !== index));
  };

  const [images, setImages] = useState([]);
  const [imageShow, setImageShow] = useState([]);

  const imageHandle = (e) => {
    const files = e.target.files;
    const length = files.length;
    if (length > 0) {
      setImages([...images, ...files]);
      let imageUrl = [];
      for (let i = 0; i < length; i++) {
        imageUrl.push({ url: URL.createObjectURL(files[i]) });
      }
      setImageShow([...imageShow, ...imageUrl]);
    }
  };
  // console.log(images);
  // console.log(imageShow);

  const changeImage = (img, i) => {
    if (img) {
      let tempUrl = imageShow;
      let tempImages = images;

      tempImages[i] = img;
      tempUrl[i] = { url: URL.createObjectURL(img) };
      setImageShow([...tempUrl]);
      setImages([...tempImages]);
    }
  };

  const removeImage = (i) => {
    const filterImage = images.filter((img, index) => index !== i);
    const filterImageUrl = imageShow.filter((img, index) => index !== i);
    setImages(filterImage);
    setImageShow(filterImageUrl);
  };

  const add = (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("name", state.name);
    formData.append("description", state.description);
    formData.append("price", state.price);
    formData.append("stock", state.stock);
    formData.append("discount", state.discount);
    formData.append("brand", state.brand);
    formData.append("shopName", "TechScout");
    formData.append("category", category);
    formData.append(
      "specifications",
      JSON.stringify(
        specifications.filter((s) => s.key.trim() && s.value.trim())
      )
    );

    for (let i = 0; i < images.length; i++) {
      formData.append("images", images[i]);
    }

    dispatch(add_product(formData));
  };

  useEffect(() => {
    setAllCategory(categories);
  }, [categories]);

  useEffect(() => {
    if (successMessage) {
      toast.success(successMessage);
      dispatch(messageClear());
      setState({
        name: "",
        description: "",
        discount: "",
        price: "",
        brand: "",
        stock: "",
      });
      setImageShow([]);
      setImages([]);
      setCategory();
      setSpecifications([{ key: "", value: "" }]);
    }
    if (errorMessage) {
      toast.error(errorMessage);
      dispatch(messageClear());
    }
  }, [successMessage, errorMessage]);

  return (
    <div className="px-2 lg:px-7 pt-5">
      <div className="w-full p-4 bg-[#6a5fdf] rounded-md ">
        <div className="flex justify-between items-center pb-4">
          <h1 className="text-[#d0d2d6] text-xl font-semibold">Додати товар</h1>
          <Link
            to={"/seller/dashboard/products"}
            className="bg-blue-500 hover:shadow-blue-500/50 hover:shadow-lg text-white rounded-sm px-7 py-2 my-2"
          >
            Всі товари
          </Link>
        </div>
        <div>
          <form onSubmit={add} encType="multipart/form-data">
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
                  value={
                    allCategory.find((c) => c._id === category)?.name || ""
                  }
                  type="text"
                  id="category"
                  placeholder="--обрати категорію--"
                />
                <div
                  className={`absolute top-[101%] z-20 origin-top transition-transform duration-200 transform bg-[#475569] w-full ${
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
                  <div className="flex justify-start items-start flex-col h-[200px] overflow-y-auto scrollbar-hide">
                    {allCategory.map((c, i) => (
                      <span
                        key={c._id}
                        className={`px-4 py-2 hover:bg-indigo-500 hover:text-white hover:shadow-lg w-full cursor-pointer ${
                          category === c.name && "bg-indigo-500"
                        }`}
                        onClick={() => {
                          setCateShow(false);
                          setCategory(c._id);
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
            <div className="flex flex-col w-full gap-2 mb-5">
              <label className="text-[#d0d2d6]">Характеристики</label>
              {specifications.map((spec, i) => (
                <div className="flex gap-3 items-center" key={i}>
                  <input
                    className="px-4 py-2 focus:border-indigo-600 outline-none bg-[#6a5fdf] border border-slate-700 rounded-md text-[#d0d2d6] w-full"
                    value={spec.key}
                    onChange={(e) => specChange(i, "key", e.target.value)}
                    type="text"
                    placeholder="Назва (напр. Екран)"
                  />
                  <input
                    className="px-4 py-2 focus:border-indigo-600 outline-none bg-[#6a5fdf] border border-slate-700 rounded-md text-[#d0d2d6] w-full"
                    value={spec.value}
                    onChange={(e) => specChange(i, "value", e.target.value)}
                    type="text"
                    placeholder="Значення (напр. 15.6″)"
                  />
                  <span
                    onClick={() => removeSpecRow(i)}
                    className="p-2 cursor-pointer bg-slate-700 hover:shadow-lg hover:shadow-slate-400/50 text-white rounded-full"
                  >
                    <IoMdCloseCircle />
                  </span>
                </div>
              ))}
              <button
                type="button"
                onClick={addSpecRow}
                className="self-start bg-slate-700 hover:shadow-lg hover:shadow-slate-400/50 text-white rounded-md px-4 py-1 text-sm mt-1"
              >
                + Додати характеристику
              </button>
            </div>
            <div className="grid lg:grid-cols-4 grid-cols-1 md:grid-cols-3 sm:grid-cols-2 sm:gap-4 md:gap-4 gap-3 w-fulltext-[#d0d2d6] mb-4">
              {imageShow.map((img, i) => (
                <div className="h-[180px] relative" key={i}>
                  <label htmlFor={i}>
                    <img className="h-full rounded-sm" src={img.url} alt="" />
                  </label>
                  <input
                    onChange={(e) => changeImage(e.target.files[0], i)}
                    type="file"
                    id={i}
                    className="hidden"
                  />
                  <span
                    onClick={() => removeImage(i)}
                    className="p-2 x-10 cursor-pointer bg-slate-700 hover:shadow-lg hover:shadow-slate-400/50 text-white absolute top-1 right-1 rounded-full"
                  >
                    <IoMdCloseCircle />
                  </span>
                </div>
              ))}
              <label
                className="flex justify-center items-center flex-col h-[180px] cursor-pointer border border-dashed hover:border-red-500 w-full text-[#d0d2d6]"
                htmlFor="image"
              >
                <span>
                  <IoMdImages />
                </span>
                <span>Обрати зображення</span>
              </label>
              <input
                className="hidden"
                onChange={imageHandle}
                multiple
                type="file"
                id="image"
              />
            </div>
            <div className="flex">
              <button
                disabled={loader ? true : false}
                className="bg-red-500 w-[280px] hover:shadow-red-300/50 hover:shadow-lg text-white rounded-md px-7 py-2 mb-3"
              >
                {loader ? (
                  <PropagateLoader color="#fff" cssOverride={overrideStyle} />
                ) : (
                  "Додати товар"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddProduct;
