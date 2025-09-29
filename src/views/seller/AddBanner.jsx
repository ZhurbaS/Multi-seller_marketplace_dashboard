import React, { useEffect, useState } from "react";
import { RiImageAddFill } from "react-icons/ri";
import { overrideStyle } from "../../utils/utils";
import toast from "react-hot-toast";
import { PropagateLoader } from "react-spinners";
import { useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  add_banner,
  get_banner,
  messageClear,
  update_banner,
} from "../../store/Reducers/bannerSlice";

const AddBanner = () => {
  const dispatch = useDispatch();
  const { productId } = useParams();

  const { loader, successMessage, errorMessage, banner } = useSelector(
    (state) => state.banner
  );

  const [imageShow, setImageShow] = useState("");
  const [image, setImage] = useState("");

  useEffect(() => {
    if (successMessage) {
      toast.success(successMessage);
      dispatch(messageClear());
    }
    if (errorMessage) {
      toast.error(errorMessage);
      dispatch(messageClear());
    }
  }, [successMessage, errorMessage]);

  const imageHandle = (e) => {
    const files = e.target.files;
    const length = files.length;

    if (length > 0) {
      setImage(files[0]);
      setImageShow(URL.createObjectURL(files[0]));
    }
  };

  const add = (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("productId", productId);
    formData.append("mainban", image);
    dispatch(add_banner(formData));
  };

  const update = (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("mainban", image);
    dispatch(update_banner({ info: formData, bannerId: banner._id }));
  };

  useEffect(() => {
    dispatch(get_banner(productId));
  }, [productId]);

  return (
    <div className="px-2 lg:px-7 pt-5">
      <h1 className="text-[#000000] font-semibold text-lg mb-3">
        Додати банер
      </h1>
      <div className="w-full p-4 bg-[#6a5fdf] rounded-md">
        {!banner && (
          <div>
            <form onSubmit={add}>
              <div className="mb-4 ">
                <label
                  className="flex justify-center items-center flex-col h-[180px] cursor-pointer border border-dashed hover:border-red-500 w-full text-white"
                  htmlFor="image"
                >
                  <span className="text-4xl">
                    <RiImageAddFill />
                  </span>
                  <span>Оберіть зображення для банера</span>
                </label>
                <input
                  required
                  onChange={imageHandle}
                  type="file"
                  id="image"
                  name=""
                  placeholder=""
                  className="hidden "
                />
              </div>

              {imageShow && (
                <div className="mb-4">
                  <img className="w-full h-[300px]" src={imageShow} alt="" />
                </div>
              )}

              <button
                disabled={loader ? true : false}
                className="bg-red-500 w-[280px] hover:shadow-red-300/50 hover:shadow-lg text-white rounded-md px-7 py-2 mb-3"
              >
                {loader ? (
                  <PropagateLoader color="#fff" cssOverride={overrideStyle} />
                ) : (
                  "Додати банер"
                )}
              </button>
            </form>
          </div>
        )}

        {banner && (
          <div>
            {
              <div className="mb-4">
                <img className="w-full h-[300px]" src={banner.banner} alt="" />
              </div>
            }
            <form onSubmit={update}>
              <div className="mb-4 ">
                <label
                  className="flex justify-center items-center flex-col h-[180px] cursor-pointer border border-dashed hover:border-red-500 w-full text-white"
                  htmlFor="image"
                >
                  <span className="text-4xl">
                    <RiImageAddFill />
                  </span>
                  <span>Оберіть зображення для банера</span>
                </label>
                <input
                  required
                  onChange={imageHandle}
                  type="file"
                  id="image"
                  name=""
                  placeholder=""
                  className="hidden "
                />
              </div>

              {imageShow && (
                <div className="mb-4">
                  <img className="w-full h-[300px]" src={imageShow} alt="" />
                </div>
              )}

              <button
                disabled={loader ? true : false}
                className="bg-red-500 w-[280px] hover:shadow-red-300/50 hover:shadow-lg text-white rounded-md px-7 py-2 mb-3"
              >
                {loader ? (
                  <PropagateLoader color="#fff" cssOverride={overrideStyle} />
                ) : (
                  "Оновити банер"
                )}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default AddBanner;
