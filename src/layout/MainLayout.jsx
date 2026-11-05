import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import Header from "./Header";
import Sidebar from "./Sidebar";
import { socket } from "../utils/utils";
import { updateCustomer, updateSellers } from "../store/Reducers/chatSlice";

const MainLayout = () => {
  const dispatch = useDispatch();
  const { userInfo } = useSelector((state) => state.auth);
  const [showSidebar, setShowSidebar] = useState(false);

  useEffect(() => {
    if (userInfo && userInfo.role === "seller") {
      socket.emit("add_seller", userInfo._id, userInfo);
    } else {
      socket.emit("add_admin", userInfo);
    }
  }, [userInfo]);

  useEffect(() => {
    const onCustomers = (customers) => dispatch(updateCustomer(customers));
    const onSellers = (sellers) => dispatch(updateSellers(sellers));
    socket.on("activeCustomer", onCustomers);
    socket.on("activeSeller", onSellers);
    return () => {
      socket.off("activeCustomer", onCustomers);
      socket.off("activeSeller", onSellers);
    };
  }, [dispatch]);

  return (
    <div className="min-h-dvh w-full bg-(--page) text-(--ink)">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[200] focus:rounded-(--r-md) focus:bg-(--surface) focus:px-4 focus:py-2 focus:text-(--ink) focus:shadow-(--shadow-3)"
      >
        Перейти до вмісту
      </a>
      <Sidebar showSidebar={showSidebar} setShowSidebar={setShowSidebar} />
      <div className="flex min-h-dvh min-w-0 flex-col lg:pl-(--sidebar-w)">
        <Header showSidebar={showSidebar} setShowSidebar={setShowSidebar} />
        <main id="main" tabIndex={-1} className="mx-auto w-full min-w-0 max-w-[1400px] flex-1 px-3 pt-4 pb-safe outline-none sm:px-6 sm:pt-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
