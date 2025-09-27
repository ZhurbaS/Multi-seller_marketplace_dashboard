import authSlice from "./Reducers/authSlice";
import bannerSlice from "./Reducers/bannerSlice";
import categorySlice from "./Reducers/categorySlice";
import chatSlice from "./Reducers/chatSlice";
import dashboardSlice from "./Reducers/dashboardSlice";
import orderSlice from "./Reducers/orderSlice";
import PaymentSlice from "./Reducers/paymentSlice";
import productSlice from "./Reducers/productSlice";
import sellerSlice from "./Reducers/sellerSlice";

const rootReducer = {
  auth: authSlice,
  category: categorySlice,
  product: productSlice,
  seller: sellerSlice,
  chat: chatSlice,
  order: orderSlice,
  payment: PaymentSlice,
  dashboard: dashboardSlice,
  banner: bannerSlice,
};

export default rootReducer;
