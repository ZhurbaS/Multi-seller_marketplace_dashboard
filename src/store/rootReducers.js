import authSlice from "./Reducers/authSlice";
import categorySlice from "./Reducers/categorySlice";
import productSlice from "./Reducers/productSlice";
import sellerSlice from "./Reducers/sellerSlice";

const rootReducer = {
  auth: authSlice,
  category: categorySlice,
  product: productSlice,
  seller: sellerSlice,
};

export default rootReducer;
