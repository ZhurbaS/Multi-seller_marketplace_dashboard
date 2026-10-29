import { AiOutlineDashboard, AiOutlineShoppingCart } from "react-icons/ai";
import { BiCategory } from "react-icons/bi";
import { FaUsers, FaUserTimes } from "react-icons/fa";
import { MdPayment } from "react-icons/md";
import { FaCodePullRequest } from "react-icons/fa6";
import { IoIosChatbubbles } from "react-icons/io";
import { MdAddShoppingCart } from "react-icons/md";
import { RiLuggageCartFill } from "react-icons/ri";
import { TbShoppingCartDiscount } from "react-icons/tb";
import { BsCartCheck } from "react-icons/bs";
import { MdOutlinePayments } from "react-icons/md";
import { IoMdChatboxes } from "react-icons/io";
import { RiChatSettingsFill } from "react-icons/ri";
import { CgProfile } from "react-icons/cg";
import { MdRateReview } from "react-icons/md";
import { MdAssignmentReturn } from "react-icons/md";
import { RiCouponLine } from "react-icons/ri";

export const allNav = [
  {
    id: 1,
    title: "Панель керування",
    icon: <AiOutlineDashboard />,
    role: "admin",
    path: "/admin/dashboard",
  },
  {
    id: 2,
    title: "Замовлення",
    icon: <AiOutlineShoppingCart />,
    role: "admin",
    path: "/admin/dashboard/orders",
  },
  {
    id: 3,
    title: "Категорія",
    icon: <BiCategory />,
    role: "admin",
    path: "/admin/dashboard/category",
  },
  {
    id: 4,
    title: "Продавці",
    icon: <FaUsers />,
    role: "admin",
    path: "/admin/dashboard/sellers",
  },
  {
    id: 5,
    title: "Запит на оплату",
    icon: <MdPayment />,
    role: "admin",
    path: "/admin/dashboard/payment-request",
  },
  {
    id: 6,
    title: "Неактивні продавці",
    icon: <FaUserTimes />,
    role: "admin",
    path: "/admin/dashboard/deactive-sellers",
  },
  {
    id: 7,
    title: "Запит продавця",
    icon: <FaCodePullRequest />,
    role: "admin",
    path: "/admin/dashboard/sellers-request",
  },
  {
    id: 8,
    title: "Онлайн-чат",
    icon: <IoIosChatbubbles />,
    role: "admin",
    path: "/admin/dashboard/chat-sellers",
  },
  {
    id: 18,
    title: "Відгуки",
    icon: <MdRateReview />,
    role: "admin",
    path: "/admin/dashboard/reviews",
  },
  {
    id: 22,
    title: "Реквізити для рахунків",
    icon: <MdPayment />,
    role: "admin",
    path: "/admin/dashboard/company",
  },
  {
    id: 19,
    title: "Знижки магазину",
    icon: <TbShoppingCartDiscount />,
    role: "admin",
    path: "/admin/dashboard/discounts",
  },
  {
    id: 20,
    title: "Комісії і виплати",
    icon: <MdPayment />,
    role: "admin",
    path: "/admin/dashboard/commission",
  },
  {
    id: 18,
    title: "Купони",
    icon: <RiCouponLine />,
    role: "admin",
    path: "/admin/dashboard/coupons",
  },
  {
    id: 19,
    title: "Повернення",
    icon: <MdAssignmentReturn />,
    role: "admin",
    path: "/admin/dashboard/returns",
  },
  {
    id: 20,
    title: "Умови повернення",
    icon: <MdAssignmentReturn />,
    role: "admin",
    path: "/admin/dashboard/returns-settings",
  },
  {
    id: 9,
    title: "Панель керування",
    icon: <AiOutlineDashboard />,
    role: "seller",
    path: "/seller/dashboard",
  },
  {
    id: 10,
    title: "Додати товар",
    icon: <MdAddShoppingCart />,
    role: "seller",
    path: "/seller/dashboard/add-product",
  },
  {
    id: 11,
    title: "Усі товари",
    icon: <RiLuggageCartFill />,
    role: "seller",
    path: "/seller/dashboard/products",
  },
  {
    id: 12,
    title: "Товари з знижкою",
    icon: <TbShoppingCartDiscount />,
    role: "seller",
    path: "/seller/dashboard/discount-product",
  },
  {
    id: 13,
    title: "Замовлення",
    icon: <BsCartCheck />,
    role: "seller",
    path: "/seller/dashboard/orders",
  },
  {
    id: 14,
    title: "Платежі",
    icon: <MdOutlinePayments />,
    role: "seller",
    path: "/seller/dashboard/payments",
  },
  {
    id: 21,
    title: "Повернення",
    icon: <MdAssignmentReturn />,
    role: "seller",
    path: "/seller/dashboard/returns",
  },
  {
    id: 15,
    title: "Чат з клієнтом",
    icon: <IoMdChatboxes />,
    role: "seller",
    path: "/seller/dashboard/chat-customer",
  },
  {
    id: 16,
    title: "Чат з підтримкою",
    icon: <RiChatSettingsFill />,
    role: "seller",
    path: "/seller/dashboard/chat-support",
  },
  {
    id: 17,
    title: "Профіль",
    icon: <CgProfile />,
    role: "seller",
    path: "/seller/dashboard/profile",
  },
];
