import React, { lazy } from "react";

const SellerDashboard = lazy(() =>
  import("../../views/seller/SellerDashboard")
);
const AddProduct = lazy(() => import("../../views/seller/AddProduct"));
const Products = lazy(() => import("../../views/seller/Products"));
const DiscountProducts = lazy(() =>
  import("../../views/seller/DiscountProducts")
);
const Orders = lazy(() => import("../../views/seller/Orders"));
const Payments = lazy(() => import("../../views/seller/Payments"));
const SellerToCustomer = lazy(() =>
  import("../../views/seller/SellerToCustomer")
);
const SellerToAdmin = lazy(() => import("../../views/seller/SellerToAdmin"));
const Profile = lazy(() => import("../../views/seller/Profile"));
const EditProduct = lazy(() => import("../../views/seller/EditProduct"));
const OrderDetails = lazy(() => import("../../views/seller/OrderDetails"));
const Pending = lazy(() => import("./../../views/Pending"));
const Deactive = lazy(() => import("./../../views/Deactive"));
const AddBanner = lazy(() => import("../../views/seller/AddBanner"));
const SellerReturns = lazy(() => import("../../views/seller/Returns"));

// Аналітика продавця (DASHBOARD_SPEC.md §5)
const AnalyticsSales = lazy(() => import("../../views/seller/analytics/Sales"));
const AnalyticsProducts = lazy(() => import("../../views/seller/analytics/Products"));
const AnalyticsInventory = lazy(() => import("../../views/seller/analytics/Inventory"));
const AnalyticsFulfillment = lazy(() => import("../../views/seller/analytics/Fulfillment"));
const AnalyticsReviews = lazy(() => import("../../views/seller/analytics/Reviews"));
const AnalyticsCustomers = lazy(() => import("../../views/seller/analytics/Customers"));
const AnalyticsFunnel = lazy(() => import("../../views/seller/analytics/Funnel"));
const AnalyticsMarketing = lazy(() => import("../../views/seller/analytics/Marketing"));
const AnalyticsQuality = lazy(() => import("../../views/seller/analytics/Quality"));

export const sellerRoutes = [
  {
    path: "/seller/account-pending",
    element: <Pending />,
    ability: "seller",
  },
  {
    path: "/seller/account-deactive",
    element: <Deactive />,
    ability: "seller",
  },
  {
    path: "/seller/dashboard",
    element: <SellerDashboard />,
    role: "seller",
    status: "active",
  },
  {
    path: "/seller/dashboard/add-product",
    element: <AddProduct />,
    role: "seller",
    status: "active",
  },
  {
    path: "/seller/dashboard/edit-product/:productId",
    element: <EditProduct />,
    role: "seller",
    status: "active",
  },
  {
    path: "/seller/dashboard/products",
    element: <Products />,
    role: "seller",
    status: "active",
  },
  {
    path: "/seller/dashboard/discount-product",
    element: <DiscountProducts />,
    role: "seller",
    status: "active",
  },
  {
    path: "/seller/dashboard/orders",
    element: <Orders />,
    role: "seller",
    visibility: ["active", "deactive"],
  },
  {
    path: "/seller/dashboard/orders/details/:orderId",
    element: <OrderDetails />,
    role: "seller",
    visibility: ["active", "deactive"],
  },
  {
    path: "/seller/dashboard/payments",
    element: <Payments />,
    role: "seller",
    status: "active",
  },
  {
    path: "/seller/dashboard/chat-support",
    element: <SellerToAdmin />,
    role: "seller",
    visibility: ["active", "deactive", "pending"],
  },
  {
    path: "/seller/dashboard/chat-customer/:customerId",
    element: <SellerToCustomer />,
    role: "seller",
    status: "active",
  },
  {
    path: "/seller/dashboard/chat-customer",
    element: <SellerToCustomer />,
    role: "seller",
    status: "active",
  },
  {
    path: "/seller/dashboard/profile",
    element: <Profile />,
    role: "seller",
    visibility: ["active", "deactive", "pending"],
  },
  {
    path: "/seller/dashboard/add-banner/:productId",
    element: <AddBanner />,
    role: "seller",
    visibility: ["active"],
  },
  {
    path: "/seller/dashboard/returns",
    element: <SellerReturns />,
    role: "seller",
    visibility: ["active"],
  },
  {
    path: "/seller/analytics/sales",
    element: <AnalyticsSales />,
    role: "seller",
    status: "active",
  },
  {
    path: "/seller/analytics/products",
    element: <AnalyticsProducts />,
    role: "seller",
    status: "active",
  },
  {
    path: "/seller/analytics/inventory",
    element: <AnalyticsInventory />,
    role: "seller",
    status: "active",
  },
  {
    path: "/seller/analytics/fulfillment",
    element: <AnalyticsFulfillment />,
    role: "seller",
    status: "active",
  },
  {
    path: "/seller/analytics/reviews",
    element: <AnalyticsReviews />,
    role: "seller",
    status: "active",
  },
  {
    path: "/seller/analytics/customers",
    element: <AnalyticsCustomers />,
    role: "seller",
    status: "active",
  },
  {
    path: "/seller/analytics/funnel",
    element: <AnalyticsFunnel />,
    role: "seller",
    status: "active",
  },
  {
    path: "/seller/analytics/marketing",
    element: <AnalyticsMarketing />,
    role: "seller",
    status: "active",
  },
  {
    path: "/seller/analytics/quality",
    element: <AnalyticsQuality />,
    role: "seller",
    status: "active",
  },
];
