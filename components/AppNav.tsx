"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { displayName } from "@/lib/profiles";
import type { Profile } from "@/lib/types";
import { AppLogo } from "@/components/AppLogo";
import { InitialAvatar } from "@/components/InitialAvatar";
import { NotificationMenu } from "@/components/NotificationMenu";

interface AppNavProps {
  profile: Profile;
}

export function AppNav({ profile }: AppNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const isAdmin = profile.role === "admin";
  const name = displayName(profile);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  useEffect(() => {
    if (!menuOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [menuOpen]);

  const links = [
    { href: "/dashboard", label: "Dashboard" },
    ...(isAdmin ? [{ href: "/feeds/new", label: "Import Feed" }] : []),
  ];

  return (
    <nav className="app-nav">
      <div className="app-nav-inner">
        <AppLogo href="/dashboard" />

        <div className="app-nav-menu">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`app-nav-link${pathname === link.href ? " active" : ""}`}
            >
              {link.label}
            </Link>
          ))}

          <NotificationMenu profile={profile} />

          <div className="user-menu" ref={menuRef}>
            <button
              type="button"
              className={`user-menu-trigger${menuOpen ? " open" : ""}`}
              onClick={() => setMenuOpen((open) => !open)}
              aria-expanded={menuOpen}
              aria-haspopup="menu"
            >
              <InitialAvatar profile={profile} size={28} className="user-menu-avatar" />
              <span className="user-menu-email">{name}</span>
              <svg
                className="user-menu-chevron"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M6 9l6 6 6-6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>

            {menuOpen && (
              <div className="user-menu-dropdown" role="menu">
                <div className="user-menu-header">
                  <div className="user-menu-header-main">
                    <InitialAvatar profile={profile} size={36} />
                    <div className="user-menu-header-text">
                      <span className="user-menu-dropdown-name">{name}</span>
                      <span className="user-menu-dropdown-email">{profile.email}</span>
                    </div>
                  </div>
                  <span className="role-badge">{profile.role}</span>
                </div>

                <Link
                  href="/settings"
                  className={`user-menu-item${pathname === "/settings" ? " active" : ""}`}
                  role="menuitem"
                  onClick={() => setMenuOpen(false)}
                >
                  Settings
                </Link>

                {isAdmin && (
                  <Link
                    href="/teams"
                    className={`user-menu-item${pathname === "/teams" ? " active" : ""}`}
                    role="menuitem"
                    onClick={() => setMenuOpen(false)}
                  >
                    Teams
                  </Link>
                )}

                <button
                  type="button"
                  className="user-menu-signout"
                  role="menuitem"
                  onClick={handleSignOut}
                >
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
