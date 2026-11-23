"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import logo from "../img/logo_bps.png";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import ThemeToggler from "./ui/ThemeToggler";
import { isAuthenticatedMode } from "@/lib/access-mode";

const navItems = [
  { href: "/summary", label: "Dashboard Ringkasan" },
  { href: "/economics", label: "Dashboard Ekonomi" },
  { href: "/summary#demografi", label: "Sosial & demografi" },
];

const mobileNavItems = [...navItems, { href: "/downloads", label: "Download Data" }];

interface SessionUser {
  uid: string;
  name: string;
  email: string;
  role: "admin" | "user";
}

const Navbar = ({ currentPath = "/" }: { currentPath?: string }) => {
  const router = useRouter();
  const currentRoute = currentPath.split("#")[0];
  const [user, setUser] = useState<SessionUser | null>(null);
  const [isAllSessionDialogOpen, setIsAllSessionDialogOpen] = useState(false);
  const [isSigningOutEverywhere, setIsSigningOutEverywhere] = useState(false);

  useEffect(() => {
    let active = true;

    fetch("/api/auth/session", { cache: "no-store" })
      .then((response) => response.json())
      .then((result) => {
        if (active) setUser(result.user ?? null);
      })
      .catch(() => {
        if (active) setUser(null);
      });

    return () => {
      active = false;
    };
  }, [currentRoute]);

  const signOut = async () => {
    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });
      if (!response.ok) return;
      setUser(null);
      router.replace("/summary");
      router.refresh();
    } catch {
      // Keep the current UI state if the session could not be cleared.
    }
  };

  const signOutEverywhere = async () => {
    setIsSigningOutEverywhere(true);

    try {
      const response = await fetch("/api/auth/logout-all", { method: "POST" });
      const result = await response.json().catch(() => null);

      if (response.ok || result?.currentDeviceSignedOut) {
        setUser(null);
        setIsAllSessionDialogOpen(false);
        router.replace("/summary");
        router.refresh();
      }

      if (response.ok) {
        toast.success("Sesi DADAM di semua perangkat sudah dicabut.");
      } else {
        toast.error(result?.message ?? "Sesi di semua perangkat belum dapat dicabut.");
      }
    } catch {
      try {
        const response = await fetch("/api/auth/logout", { method: "POST" });
        if (response.ok) {
          setUser(null);
          setIsAllSessionDialogOpen(false);
          router.replace("/summary");
          router.refresh();
        }
      } catch {
        // The server could not be reached to confirm either logout action.
      }
      toast.error("Permintaan gagal. Status sesi di perangkat lain belum dapat dipastikan.");
    } finally {
      setIsSigningOutEverywhere(false);
    }
  };

  const initials = user?.name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "BM";

  return (
    <>
    <header className="sticky top-0 z-40 border-b border-white/15 bg-sky-700 text-white shadow-sm dark:bg-slate-900">
      <div className="mx-auto flex min-h-16 w-full max-w-[1600px] items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          aria-label="DADAM, beranda"
          className="flex min-w-0 items-center gap-3 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          <Image src={logo} alt="BPS Kabupaten Merangin" width={40} height={40} sizes="40px" />
          <span className="min-w-0">
            <span className="block truncate text-sm font-bold tracking-wide sm:text-base">DADAM</span>
            <span className="hidden truncate text-xs text-sky-100 sm:block">
              Dashboard Analisis Data Aktual Merangin
            </span>
          </span>
        </Link>

        <nav aria-label="Navigasi utama" className="hidden items-center gap-1 md:flex">
          {navItems.map(({ href, label }) => {
            const route = href.split("#")[0];
            const isActive = currentRoute === route && !href.includes("#");

            return (
              <Link
                key={href}
                href={href}
                aria-current={isActive ? "page" : undefined}
                className={`rounded-md px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white ${
                  isActive ? "bg-white/15 text-white" : "text-sky-50 hover:bg-white/10 hover:text-white"
                }`}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          <ThemeToggler />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label="Buka menu akun"
                className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                <Avatar>
                  <AvatarFallback className="bg-white text-sm font-semibold text-sky-800">{initials}</AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>
                {user ? (
                  <span className="grid gap-0.5">
                    <span>{user.name}</span>
                    <span className="text-xs font-normal text-muted-foreground">
                      {user.role === "admin" ? "Admin" : "Pengguna"}
                    </span>
                  </span>
                ) : "Menu akun"}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {user ? (
                <>
                  <DropdownMenuItem asChild>
                    <Link href="/summary">Buka dashboard</Link>
                  </DropdownMenuItem>
                  {user.role === "admin" && (
                    <>
                      <DropdownMenuItem asChild>
                        <Link href="/admin/data">Unggah / perbarui data</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/admin/users">Pengelolaan pengguna</Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={() => void signOut()}>Keluar</DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onSelect={() => setIsAllSessionDialogOpen(true)}
                  >
                    Keluar dari semua perangkat
                  </DropdownMenuItem>
                </>
              ) : (
                <DropdownMenuItem asChild>
                  <Link href="/auth">{isAuthenticatedMode() ? "Masuk / Daftar" : "Masuk admin"}</Link>
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <nav aria-label="Navigasi utama" className="grid grid-cols-4 border-t border-white/10 px-2 py-1 md:hidden">
        {mobileNavItems.map(({ href, label }) => {
          const isActive = currentRoute === href.split("#")[0] && !href.includes("#");

          return (
            <Link
              key={href}
              href={href}
              aria-current={isActive ? "page" : undefined}
              className={`min-w-0 rounded-md px-1.5 py-2 text-center text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:px-2 ${
                isActive ? "bg-white/15 text-white" : "text-sky-50 hover:bg-white/10 hover:text-white"
              }`}
            >
              {label}
            </Link>
          );
        })}
      </nav>
    </header>
    <Dialog open={isAllSessionDialogOpen} onOpenChange={setIsAllSessionDialogOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Keluar dari semua perangkat?</DialogTitle>
          <DialogDescription>
            Sesi DADAM akan dicabut di semua perangkat. Anda perlu masuk kembali untuk menggunakan dashboard.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={isSigningOutEverywhere}
            onClick={() => setIsAllSessionDialogOpen(false)}
          >
            Batal
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={isSigningOutEverywhere}
            onClick={() => void signOutEverywhere()}
          >
            {isSigningOutEverywhere ? "Mencabut sesi…" : "Keluar dari semua perangkat"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
};

export default Navbar;
