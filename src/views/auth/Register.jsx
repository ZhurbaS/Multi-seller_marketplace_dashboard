import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import { MdMailOutline, MdPersonOutline } from "react-icons/md";
import { seller_register, messageClear } from "../../store/Reducers/authSlice";
import { Button, Checkbox, Field, Input } from "../../ui";
import { AuthShell, PasswordInput } from "../../components/auth/AuthShell";
import { isEmail } from "../../components/auth/authUtils";

const Register = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { loader, successMessage, errorMessage } = useSelector((state) => state.auth);

  const [state, setState] = useState({ name: "", email: "", password: "" });
  const [agree, setAgree] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const inputHandle = (e) => setState({ ...state, [e.target.name]: e.target.value });

  const errors = {
    name: !state.name.trim() ? "Вкажіть ім'я" : "",
    email: !state.email.trim() ? "Вкажіть e-mail" : !isEmail(state.email) ? "Невірний формат e-mail" : "",
    password: !state.password ? "Вкажіть пароль" : state.password.length < 6 ? "Щонайменше 6 символів" : "",
    agree: !agree ? "Потрібна згода з умовами" : "",
  };
  const show = (k) => (submitted ? errors[k] : "");

  const submit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    if (Object.values(errors).some(Boolean)) return;
    dispatch(seller_register(state));
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
      title="Реєстрація продавця"
      subtitle="Створіть акаунт, щоб продавати на TechScout. Після реєстрації магазин пройде модерацію."
      footer={
        <>
          Вже маєте акаунт?{" "}
          <Link className="font-semibold text-(--brand-ink) hover:underline" to="/login">
            Увійти
          </Link>
        </>
      }
    >
      <form onSubmit={submit} noValidate className="space-y-4">
        <Field label="Ім'я" required error={show("name")}>
          <Input name="name" autoComplete="name" autoFocus leftIcon={<MdPersonOutline />} value={state.name} onChange={inputHandle} />
        </Field>
        <Field label="E-mail" required error={show("email")}>
          <Input
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            leftIcon={<MdMailOutline />}
            placeholder="name@example.com"
            value={state.email}
            onChange={inputHandle}
          />
        </Field>
        <Field label="Пароль" required hint="Щонайменше 6 символів" error={show("password")}>
          <PasswordInput name="password" autoComplete="new-password" value={state.password} onChange={inputHandle} />
        </Field>
        <div>
          <Checkbox
            label="Погоджуюся з умовами користувацької угоди"
            checked={agree}
            invalid={!!show("agree")}
            onChange={(e) => setAgree(e.target.checked)}
            aria-describedby={show("agree") ? "agree-err" : undefined}
          />
          {show("agree") && (
            <p id="agree-err" className="mt-1 text-xs text-(--danger)">
              {errors.agree}
            </p>
          )}
        </div>
        <Button type="submit" size="lg" fullWidth loading={loader}>
          Зареєструватися
        </Button>
      </form>
    </AuthShell>
  );
};

export default Register;
