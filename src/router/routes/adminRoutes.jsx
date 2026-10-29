import React, { lazy } from "react";
const AdminDashboard = lazy(() => import("../../views/admin/AdminDashboard"));
const Orders = lazy(() => import("../../views/admin/Orders"));
const Category = lazy(() => import("../../views/admin/Category"));
const Sellers = lazy(() => import("../../views/admin/Sellers"));
const PaymentRequest = lazy(() => import("../../views/admin/PaymentRequest"));
const DeactiveSellers = lazy(() => import("../../views/admin/DeactiveSellers"));
const SellerRequest = lazy(() => import("../../views/admin/SellerRequest"));
const SellerDetails = lazy(() => import("../../views/admin/SellerDetails"));
const ChatSeller = lazy(() => import("../../views/admin/ChatSeller"));
const OrderDetails = lazy(() => import("../../views/admin/OrderDetails"));
const ReviewModeration = lazy(() => import("../../views/admin/ReviewModeration"));
const StoreDiscounts = lazy(() => import("../../views/admin/StoreDiscounts"));
const Commission = lazy(() => import("../../views/admin/Commission"));
const Company = lazy(() => import("../../views/admin/Company"));
const Coupons = lazy(() => import("../../views/admin/Coupons"));
const Returns = lazy(() => import("../../views/admin/Returns"));
const ReturnsSettings = lazy(() => import("../../views/admin/ReturnsSettings"));

export const adminRoutes = [
  {
    path: "admin/dashboard",
    element: <AdminDashboard />,
    role: "admin",
  },
  {
    path: "admin/dashboard/orders",
    element: <Orders />,
    role: "admin",
  },
  {
    path: "admin/dashboard/category",
    element: <Category />,
    role: "admin",
  },
  {
    path: "admin/dashboard/sellers",
    element: <Sellers />,
    role: "admin",
  },
  {
    path: "admin/dashboard/payment-request",
    element: <PaymentRequest />,
    role: "admin",
  },
  {
    path: "admin/dashboard/deactive-sellers",
    element: <DeactiveSellers />,
    role: "admin",
  },
  {
    path: "admin/dashboard/sellers-request",
    element: <SellerRequest />,
    role: "admin",
  },
  {
    path: "admin/dashboard/seller/details/:sellerId",
    element: <SellerDetails />,
    role: "admin",
  },
  {
    path: "admin/dashboard/chat-sellers",
    element: <ChatSeller />,
    role: "admin",
  },
  {
    path: "admin/dashboard/chat-sellers/:sellerId",
    element: <ChatSeller />,
    role: "admin",
  },
  {
    path: "admin/dashboard/order/details/:orderId",
    element: <OrderDetails />,
    role: "admin",
  },
  {
    path: "admin/dashboard/reviews",
    element: <ReviewModeration />,
    role: "admin",
  },
  {
    path: "admin/dashboard/discounts",
    element: <StoreDiscounts />,
    role: "admin",
  },
  {
    path: "admin/dashboard/commission",
    element: <Commission />,
    role: "admin",
  },
  {
    path: "admin/dashboard/coupons",
    element: <Coupons />,
    role: "admin",
  },
  {
    path: "admin/dashboard/returns",
    element: <Returns />,
    role: "admin",
  },
  {
    path: "admin/dashboard/returns-settings",
    element: <ReturnsSettings />,
    role: "admin",
  },
  {
    path: "admin/dashboard/company",
    element: <Company />,
    role: "admin",
  },
];
