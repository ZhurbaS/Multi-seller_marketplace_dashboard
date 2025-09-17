import authSlice from "./Reducers/authSlice";
import categorySlice from "./Reducers/categorySlice";
import chatSlice from "./Reducers/chatSlice";
import orderSlice from "./Reducers/orderSlice";
import productSlice from "./Reducers/productSlice";
import sellerSlice from "./Reducers/sellerSlice";

const rootReducer = {
  auth: authSlice,
  category: categorySlice,
  product: productSlice,
  seller: sellerSlice,
  chat: chatSlice,
  order: orderSlice,
};

export default rootReducer;
