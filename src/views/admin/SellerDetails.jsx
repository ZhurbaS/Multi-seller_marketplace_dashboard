import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import {
  get_seller,
  seller_status_update,
  messageClear,
} from "./../../store/Reducers/sellerSlice";
import toast from "react-hot-toast";

const SellerDetails = () => {
  const dispatch = useDispatch();
  const { seller, successMessage } = useSelector((state) => state.seller);
  const { sellerId } = useParams();

  useEffect(() => {
    dispatch(get_seller(sellerId));
  }, [sellerId]);

  const [status, setStatus] = useState("");
  const submit = (e) => {
    e.preventDefault();
    dispatch(
      seller_status_update({
        sellerId,
        status,
      })
    );
  };

  useEffect(() => {
    if (successMessage) {
      toast.success(successMessage);
      dispatch(messageClear());
    }
  }, [successMessage]);

  useEffect(() => {
    if (seller) {
      setStatus(seller.status);
    }
  }, [seller]);

  return (
    <div className="px-2 lg:px-7 pt-5">
      <h1 className="text-[20px] font-bold mb-3">Дані продавця</h1>
      <div className="w-full p-4 bg-[#6a5fdf] rounded-md">
        <div className="w-full flex flex-wrap text-[#d0d2d6]">
          <div className="w-3/12 flex justify-center items-center py-3">
            <div>
              {seller?.image ? (
                <img
                  className="w-full"
                  src={`${
                    import.meta.env.VITE_PRODUCTION_FRONT
                  }/images/demoNEW2.png`}
                  alt=""
                />
              ) : (
                <span>Зображення не завантажено</span>
              )}
            </div>
          </div>
          <div className="w-4/12">
            <div className="px-0 md:px-5 py-2">
              <div className="py-2 text-lg">
                <h2>Основна інформація</h2>
              </div>
              <div className="flex justify-between text-sm flex-col gap-2 p-4 bg-[#9e97e9] rounded-md">
                <div className="flex gap-2 font-bold text-[#000000]">
                  <span>Ім'я: </span>
                  <span>{seller?.name}</span>
                </div>
                <div className="flex gap-2 font-bold text-[#000000]">
                  <span>Email: </span>
                  <span>{seller?.email}</span>
                </div>
                <div className="flex gap-2 font-bold text-[#000000]">
                  <span>Телефон: </span>
                  <span>{seller?.phone}</span>
                </div>
                <div className="flex gap-2 font-bold text-[#000000]">
                  <span>Роль: </span>
                  <span>{seller?.role}</span>
                </div>
                <div className="flex gap-2 font-bold text-[#000000]">
                  <span>Статус: </span>
                  <span>{seller?.status}</span>
                </div>
                <div className="flex gap-2 font-bold text-[#000000]">
                  <span>Статус платежу: </span>
                  <span>{seller?.payment}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="w-4/12">
            <div className="px-0 md:px-5 py-2">
              <div className="py-2 text-lg">
                <h2>Адреса</h2>
              </div>
              <div className="flex justify-between text-sm flex-col gap-2 p-4 bg-[#9e97e9] rounded-md">
                <div className="flex gap-2 font-bold text-[#000000]">
                  <span>Назва магазину: </span>
                  <span>{seller?.shopInfo?.shopName}</span>
                </div>
                <div className="flex gap-2 font-bold text-[#000000]">
                  <span>Сайт: </span>
                  <span>{seller?.shopInfo?.shopWebPage}</span>
                </div>
                <div className="flex gap-2 font-bold text-[#000000]">
                  <span>Місто: </span>
                  <span>{seller?.shopInfo?.city}</span>
                </div>
                <div className="flex gap-2 font-bold text-[#000000]">
                  <span>Район: </span>
                  <span>{seller?.shopInfo?.district}</span>
                </div>
                <div className="flex gap-2 font-bold text-[#000000]">
                  <span>Адреса: </span>
                  <span>{seller?.shopInfo?.address}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div>
          <form onSubmit={submit}>
            <div className="flex gap-4 py-3">
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="px-4 py-2 focus:border-indigo-600 outline-none bg-[#6a5fdf] border border-slate-700 rounded-md text-[#d0d2d6]"
                name=""
                id=""
                required
              >
                <option value="">--Обрати статус--</option>
                <option value="active">Активний</option>
                <option value="deactive">Неактивний</option>
              </select>
              <button className="bg-red-500 w-[170px] hover:shadow-red-500/40 hover:shadow-md text-white rounded-md px-7 py-2">
                Зберегти
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SellerDetails;
