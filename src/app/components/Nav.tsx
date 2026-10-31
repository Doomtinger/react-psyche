"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/shared/utils/cn";

const NAV_ITEMS = [
  { href: "/", label: "首页", icon: "⌂" },
  { href: "/atlas", label: "Mind Atlas", icon: "◍" },
  { href: "/timeline", label: "时间线", icon: "☰" },
  { href: "/review", label: "周期回顾", icon: "◷" },
  { href: "/settings", label: "设置", icon: "⚙" },
];

export function Nav() {
  const pathname = usePathname();

  return (
    <nav className="app-nav" aria-label="主导航">
      <div className="app-brand">
        <span className="app-brand-mark" aria-hidden="true">
          ◈
        </span>
        <span className="app-brand-name">Flow Space</span>
      </div>
      <ul className="nav-list">
        {NAV_ITEMS.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn("nav-link", active && "active")}
                aria-current={active ? "page" : undefined}
              >
                <span className="nav-icon" aria-hidden="true">
                  {item.icon}
                </span>
                <span className="nav-label">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
      <p className="nav-footer">本地优先 · 免注册 · 数据在你的浏览器中</p>
    </nav>
  );
}
