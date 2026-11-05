import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { MdAdminPanelSettings, MdMailOutline } from "react-icons/md";
import { admin_login, messageClear } from "../../store/Reducers/authSlice";
import { Button, Field, Input } from "../../ui";
import { AuthShell, PasswordInput } from "../../components/auth/AuthShell";
import { isEmail } from "../../components/auth/authUtils";

const AdminLogin = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { loader, errorMessage, successMessage } = useSelector((state) => state.auth);

  const [state, setState] = useState({ email: "", password: "" });
  const [submitted, setSubmitted] = useState(false);

  const inputHandle = (e) => setState({ ...state, [e.target.name]: e.target.value });

  const errors = {
    email: !state.email.trim() ? "Вкажіть e-mail" : !isEmail(state.email) ? "Невірний формат e-mail" : "",
    password: !state.password.trim() ? "Вкажіть пароль" : "",
  };

  const submit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    if (errors.email || errors.password) return;
    dispatch(admin_login(state));
  };

  useEffect(() => {
    if (errorMessage) {
      toast.error(errorMessage);
      dispatch(messageClear());
    }
    if (successMessage) {
      toast.success(successMessage);
      dispatch(messageClear());
      navigate("/");
    }
  }, [errorMessage, successMessage, dispatch, navigate]);

  return (
    <AuthShell title="Вхід адміністратора" subtitle="Панель керування маркетплейсом TechScout.">
      <form onSubmit={submit} noValidate className="space-y-4">
        <Field label="E-mail" required error={submitted ? errors.email : ""}>
          <Input
            name="email"
            type="email"
            inputMode="email"
            autoComplete="username"
            autoFocus
            leftIcon={<MdMailOutline />}
            value={state.email}
            onChange={inputHandle}
          />
        </Field>
        <Field label="Пароль" required error={submitted ? errors.password : ""}>
          <PasswordInput name="password" autoComplete="current-password" value={state.password} onChange={inputHandle} />
        </Field>
        <Button type="submit" size="lg" fullWidth loading={loader} icon={<MdAdminPanelSettings />}>
          Увійти
        </Button>
      </form>
    </AuthShell>
  );
};

export default AdminLogin;
