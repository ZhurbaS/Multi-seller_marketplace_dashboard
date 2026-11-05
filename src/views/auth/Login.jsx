import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useDispatch, useSelector } from "react-redux";
import { MdMailOutline } from "react-icons/md";
import { messageClear, seller_login } from "../../store/Reducers/authSlice";
import { Button, Field, Input } from "../../ui";
import { AuthShell, PasswordInput } from "../../components/auth/AuthShell";
import { isEmail } from "../../components/auth/authUtils";

const Login = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { loader, errorMessage, successMessage } = useSelector((state) => state.auth);

  const [state, setState] = useState({ email: "", password: "" });
  const [submitted, setSubmitted] = useState(false);

  const inputHandle = (e) => setState({ ...state, [e.target.name]: e.target.value });

  const errors = {
    email: !state.email.trim() ? "Вкажіть e-mail" : !isEmail(state.email) ? "Невірний формат e-mail" : "",
    password: !state.password ? "Вкажіть пароль" : "",
  };

  const submit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    if (errors.email || errors.password) return;
    dispatch(seller_login(state));
  };

  useEffect(() => {
    if (successMessage) {
      toast.success(successMessage);
      dispatch(messageClear());
      navigate("/");
    }
    if (errorMessage) {
      toast.error(errorMessage);
      dispatch(messageClear());
    }
  }, [successMessage, errorMessage, dispatch, navigate]);

  return (
    <AuthShell
      title="Вхід для продавців"
      subtitle="Увійдіть до кабінету продавця TechScout."
      footer={
        <>
          Не маєте акаунта?{" "}
          <Link className="font-semibold text-(--brand-ink) hover:underline" to="/register">
            Зареєструватися
          </Link>
        </>
      }
    >
      <form onSubmit={submit} noValidate className="space-y-4">
        <Field label="E-mail" required error={submitted ? errors.email : ""}>
          <Input
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            autoFocus
            leftIcon={<MdMailOutline />}
            placeholder="name@example.com"
            value={state.email}
            onChange={inputHandle}
          />
        </Field>
        <Field label="Пароль" required error={submitted ? errors.password : ""}>
          <PasswordInput name="password" autoComplete="current-password" value={state.password} onChange={inputHandle} />
        </Field>
        <Button type="submit" size="lg" fullWidth loading={loader}>
          Увійти
        </Button>
      </form>
    </AuthShell>
  );
};

export default Login;
