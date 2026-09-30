"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Grid, Search, Package, ShoppingBag } from "lucide-react";
import { useCartStore } from "@/store/useCartStore";
import { useEffect, useState } from "react";

interface MobileBottomNavProps {
  onOpenSearch: () => void;
}

export function MobileBottomNav({ onOpenSearch }: MobileBottomNavProps) {
  const pathname = usePathname();
  const { openCart, getItemCount } = useCartStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const cartCount = getItemCount();

  // Don't show bottom nav on admin routes
  if (pathname.startsWith("/admin")) return null;

  return (
    <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#090b14]/95 backdrop-blur-lg border-t border-white/10 px-2 py-1.5 shadow-2xl safe-area-inset-bottom">
      <div className="grid grid-cols-5 items-center gap-1">
        {/* 1. Home */}
        <Link
          href="/"
          className={`flex flex-col items-center justify-center py-1 rounded-lg transition-colors ${
            pathname === "/" ? "text-[var(--theme-primary,#006B45)]" : "text-slate-400 hover:text-white"
          }`}
        >
          <Home className="w-4 h-4" />
          <span className="text-[9.5px] font-bold mt-0.5">Home</span>
        </Link>

        {/* 2. Shop / Categories */}
        <Link
          href="/products"
          className={`flex flex-col items-center justify-center py-1 rounded-lg transition-colors ${
            pathname.startsWith("/products")
              ? "text-[var(--theme-primary,#006B45)]"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <Grid className="w-4 h-4" />
          <span className="text-[9.5px] font-bold mt-0.5">Shop</span>
        </Link>

        {/* 3. Search Trigger */}
        <button
          onClick={onOpenSearch}
          className="flex flex-col items-center justify-center py-1 rounded-lg text-slate-400 hover:text-[var(--theme-primary,#006B45)] transition-colors cursor-pointer"
        >
          <Search className="w-4 h-4" />
          <span className="text-[9.5px] font-bold mt-0.5">Search</span>
        </button>

        {/* 4. Track Order */}
        <Link
          href="/track"
          className={`flex flex-col items-center justify-center py-1 rounded-lg transition-colors ${
            pathname === "/track" ? "text-[var(--theme-primary,#006B45)]" : "text-slate-400 hover:text-white"
          }`}
        >
          <Package className="w-4 h-4" />
          <span className="text-[9.5px] font-bold mt-0.5">Track</span>
        </Link>

        {/* 5. Cart Drawer Trigger */}
        <button
          onClick={openCart}
          className="relative flex flex-col items-center justify-center py-1 rounded-lg text-slate-400 hover:text-[var(--theme-primary,#006B45)] transition-colors cursor-pointer"
        >
          <div className="relative">
            <ShoppingBag className="w-4 h-4" />
            {mounted && cartCount > 0 && (
              <span
                className="absolute -top-1.5 -right-2 min-w-[15px] h-[15px] px-0.5 font-black text-[8px] rounded-full flex items-center justify-center shadow-md"
                style={{
                  backgroundColor: "var(--theme-primary, #006B45)",
                  color: "var(--theme-btn-primary-text, #ffffff)",
                }}
              >
                {cartCount}
              </span>
            )}
          </div>
          <span className="text-[9.5px] font-bold mt-0.5">Cart</span>
        </button>
      </div>
    </div>
  );
}
