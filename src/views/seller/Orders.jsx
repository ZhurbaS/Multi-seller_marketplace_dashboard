import React, { useEffect, useState } from "react";
import Search from "../components/Search";
import { Link } from "react-router-dom";
import Pagination from "../Pagination";
import { FaEdit, FaEye } from "react-icons/fa";
import { FaTrash } from "react-icons/fa6";
import { useDispatch, useSelector } from "react-redux";
import { get_seller_orders } from "../../store/Reducers/orderSlice";

const Orders = () => {
  const dispatch = useDispatch();

  const { userInfo } = useSelector((state) => state.auth);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchValue, setSearchValue] = useState("");
  const [perPage, setPerPage] = useState(5);
  const { totalOrderCount, myOrdersArr } = useSelector((state) => state.order);

  useEffect(() => {
    const obj = {
      perPage: parseInt(perPage),
      page: parseInt(currentPage),
      searchValue,
      sellerId: userInfo._id,
    };
    dispatch(get_seller_orders(obj));
  }, [searchValue, currentPage, perPage]);

  return (
    <div className="px-2 lg:px-7 pt-5">
      <h1 className="text-[#000000] font-semibold text-lg mb-3">Замовлення</h1>
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
                  Id замовлення
                </th>
                <th scope="col" className="py-3 px-4">
                  Дата
                </th>
                <th scope="col" className="py-3 px-4">
                  Ціна
                </th>
                <th scope="col" className="py-3 px-4">
                  Статус оплати
                </th>
                <th scope="col" className="py-3 px-4">
                  Статус замовлення
                </th>

                <th scope="col" className="py-3 px-4">
                  Дія
                </th>
              </tr>
            </thead>

            <tbody>
              {myOrdersArr.map((d, i) => (
                <tr key={d._id}>
                  <td
                    scope="row"
                    className="py-1 px-4 font-medium whitespace-nowrap"
                  >
                    №{d._id}
                  </td>
                  <td
                    scope="row"
                    className="py-1 px-4 font-medium whitespace-nowrap"
                  >
                    {d.date}
                  </td>
                  <td
                    scope="row"
                    className="py-1 px-4 font-medium whitespace-nowrap"
                  >
                    ₴{d.price}
                  </td>
                  <td
                    scope="row"
                    className="py-1 px-4 font-medium whitespace-nowrap"
                  >
                    {d.payment_status}
                  </td>
                  <td
                    scope="row"
                    className="py-1 px-4 font-medium whitespace-nowrap"
                  >
                    {d.delivery_status}
                  </td>

                  <td
                    scope="row"
                    className="py-1 px-4 font-medium whitespace-nowrap"
                  >
                    <div className="flex justify-start items-center gap-4">
                      <Link
                        to={`/seller/dashboard/orders/details/${d._id}`}
                        className="p-[6px] bg-green-500 rounded hover:shadow-lg hover:shadow-green-500/50  "
                      >
                        <FaEye />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
              showItem={3}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default Orders;
