"use client";

import Link from "next/link";
import {
  ChevronDown,
  Home,
  Info,
  LayoutDashboard,
  Mail,
  Truck,
  User,
  UserPlus,
} from "lucide-react";
import { useState } from "react";
import Logo from "./Logo";

type NavbarProps = {
  onLoginClick: () => void;
  onRegisterClick: () => void;
};

const navLinks = [
  { href: "#home", label: "Home", icon: Home, active: true },
  { href: "#about", label: "About Us", icon: Info },
  { href: "#services", label: "Services", icon: Truck },
  { href: "#contact", label: "Contact Us", icon: Mail },
];

export default function Navbar({ onLoginClick, onRegisterClick }: NavbarProps) {
  const [loginOpen, setLoginOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-gray-100 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="shrink-0">
          <Logo />
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {navLinks.map(({ href, label, icon: Icon, active }) => (
            <Link
              key={label}
              href={href}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                active
                  ? "border-b-2 border-eco-primary text-eco-primary"
                  : "text-gray-600 hover:text-eco-primary"
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <div className="relative">
            <button
              type="button"
              onClick={() => setLoginOpen((open) => !open)}
              className="flex items-center gap-2 rounded-lg bg-eco-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-eco-dark"
            >
              <User className="h-4 w-4" />
              Login
              <ChevronDown className="h-4 w-4" />
            </button>
            {loginOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setLoginOpen(false)}
                  aria-hidden
                />
                <div className="absolute right-0 z-20 mt-2 w-48 overflow-hidden rounded-lg border border-gray-100 bg-white py-1 shadow-lg">
                  <button
                    type="button"
                    onClick={() => {
                      setLoginOpen(false);
                      onLoginClick();
                    }}
                    className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-eco-light"
                  >
                    <User className="h-4 w-4 text-eco-primary" />
                    Administrator Login
                  </button>
                </div>
              </>
            )}
          </div>
          <button
            type="button"
            onClick={onRegisterClick}
            className="hidden items-center gap-2 rounded-lg border-2 border-eco-primary px-4 py-2 text-sm font-medium text-eco-primary transition hover:bg-eco-light sm:flex"
          >
            <UserPlus className="h-4 w-4" />
            Register
          </button>
        </div>
      </div>
    </header>
  );
}
