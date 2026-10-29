import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BsArrowBarDown } from "react-icons/bs";
import Pagination from "../Pagination";
import { toast } from "react-hot-toast";
import { useDispatch, useSelector } from "react-redux";
import { get_admin_orders } from "../../store/Reducers/orderSlice";
import { payLabel, deliveryLabel } from "../../utils/statusLabels";

const Orders = () => {
  const dispatch = useDispatch();

  const [currentPage, setCurrentPage] = useState(1);
  const [searchValue, setSearchValue] = useState("");
  const [perPage, setPerPage] = useState(5);
  const [show, setShow] = useState(null);

  const { totalOrderCount, myOrdersArr } = useSelector((state) => state.order);

  const toggleSuborder = (orderId) => {
    // Якщо клікаємо на відкрите замовлення, закриваємо його
    setShow((prev) => (prev === orderId ? null : orderId));
  };

  useEffect(() => {
    const obj = {
      perPage: parseInt(perPage),
      page: parseInt(currentPage),
      searchValue,
    };
    dispatch(get_admin_orders(obj));
  }, [searchValue, currentPage, perPage]);

  return (
    <div className="px-2 lg:px-7 pt-5">
      <div className="w-full p-4 bg-[#6a5fdf] rounded-md">
        <div className="flex justify-between items-center">
          <select
            onChange={(e) => setPerPage(parseInt(e.target.value))}
            className="px-4 py-2 focus:border-indigo-600 outline-none bg-[#6a5fdf] border border-slate-700 rounded-md text-[#d0d2d6]"
          >
            <option value="5">5</option>
            <option value="10">10</option>
            <option value="20">20</option>
          </select>
          <input
            onChange={(e) => setSearchValue(e.target.value)}
            value={searchValue}
            className="px-4 py-2 focus:border-indigo-600 outline-none bg-[#6a5fdf] border border-slate-700 rounded-md text-[#d0d2d6]"
            type="text"
            placeholder="Пошук"
          />
        </div>

        <div className="relative mt-5 overflow-x-auto">
          <div className="w-full text-sm text-left bg-[#6a5fdf] ">
            <div className="text-sm text-[#d0d2d6] uppercase border-b border-slate-700">
              <div className="flex justify-between items-center">
                <div className="py-3 w-[25%] font-bold">Id замовлення</div>
                <div className="py-3 w-[13%] font-bold">Ціна</div>
                <div className="py-3 w-[18%] font-bold">Статус оплати</div>
                <div className="py-3 w-[18%] font-bold">Статус замовлення</div>
                <div className="py-3 w-[18%] font-bold">Дія</div>
                <div className="py-3 w-[8%] font-bold">Деталі</div>
              </div>
            </div>

            {myOrdersArr.map((o, i) => (
              <div key={o._id} className="text-[#d0d2d6]">
                <div className="flex justify-between items-start border-b border-slate-700">
                  <div className="py-3 w-[25%] font-medium whitespace-nowrap">
                    #{o._id}
                  </div>
                  <div className="py-3 w-[13%] font-medium">₴{o.price}</div>
                  <div className="py-3 w-[18%] font-medium">
                    {payLabel(o.payment_status)}
                    {o.invoice?.number && (
                      <div className="text-xs opacity-80">
                        рахунок {o.invoice.number}: {{ awaiting: "не надіслано", sent: "надіслано", paid: "оплачено", expired: "строк минув", cancelled: "скасовано" }[o.invoice.status] || ""}
                      </div>
                    )}
                  </div>
                  <div className="py-3 w-[18%] font-medium">
                    {deliveryLabel(o.delivery_status)}
                  </div>
                  <div className="py-3 w-[18%] font-medium">
                    <Link
                      to={`/admin/dashboard/order/details/${o._id}`}
                      className="inline-block px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition duration-200"
                    >
                      Переглянути
                    </Link>
                  </div>
                  <div
                    onClick={() => toggleSuborder(o._id)}
                    className="py-3 w-[8%] font-bold cursor-pointer"
                  >
                    <BsArrowBarDown />
                  </div>
                </div>

                <div
                  className={
                    show === o._id
                      ? "block border-b border-slate-700 bg-[#8288ed]"
                      : "hidden"
                  }
                >
                  {o.suborder.map((so, i) => (
                    <div
                      key={so._id}
                      className="flex justify-start items-start border-b border-slate-700"
                    >
                      <div className="py-3 w-[25%] font-medium whitespace-nowrap pl-3">
                        #{so._id}
                      </div>
                      <div className="py-3 w-[13%] font-medium">
                        ₴{so.price}
                      </div>
                      <div className="py-3 w-[18%] font-medium">
                        {payLabel(so.payment_status)}
                      </div>
                      <div className="py-3 w-[18%] font-medium">
                        {deliveryLabel(so.delivery_status)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {totalOrderCount <= perPage ? (
          ""
        ) : (
          <div className="w-full flex justify-end mt-4 bottom-4 right-4">
            <Pagination
              pageNumber={currentPage}
              setPageNumber={setCurrentPage}
              totalItem={totalOrderCount}
              perPage={perPage}
              showItem={4}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default Orders;
