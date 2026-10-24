import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import { FaStar } from "react-icons/fa";
import Pagination from "../Pagination";
import {
  get_admin_reviews,
  review_status_update,
  messageClear,
} from "../../store/Reducers/reviewSlice";

const TABS = [
  { value: "pending", label: "Очікують" },
  { value: "approved", label: "Опубліковані" },
  { value: "rejected", label: "Відхилені" },
];

const PER_PAGE = 10;

const ReviewModeration = () => {
  const dispatch = useDispatch();
  const { reviews, totalReview, pendingCount, loader, successMessage, errorMessage } =
    useSelector((state) => state.review);

  const [status, setStatus] = useState("pending");
  const [currentPage, setCurrentPage] = useState(1);
  // Id відгуку, для якого зараз відкрито поле примітки при відхиленні
  const [rejectingId, setRejectingId] = useState(null);
  const [adminNote, setAdminNote] = useState("");

  useEffect(() => {
    dispatch(get_admin_reviews({ pageNo: currentPage, status }));
  }, [currentPage, status]);

  useEffect(() => {
    if (successMessage) {
      toast.success(successMessage);
      dispatch(messageClear());
      setRejectingId(null);
      setAdminNote("");
      dispatch(get_admin_reviews({ pageNo: currentPage, status }));
    }
    if (errorMessage) {
      toast.error(errorMessage);
      dispatch(messageClear());
    }
  }, [successMessage, errorMessage]);

  const changeTab = (value) => {
    setStatus(value);
    setCurrentPage(1);
    setRejectingId(null);
    setAdminNote("");
  };

  const approve = (reviewId) => {
    dispatch(review_status_update({ reviewId, status: "approved" }));
  };

  const reject = (reviewId) => {
    dispatch(
      review_status_update({ reviewId, status: "rejected", adminNote })
    );
  };

  const formatDate = (r) =>
    r.createdAt
      ? new Date(r.createdAt).toLocaleDateString("uk-UA", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })
      : r.date;

  return (
    <div className="px-2 lg:px-7 pt-5">
      <h1 className="text-[20px] font-bold mb-3">Модерація відгуків</h1>

      <div className="w-full p-4 bg-[#6a5fdf] rounded-md">
        <div className="flex flex-wrap gap-3 mb-4">
          {TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => changeTab(tab.value)}
              className={`px-4 py-2 rounded-md text-sm ${
                status === tab.value
                  ? "bg-indigo-300 text-white shadow-lg shadow-indigo-300/50"
                  : "bg-slate-600 text-[#d0d2d6] hover:bg-indigo-400 hover:text-white"
              }`}
            >
              {tab.label}
              {tab.value === "pending" && pendingCount > 0 && (
                <span className="ml-2 px-2 py-[1px] rounded-full bg-red-500 text-white text-xs">
                  {pendingCount}
                </span>
              )}
            </button>
          ))}
        </div>

        <p className="text-xs text-[#d0d2d6] mb-4">
          Відхиляйте лише відгуки, що порушують правила (образи, спам, чужі
          персональні дані, реклама). Не відхиляйте відгуки лише за те, що
          вони негативні: це порушує вимоги споживчого законодавства. Текст
          відгуку редагувати не можна.
        </p>

        {loader && reviews.length === 0 ? (
          <p className="text-[#d0d2d6] py-6">Завантаження...</p>
        ) : reviews.length === 0 ? (
          <p className="text-[#d0d2d6] py-6">Відгуків у цьому списку немає.</p>
        ) : (
          <div className="flex flex-col gap-4">
            {reviews.map((r) => (
              <div
                key={r._id}
                className="p-4 border border-slate-700 rounded-md text-[#d0d2d6]"
              >
                <div className="flex flex-wrap justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {r.productId?.images?.[0] && (
                      <img
                        className="w-[48px] h-[48px] object-cover rounded"
                        src={r.productId.images[0]}
                        alt=""
                      />
                    )}
                    <div>
                      <p className="font-semibold">
                        {r.productId?.name || "Товар видалено"}
                      </p>
                      <p className="text-xs">
                        {r.name} · {formatDate(r)}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1 text-lg text-yellow-300">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <span
                        key={n}
                        className={n <= r.rating ? "" : "text-slate-500"}
                      >
                        <FaStar />
                      </span>
                    ))}
                  </div>
                </div>

                <p className="text-sm mt-3 whitespace-pre-wrap break-words">
                  {r.review}
                </p>

                {r.adminNote && (
                  <p className="text-xs mt-2 italic">
                    Примітка модератора: {r.adminNote}
                  </p>
                )}

                <div className="flex flex-wrap gap-3 mt-4">
                  {status !== "approved" && (
                    <button
                      onClick={() => approve(r._id)}
                      className="bg-green-500 hover:shadow-lg hover:shadow-green-500/50 text-white rounded-md px-4 py-1 text-sm"
                    >
                      Опублікувати
                    </button>
                  )}
                  {status !== "rejected" && rejectingId !== r._id && (
                    <button
                      onClick={() => {
                        setRejectingId(r._id);
                        setAdminNote("");
                      }}
                      className="bg-red-500 hover:shadow-lg hover:shadow-red-500/50 text-white rounded-md px-4 py-1 text-sm"
                    >
                      Відхилити
                    </button>
                  )}
                </div>

                {rejectingId === r._id && (
                  <div className="mt-3 flex flex-col gap-2">
                    <textarea
                      value={adminNote}
                      onChange={(e) => setAdminNote(e.target.value)}
                      rows="2"
                      placeholder="Причина відхилення (необов'язково, бачите лише ви)"
                      className="px-3 py-2 focus:border-indigo-600 outline-none bg-[#6a5fdf] border border-slate-700 rounded-md text-[#d0d2d6] text-sm"
                    ></textarea>
                    <div className="flex gap-3">
                      <button
                        onClick={() => reject(r._id)}
                        className="bg-red-500 hover:shadow-lg hover:shadow-red-500/50 text-white rounded-md px-4 py-1 text-sm"
                      >
                        Підтвердити відхилення
                      </button>
                      <button
                        onClick={() => {
                          setRejectingId(null);
                          setAdminNote("");
                        }}
                        className="bg-slate-700 text-white rounded-md px-4 py-1 text-sm"
                      >
                        Скасувати
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {totalReview > PER_PAGE && (
          <div className="w-full flex justify-end mt-4">
            <Pagination
              pageNumber={currentPage}
              setPageNumber={setCurrentPage}
              totalItem={totalReview}
              perPage={PER_PAGE}
              showItem={3}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ReviewModeration;
