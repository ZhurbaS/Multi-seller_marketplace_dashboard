import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Pagination from "../Pagination";
import { FaEdit } from "react-icons/fa";
import { FaTrash, FaImage } from "react-icons/fa6";
import { IoMdCloseCircle } from "react-icons/io";
import { PropagateLoader } from "react-spinners";
import { overrideStyle } from "../../utils/utils";
import {
  categoryAdd,
  messageClear,
  get_category,
  updateCategory,
  deleteCategory
} from "./../../store/Reducers/categorySlice";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import Search from "./../components/Search";

const Category = () => {
  const dispatch = useDispatch();
  const { loader, successMessage, errorMessage, categories } = useSelector(
    (state) => state.category
  );

  const [currentPage, setCurrentPage] = useState(1);
  const [searchValue, setSearchValue] = useState("");
  const [perPage, setPerPage] = useState(5);
  const [show, setShow] = useState(false);
  const [imageShow, setImage] = useState("");
  const [isEdit, setIsEdit] = useState(false);
  const [editId, setEditId] = useState(null);

  const [state, setState] = useState({
    name: "",
    image: "",
  });

  const imageHandle = (e) => {
    let files = e.target.files;
    if (files.length > 0) {
      setImage(URL.createObjectURL(files[0]));
      setState({
        ...state,
        image: files[0],
      });
    }
  };

  const addOrUpdateCategory = (e) => {
    e.preventDefault();
    if (isEdit) {
      dispatch(updateCategory({ id: editId, ...state }));
    } else {
      dispatch(categoryAdd(state));
    }
    // console.log(state);
  };

  useEffect(() => {
    if (successMessage) {
      toast.success(successMessage);
      dispatch(messageClear());
      setState({
        name: "",
        image: "",
      });
      setImage("");
      setIsEdit(false);
      setEditId(null);
    }
    if (errorMessage) {
      toast.error(errorMessage);
      dispatch(messageClear());
    }
  }, [successMessage, errorMessage]);

  useEffect(() => {
    const obj = {
      perPage: parseInt(perPage),
      page: parseInt(currentPage),
      searchValue,
    };
    dispatch(get_category(obj));
  }, [searchValue, currentPage, perPage]);

  const handleEdit = (category) => {
    setState({
      name: category.name,
      image: category.image,
    });
    setImage(category.image);
    setEditId(category._id);
    setIsEdit(true);
    setShow(true);
  };

  const handleDelete=(id)=>{
    if (window.confirm('Ви впевнені, що хочете видалити категорію?')) {
      console.log('delete category id :', id)
      dispatch(deleteCategory(id));
    }
  }

  return (
    <div className="px-2 lg:px-7 pt-5">
      <div className="flex lg:hidden justify-between items-center mb-5 p-4 bg-[#6a5fdf] rounded-md">
        <h1 className="text-[#d0d2d6] font-semibold text-lg">Категорія</h1>

        <button
          onClick={() => setShow(true)}
          className="bg-red-500 shadow-lg hover:shadow-red-500/40 px-4 py-2 cursor-pointer text-white rounded-sm text-sm"
        >
          Додати
        </button>
      </div>

      <div className="flex flex-wrap w-full">
        <div className="w-full lg:w-7/12">
          <div className="w-full p-4 bg-[#6a5fdf] rounded-md">
            <Search
              setPerPage={setPerPage}
              setSearchValue={setSearchValue}
              searchValue={searchValue}
            />

            <div className="relative overflow-x-auto">
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
                      Дія
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {categories.map((d, i) => (
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
                          src={d.image}
                          alt=""
                        />
                      </td>
                      <td
                        scope="row"
                        className="py-1 px-4 font-medium whitespace-nowrap"
                      >
                        {d.name}
                      </td>
                      <td
                        scope="row"
                        className="py-1 px-4 font-medium whitespace-nowrap"
                      >
                        <div className="flex justify-start items-center gap-4">
                          <Link
                            onClick={() => handleEdit(d)}
                            className="p-[6px] bg-yellow-500 rounded hover:shadow-lg hover:shadow-yellow-500/50  "
                          >
                            <FaEdit />
                          </Link>
                          <Link
                            onClick={() => handleDelete(d._id)}
                            className="p-[6px] bg-red-500 rounded hover:shadow-lg hover:shadow-red-500/50  "
                          >
                            <FaTrash />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="w-full flex justify-end mt-4 bottom-4 right-4">
              <Pagination
                pageNumber={currentPage}
                setPageNumber={setCurrentPage}
                totalItem={50}
                perPage={perPage}
                showItem={3}
              />
            </div>
          </div>
        </div>

        <div
          className={`fixed top-0 right-0 z-[9999] w-[320px] lg:w-5/12 transition-transform duration-500 ${
            show ? "translate-x-0" : "translate-x-full"
          } lg:relative lg:translate-x-0 lg:top-auto lg:right-auto`}
        >
          <div className="w-full pl-5">
            <div className="bg-[#6a5fdf] h-screen lg:h-auto px-3 py-2 lg:rounded-md text-[#d0d2d6]">
              <div className="flex justify-between items-center mb-4">
                <h1 className="text-[#d0d2d6] font-semibold text-xl mb-4 w-full text-center">
                  {isEdit ? "Змінити категорію" : "Додати категорію"}
                </h1>
                <div onClick={() => setShow(false)} className="block lg:hidden">
                  <IoMdCloseCircle />
                </div>
              </div>

              <form onSubmit={addOrUpdateCategory}>
                <div className="flex flex-col w-full gap-1 mb-3">
                  <label htmlFor="name">Назва категорії</label>
                  <input
                    value={state.name}
                    onChange={(e) =>
                      setState({ ...state, name: e.target.value })
                    }
                    className="px-4 py-2 focus:border-indigo-600 outline-none bg-[#6a5fdf] border border-slate-700 rounded-md text-[#d0d2d6]"
                    type="text"
                    id="name"
                    name="category_name"
                    placeholder="Назва категорії"
                  />
                </div>
                <div>
                  <label
                    className="flex justify-center items-center flex-col h-[238px] cursor-pointer border border-dashed hover:border-indigo-600 w-full border-[#d0d2d6]"
                    htmlFor="image"
                  >
                    {imageShow ? (
                      <img className="w-full h-full" src={imageShow} />
                    ) : (
                      <>
                        <span>
                          <FaImage />
                        </span>
                        <span>Обрати зображення</span>
                      </>
                    )}
                  </label>
                  <input
                    onChange={imageHandle}
                    className="hidden"
                    type="file"
                    name="image"
                    id="image"
                  />
                  <div className="mt-4">
                    <button
                      disabled={loader ? true : false}
                      className="bg-red-800 w-full hover:shadow-red-300/50 hover:shadow-lg text-white rounded-md px-7 py-2 mb-3"
                    >
                      {loader ? (
                        <PropagateLoader
                          color="#fff"
                          cssOverride={overrideStyle}
                        />
                      ) : isEdit ? (
                        "Оновити категорію"
                      ) : (
                        "Додати категорію"
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Category;
