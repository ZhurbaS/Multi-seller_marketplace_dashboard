import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { MdMenu, MdChatBubbleOutline, MdExpandMore, MdLogout, MdPerson } from "react-icons/md";
import { getNav } from "../navigation/index";
import { logout } from "../store/Reducers/authSlice";
import { IconButton } from "../ui";
import { cx } from "../ui/cx";
import ThemeToggle from "./ThemeToggle";
import { findActive } from "./navUtils";

const ROLE_LABEL = { admin: "Адміністратор", seller: "Продавець" };

function Avatar({ src, name }) {
  const [broken, setBroken] = useState(false);
  const initials = (name || "?")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
  if (src && !broken) {
    return <img src={src} alt="" onError={() => setBroken(true)} className="h-9 w-9 shrink-0 rounded-full object-cover ring-1 ring-(--line)" />;
  }
  return (
    <span aria-hidden="true" className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-(--brand-soft) text-sm font-semibold text-(--brand-ink)">
      {initials || "?"}
    </span>
  );
}

function UserMenu({ userInfo, role }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) return undefined;
    const onDoc = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const name = userInfo?.name || "";
  const avatar = role === "admin" ? "/images/adminNEW.jpg" : userInfo?.image;
  const item = "flex min-h-10 w-full items-center gap-2 rounded-(--r-sm) px-3 py-2 text-left text-sm text-(--ink) hover:bg-(--surface-2)";

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="flex h-11 min-w-0 items-center gap-2 rounded-(--r-md) px-1.5 hover:bg-(--surface-2) sm:pr-2"
      >
        <Avatar src={avatar} name={name} />
        <span className="hidden min-w-0 flex-col text-left leading-tight md:flex">
          <span className="max-w-[160px] truncate text-sm font-semibold text-(--ink)">{name || "Користувач"}</span>
          <span className="text-xs text-(--ink-2)">{ROLE_LABEL[role] || role}</span>
        </span>
        <MdExpandMore aria-hidden="true" className="hidden text-lg text-(--ink-2) md:block" />
        <span className="sr-only">Меню користувача</span>
      </button>
      {open && (
        <div role="menu" className="absolute right-0 top-full z-50 mt-2 w-56 rounded-(--r-md) border border-(--line) bg-(--surface) p-1.5 shadow-(--shadow-3)">
          <div className="px-3 py-2 md:hidden">
            <p className="truncate text-sm font-semibold text-(--ink)">{name}</p>
            <p className="text-xs text-(--ink-2)">{ROLE_LABEL[role] || role}</p>
          </div>
          {role === "seller" && (
            <Link role="menuitem" to="/seller/dashboard/profile" className={item} onClick={() => setOpen(false)}>
              <MdPerson aria-hidden="true" className="text-lg text-(--ink-2)" /> Профіль
            </Link>
          )}
          <div className="px-3 py-2 sm:hidden">
            <p className="mb-1.5 text-xs text-(--ink-2)">Тема</p>
            <ThemeToggle withLabels />
          </div>
          <button role="menuitem" type="button" className={cx(item, "text-(--danger)")} onClick={() => dispatch(logout({ navigate, role }))}>
            <MdLogout aria-hidden="true" className="text-lg" /> Вийти
          </button>
        </div>
      )}
    </div>
  );
}

/** Шапка: бургер (<lg), назва розділу, перемикач теми, чат, меню користувача. */
const Header = ({ showSidebar, setShowSidebar }) => {
  const { userInfo, role } = useSelector((state) => state.auth);
  const { pathname } = useLocation();
  const nav = useMemo(() => getNav(role), [role]);
  const active = findActive(nav, pathname);
  const title = active?.title || "Кабінет";
  const chatPath = role === "admin" ? "/admin/dashboard/chat-sellers" : role === "seller" ? "/seller/dashboard/chat-customer" : null;

  useEffect(() => {
    document.title = `${title} · TechScout`;
  }, [title]);

  return (
    <header className="sticky top-0 z-30 border-b border-(--line) bg-(--surface)/90 pt-(--sat) backdrop-blur supports-[backdrop-filter]:bg-(--surface)/80">
      <div className="mx-auto flex h-(--topbar-h) w-full max-w-[1400px] items-center gap-2 px-3 sm:px-6 lg:px-8">
        <IconButton
          icon={<MdMenu />}
          label="Відкрити меню"
          aria-expanded={showSidebar}
          aria-controls="app-sidebar"
          onClick={() => setShowSidebar(!showSidebar)}
          className="lg:hidden"
        />
        <div className="min-w-0 flex-1">
          {active?.group && <p className="hidden truncate text-xs text-(--ink-2) sm:block">{active.group}</p>}
          <p className="truncate text-base font-semibold text-(--ink)">{title}</p>
        </div>
        <ThemeToggle className="max-sm:hidden" />
        {chatPath && <IconButton as={Link} to={chatPath} icon={<MdChatBubbleOutline />} label="Чат" />}
        <UserMenu userInfo={userInfo} role={role} />
      </div>
    </header>
  );
};

export default Header;
