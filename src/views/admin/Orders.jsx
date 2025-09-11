import React, { useState } from "react";
import { Link } from "react-router-dom";
import { BsArrowBarDown } from "react-icons/bs";
import Pagination from "../Pagination";
import { toast } from "react-hot-toast";

const Orders = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchValue, setSearchValue] = useState("");
  const [perPage, setPerPage] = useState(5);
  const [show, setShow] = useState(false);

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
                <div className="py-3 w-[8%] font-bold">
                  <BsArrowBarDown />
                </div>
              </div>
            </div>

            <div className="text-[#d0d2d6]">
              <div className="flex justify-between items-start border-b border-slate-700">
                <div className="py-3 w-[25%] font-medium whitespace-nowrap">
                  #56565
                </div>
                <div className="py-3 w-[13%] font-medium">₴750</div>
                <div className="py-3 w-[18%] font-medium">В очікуванні</div>
                <div className="py-3 w-[18%] font-medium">В очікуванні</div>
                <div className="py-3 w-[18%] font-medium">
                  <Link to="/admin/dashboard/order/details/3">Переглянути</Link>
                </div>
                <div
                  onClick={(e) => setShow(!show)}
                  className="py-3 w-[8%] font-bold"
                >
                  <BsArrowBarDown />
                </div>
              </div>
              <div
                className={
                  show
                    ? "block border-b border-slate-700 bg-[#8288ed]"
                    : "hidden"
                }
              >
                <div className="flex justify-start items-start border-b border-slate-700">
                  <div className="py-3 w-[25%] font-medium whitespace-nowrap pl-3">
                    #56511
                  </div>
                  <div className="py-3 w-[13%] font-medium">₴450</div>
                  <div className="py-3 w-[18%] font-medium">В очікуванні</div>
                  <div className="py-3 w-[18%] font-medium">В очікуванні</div>
                </div>

                <div className="flex justify-start items-start border-b border-slate-700">
                  <div className="py-3 w-[25%] font-medium whitespace-nowrap pl-3">
                    #56511
                  </div>
                  <div className="py-3 w-[13%] font-medium">₴450</div>
                  <div className="py-3 w-[18%] font-medium">В очікуванні</div>
                  <div className="py-3 w-[18%] font-medium">В очікуванні</div>
                </div>
              </div>
            </div>

            <div className="text-[#d0d2d6]">
              <div className="flex justify-between items-start border-b border-slate-700">
                <div className="py-3 w-[25%] font-medium whitespace-nowrap">
                  #56565
                </div>
                <div className="py-3 w-[13%] font-medium">₴750</div>
                <div className="py-3 w-[18%] font-medium">В очікуванні</div>
                <div className="py-3 w-[18%] font-medium">В очікуванні</div>
                <div className="py-3 w-[18%] font-medium">
                  <Link to="/admin/dashboard/order/details/3">Переглянути</Link>
                </div>
                <div
                  onClick={(e) => setShow(!show)}
                  className="py-3 w-[8%] font-bold"
                >
                  <BsArrowBarDown />
                </div>
              </div>
              <div
                className={
                  show
                    ? "block border-b border-slate-700 bg-[#8288ed]"
                    : "hidden"
                }
              >
                <div className="flex justify-start items-start border-b border-slate-700">
                  <div className="py-3 w-[25%] font-medium whitespace-nowrap pl-3">
                    #56511
                  </div>
                  <div className="py-3 w-[13%] font-medium">₴450</div>
                  <div className="py-3 w-[18%] font-medium">В очікуванні</div>
                  <div className="py-3 w-[18%] font-medium">В очікуванні</div>
                </div>

                <div className="flex justify-start items-start border-b border-slate-700">
                  <div className="py-3 w-[25%] font-medium whitespace-nowrap pl-3">
                    #56511
                  </div>
                  <div className="py-3 w-[13%] font-medium">₴450</div>
                  <div className="py-3 w-[18%] font-medium">В очікуванні</div>
                  <div className="py-3 w-[18%] font-medium">В очікуванні</div>
                </div>
              </div>
            </div>

            <div className="text-[#d0d2d6]">
              <div className="flex justify-between items-start border-b border-slate-700">
                <div className="py-3 w-[25%] font-medium whitespace-nowrap">
                  #56565
                </div>
                <div className="py-3 w-[13%] font-medium">₴750</div>
                <div className="py-3 w-[18%] font-medium">В очікуванні</div>
                <div className="py-3 w-[18%] font-medium">В очікуванні</div>
                <div className="py-3 w-[18%] font-medium">
                  <Link to="/admin/dashboard/order/details/3">Переглянути</Link>
                </div>
                <div
                  onClick={(e) => setShow(!show)}
                  className="py-3 w-[8%] font-bold"
                >
                  <BsArrowBarDown />
                </div>
              </div>
              <div
                className={
                  show
                    ? "block border-b border-slate-700 bg-[#8288ed]"
                    : "hidden"
                }
              >
                <div className="flex justify-start items-start border-b border-slate-700">
                  <div className="py-3 w-[25%] font-medium whitespace-nowrap pl-3">
                    #56511
                  </div>
                  <div className="py-3 w-[13%] font-medium">₴450</div>
                  <div className="py-3 w-[18%] font-medium">В очікуванні</div>
                  <div className="py-3 w-[18%] font-medium">В очікуванні</div>
                </div>

                <div className="flex justify-start items-start border-b border-slate-700">
                  <div className="py-3 w-[25%] font-medium whitespace-nowrap pl-3">
                    #56511
                  </div>
                  <div className="py-3 w-[13%] font-medium">₴450</div>
                  <div className="py-3 w-[18%] font-medium">В очікуванні</div>
                  <div className="py-3 w-[18%] font-medium">В очікуванні</div>
                </div>
              </div>
            </div>

            <div className="text-[#d0d2d6]">
              <div className="flex justify-between items-start border-b border-slate-700">
                <div className="py-3 w-[25%] font-medium whitespace-nowrap">
                  #56565
                </div>
                <div className="py-3 w-[13%] font-medium">₴750</div>
                <div className="py-3 w-[18%] font-medium">В очікуванні</div>
                <div className="py-3 w-[18%] font-medium">В очікуванні</div>
                <div className="py-3 w-[18%] font-medium">
                  <Link to="/admin/dashboard/order/details/3">Переглянути</Link>
                </div>
                <div
                  onClick={(e) => setShow(!show)}
                  className="py-3 w-[8%] font-bold"
                >
                  <BsArrowBarDown />
                </div>
              </div>
              <div
                className={
                  show
                    ? "block border-b border-slate-700 bg-[#8288ed]"
                    : "hidden"
                }
              >
                <div className="flex justify-start items-start border-b border-slate-700">
                  <div className="py-3 w-[25%] font-medium whitespace-nowrap pl-3">
                    #56511
                  </div>
                  <div className="py-3 w-[13%] font-medium">₴450</div>
                  <div className="py-3 w-[18%] font-medium">В очікуванні</div>
                  <div className="py-3 w-[18%] font-medium">В очікуванні</div>
                </div>

                <div className="flex justify-start items-start border-b border-slate-700">
                  <div className="py-3 w-[25%] font-medium whitespace-nowrap pl-3">
                    #56511
                  </div>
                  <div className="py-3 w-[13%] font-medium">₴450</div>
                  <div className="py-3 w-[18%] font-medium">В очікуванні</div>
                  <div className="py-3 w-[18%] font-medium">В очікуванні</div>
                </div>
              </div>
            </div>
          </div>
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
  );
};

export default Orders;
