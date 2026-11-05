import { useState } from "react";
import { MdVisibility, MdVisibilityOff } from "react-icons/md";
import logo from "../../assets/logoTS.png";
import { IconButton, Input } from "../../ui";
import ThemeToggle from "../../layout/ThemeToggle";

/** Центрована картка для сторінок входу/реєстрації. */
export function AuthShell({ title, subtitle, children, footer }) {
  return (
    <div className="flex min-h-dvh flex-col bg-(--page) text-(--ink)">
      <div className="flex justify-end p-3">
        <ThemeToggle />
      </div>
      <main className="flex flex-1 items-center justify-center px-4 pb-[max(2rem,var(--sab))]">
        <div className="w-full max-w-[420px]">
          <div className="mb-6 flex justify-center">
            <img src={logo} alt="TechScout" className="h-10 w-auto max-w-[200px] object-contain" />
          </div>
          <section className="rounded-(--r-lg) border border-(--line) bg-(--surface) p-6 shadow-(--shadow-2) sm:p-8">
            <h1 className="text-xl font-bold tracking-tight text-(--ink)">{title}</h1>
            {subtitle && <p className="mt-1 text-sm text-(--ink-2)">{subtitle}</p>}
            <div className="mt-6">{children}</div>
          </section>
          {footer && <div className="mt-5 text-center text-sm text-(--ink-2)">{footer}</div>}
        </div>
      </main>
    </div>
  );
}

/** Поле пароля з кнопкою «показати/сховати». Решта props — на <input>. */
export function PasswordInput(props) {
  const [show, setShow] = useState(false);
  return (
    <Input
      {...props}
      type={show ? "text" : "password"}
      rightSlot={
        <IconButton
          size="sm"
          icon={show ? <MdVisibilityOff /> : <MdVisibility />}
          label={show ? "Сховати пароль" : "Показати пароль"}
          onClick={() => setShow((v) => !v)}
        />
      }
    />
  );
}
