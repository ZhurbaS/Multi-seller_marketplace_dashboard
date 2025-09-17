import React, { useEffect } from "react";
import { useDispatch } from "react-redux";
import { useParams } from "react-router-dom";
import { get_admin_order_details } from "../../store/Reducers/orderSlice";

const OrderDetails = () => {
  const { orderId } = useParams();

  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(get_admin_order_details(orderId));
  }, [orderId]);

  return (
    <div className="px-2 lg:px-7 pt-5">
      <div className="w-full p-4 bg-[#6a5fdf] rounded-md">
        <div className="flex justify-between items-center p-4">
          <h2 className="text-xl text-[#d0d2d6]">Деталі замовлення</h2>
          <select
            name=""
            id=""
            className="px-4 py-2 focus:border-indigo-500 outline-none bg-[#475569] border border-slate-700 rounded-md text-[#d0d2d6]"
          >
            <option value="">Скасовано</option>
            <option value="">Розміщено</option>
            <option value="">Опрацьовується</option>
            <option value="">Очікує на оплату</option>
            <option value="">Готується до відправки</option>
            <option value="">Відправлено</option>
            <option value="">Доставлено</option>
          </select>
        </div>
        <div className="p-4">
          <div className="flex gap-2 text-lg text-[#d0d2d6]">
            <h2>#255</h2>
            <span>6 серпня 2025</span>
          </div>
          <div className="flex flex-wrap">
            <div className="w-[30%]">
              <div className="pr-3 text-[#d0d2d6] text-lg">
                <div className="flex flex-col gap-1">
                  <h2 className="pb-2 font-semibold">
                    Одержувач: Микола Панасенко
                  </h2>
                  <p>
                    <span className="text-sm">
                      пр. Берестейський, буд. 54, 2 під'їзд, кв. 170, м. Київ,
                      01001
                    </span>
                  </p>
                </div>
                <div className="flex justify-start items-center gap-3">
                  <h2>Статус оплати: </h2>
                  <span className="text-base">Оплачено</span>
                </div>
                <span>Ціна: ₴750</span>
                <div className="mt-4 flex flex-col gap-4 bg-[#8288ed] rounded-md">
                  <div className="text-[#d0d2d6]">
                    <div className="flex gap-3 text-md">
                      <img
                        className="w-[50px] h-[50px]"
                        src="http://localhost:5173/images/category/1.jpg"
                        alt=""
                      />
                      <div className="">
                        <h2>Назва: Кросівки Flex Star</h2>
                        <p>
                          <span>Бренд: </span>
                          <span>Nike </span>
                        </p>
                        <p>
                          <span className="text-lg">Кількість: 3</span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex flex-col gap-4 bg-[#8288ed] rounded-md">
                  <div className="text-[#d0d2d6]">
                    <div className="flex gap-3 text-md">
                      <img
                        className="w-[50px] h-[50px]"
                        src="http://localhost:5173/images/category/1.jpg"
                        alt=""
                      />
                      <div className="">
                        <h2>Назва: Кросівки Flex Star</h2>
                        <p>
                          <span>Бренд: </span>
                          <span>Nike </span>
                        </p>
                        <p>
                          <span className="text-lg">Кількість: 3</span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex flex-col gap-4 bg-[#8288ed] rounded-md">
                  <div className="text-[#d0d2d6] mt-2">
                    <div className="flex gap-3 text-md mt-2">
                      <img
                        className="w-[50px] h-[50px]"
                        src="http://localhost:5173/images/category/1.jpg"
                        alt=""
                      />
                      <div className="">
                        <h2>Назва: Кросівки Flex Star</h2>
                        <p>
                          <span>Бренд: </span>
                          <span>Nike </span>
                        </p>
                        <p>
                          <span className="text-lg">Кількість: 3</span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="w-[70%]">
              <div className="pl-3 ">
                <div className="mt-4 flex flex-col bg-[#8288ed] rounded-md p-4">
                  <div className="text-[#d0d2d6]">
                    <div className="flex justify-start items-center gap-3">
                      <h2>Продавець 1 Замовлення: </h2>
                      <span>Очікує на оплату</span>
                    </div>

                    <div className="flex gap-3 text-md">
                      <img
                        className="w-[50px] h-[50px]"
                        src="http://localhost:5173/images/category/1.jpg"
                        alt=""
                      />
                      <div className="">
                        <h2>Назва: Кросівки Flex Star</h2>
                        <p>
                          <span>Бренд: </span>
                          <span>Nike </span>
                        </p>
                        <p>
                          <span className="text-lg">Кількість: 3</span>
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="text-[#d0d2d6] mt-2">
                    <div className="flex justify-start items-center gap-3">
                      <h2>Продавець 2 Замовлення: </h2>
                      <span>Очікує на оплату</span>
                    </div>

                    <div className="flex gap-3 text-md mt-2">
                      <img
                        className="w-[50px] h-[50px]"
                        src="http://localhost:5173/images/category/1.jpg"
                        alt=""
                      />
                      <div className="">
                        <h2>Назва: Кросівки Flex Star</h2>
                        <p>
                          <span>Бренд: </span>
                          <span>Nike </span>
                        </p>
                        <p>
                          <span className="text-lg">Кількість: 3</span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetails;
