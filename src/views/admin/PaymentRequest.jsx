import React, { forwardRef, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { FixedSizeList as List } from "react-window";
import {
  confirm_payment_request,
  get_payment_requests,
  messageClear,
} from "../../store/Reducers/paymentSlice";
import moment from "moment";
import toast from "react-hot-toast";

function handleOnWheel({ deltaY }) {
  console.log("handleOnWheel", deltaY);
}

const outerElementType = forwardRef((props, ref) => (
  <div ref={ref} onWheel={handleOnWheel} {...props} />
));

const PaymentRequest = () => {
  const dispatch = useDispatch();

  const { successMessage, errorMessage, pendingWithdrawals, loader } =
    useSelector((state) => state.payment);
  const [paymentId, setPaymentId] = useState("");

  useEffect(() => {
    dispatch(get_payment_requests());
  }, []);

  const confirm_request = (id) => {
    setPaymentId(id);
    dispatch(confirm_payment_request(id));
  };

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

  const Row = ({ index, style }) => {
    return (
      <div style={style} className="flex text-sm text-white font-medium">
        <div className="w-[25%] p-2 whitespace-nowrap">{index + 1}</div>
        <div className="w-[25%] p-2 whitespace-nowrap">
          ₴{pendingWithdrawals[index]?.amount}
        </div>
        <div className="w-[25%] p-2 whitespace-nowrap">
          <span className="py-[1px] px-[5px] bg-slate-300 text-blue-500 rounded-md text-sm">
            {pendingWithdrawals[index]?.status}
          </span>
        </div>
        <div className="w-[25%] p-2 whitespace-nowrap">
          {moment(pendingWithdrawals[index]?.createdAt).format("LL")}
        </div>
        <div className="w-[25%] p-2 whitespace-nowrap">
          <button
            disabled={loader}
            onClick={() => confirm_request(pendingWithdrawals[index]?._id)}
            className="bg-indigo-500 shadow-lg hover:shadow-indigo-500/50 px-3 py-[2px] cursor-pointer text-white rounded-sm text-sm"
          >
            {loader && paymentId === pendingWithdrawals[index]?._id
              ? "Завантаження..."
              : "Підтвердити"}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="px-2 lg:px-7 pt-5">
      <div className="w-full p-4 bg-[#6a5fdf] rounded-md">
        <h2 className="text-xl font-medium pb-5 text-[#d0d2d6]">
          Запит на списання
        </h2>
        <div className="w-full">
          <div className="size-full overflow-x-auto">
            <div className="flex bg-[#a7a3de] uppercase text-xs font-bold min-w-[340px] rounded-md">
              <div className="w-[25%] p-2">№</div>
              <div className="w-[25%] p-2">Сума</div>
              <div className="w-[25%] p-2">Статус</div>
              <div className="w-[25%] p-2">Дата</div>
              <div className="w-[25%] p-2">Дія</div>
            </div>
            {
              <List
                style={{ minWidth: "340px" }}
                className="List"
                height={350}
                itemCount={pendingWithdrawals.length}
                itemSize={35}
                outerElementType={outerElementType}
              >
                {Row}
              </List>
            }
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentRequest;
