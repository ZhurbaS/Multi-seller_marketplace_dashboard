import { useEffect, useMemo, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { RiLogoutCircleLine } from "react-icons/ri";
import { MdClose } from "react-icons/md";
import { getNav } from "../navigation/index";
import { logout } from "../store/Reducers/authSlice";
import logo from "../assets/logoTS.png";
import { cx } from "../ui/cx";
import { findActive, groupNav } from "./navUtils";

/**
 * Бічна панель: ≥lg — фіксована; <lg — drawer (showSidebar/setShowSidebar).
 */
const Sidebar = ({ showSidebar, setShowSidebar }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { role } = useSelector((state) => state.auth);
  const { pathname } = useLocation();
  const panelRef = useRef(null);

  const nav = useMemo(() => getNav(role), [role]);
  const groups = useMemo(() => groupNav(nav), [nav]);
  const active = findActive(nav, pathname);

  // Закрити drawer при зміні маршруту
  useEffect(() => {
    setShowSidebar(false);
  }, [pathname, setShowSidebar]);

  // Esc + фокус у drawer на мобільних
  useEffect(() => {
    if (!showSidebar) return undefined;
    const onKey = (e) => e.key === "Escape" && setShowSidebar(false);
    document.addEventListener("keydown", onKey);
    panelRef.current?.querySelector("a,button")?.focus();
    return () => document.removeEventListener("keydown", onKey);
  }, [showSidebar, setShowSidebar]);

  return (
    <>
      <div
        aria-hidden="true"
        onClick={() => setShowSidebar(false)}
        className={cx(
          "fixed inset-0 z-40 bg-(--overlay) transition-opacity duration-200 lg:hidden",
          showSidebar ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      />

      <aside
        id="app-sidebar"
        ref={panelRef}
        aria-label="Головне меню"
        className={cx(
          "on-dark fixed inset-y-0 left-0 z-50 flex w-(--sidebar-w) max-w-[86vw] flex-col bg-(--sidebar-bg) text-(--on-sidebar) shadow-(--shadow-3) transition-transform duration-200 lg:translate-x-0 lg:shadow-none",
          showSidebar ? "translate-x-0" : "-translate-x-full max-lg:invisible",
        )}
      >
        <div className="flex h-(--topbar-h) shrink-0 items-center justify-between gap-2 px-4">
          <Link to="/" className="flex h-10 min-w-0 items-center rounded-(--r-sm)" aria-label="TechScout — на головну кабінету">
            <img className="h-9 w-auto max-w-[170px] object-contain" src={logo} alt="TechScout" />
          </Link>
          <button
            type="button"
            onClick={() => setShowSidebar(false)}
            aria-label="Закрити меню"
            className="inline-flex h-10 w-10 items-center justify-center rounded-(--r-md) text-xl hover:bg-(--sidebar-hover) lg:hidden"
          >
            <MdClose aria-hidden="true" />
          </button>
        </div>

        <nav className="min-h-0 flex-1 overflow-y-auto px-3 pb-3 scrollbar-thin" aria-label="Розділи кабінету">
          {groups.map(({ group, items }) => (
            <div key={group || "_"} className="mt-3 first:mt-1">
              {group && (
                <p className="px-3 pb-1 pt-2 text-[0.6875rem] font-semibold uppercase tracking-wider text-(--on-sidebar-2)">{group}</p>
              )}
              <ul className="flex flex-col gap-0.5">
                {items.map((n) => {
                  const isActive = active?.path === n.path;
                  return (
                    <li key={n.path}>
                      <Link
                        to={n.path}
                        aria-current={isActive ? "page" : undefined}
                        className={cx(
                          "flex min-h-10 items-center gap-3 rounded-(--r-md) px-3 py-2 text-sm font-medium transition-colors",
                          isActive
                            ? "bg-(--sidebar-active) text-(--on-sidebar-active) font-semibold"
                            : "text-(--on-sidebar) hover:bg-(--sidebar-hover)",
                        )}
                      >
                        <span aria-hidden="true" className="inline-flex shrink-0 text-lg">
                          {n.icon}
                        </span>
                        <span className="min-w-0 truncate">{n.title}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="shrink-0 border-t border-white/10 p-3 pb-[max(0.75rem,var(--sab))]">
          <button
            type="button"
            onClick={() => dispatch(logout({ navigate, role }))}
            className="flex min-h-10 w-full items-center gap-3 rounded-(--r-md) px-3 py-2 text-sm font-medium text-(--on-sidebar) hover:bg-(--sidebar-hover)"
          >
            <RiLogoutCircleLine aria-hidden="true" className="text-lg" />
            <span>Вийти</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
