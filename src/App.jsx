import { useEffect, useState } from "react";
import Router from "./router/Router";
import publicRoutes from "./router/routes/publicRoutes";
import { getRoutes } from "./router/routes";
import { useDispatch, useSelector } from "react-redux";
import { get_user_info } from "./store/Reducers/authSlice";

function App() {
  const dispatch = useDispatch();
  const { token } = useSelector((state) => state.auth);

  const [allRoutes, setAllRoutes] = useState([...publicRoutes]);
  // console.log(allRoutes);

  // 🔐 Перевірка токена при першому завантаженні
  // useEffect(() => {
  //   const storedToken = localStorage.getItem("accessToken");

  //   // Якщо в localStorage токену немає, але в Redux він є — диспатч logout
  //   if (!storedToken && token) {
  //     dispatch(logout());
  //   }
  // }, [dispatch, token]);

  useEffect(() => {
    const routes = getRoutes();
    setAllRoutes([...allRoutes, ...routes]);
  }, []);

  useEffect(() => {
    if (token) {
      dispatch(get_user_info());
    }
  }, [token]);

  return <Router allRoutes={allRoutes} />;
}

export default App;
