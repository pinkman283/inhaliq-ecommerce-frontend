"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { 
  Bell, 
  CheckCheck, 
  Magnet, 
  ShoppingBag, 
  Boxes, 
  ShieldAlert, 
  Info, 
  Volume2, 
  VolumeX, 
  Trash2, 
  Check, 
  ExternalLink,
  ChevronRight,
  Sparkles
} from "lucide-react";
import { adminApi } from "@/lib/adminApi";
import { AdminNotification } from "@/types";

function formatRelativeTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffSeconds < 45) return "Just now";
    if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}m ago`;
    if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)}h ago`;
    if (diffSeconds < 604800) return `${Math.floor(diffSeconds / 86400)}d ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch {
    return "";
  }
}

// Gentle Web Audio API synthesizer for incoming alerts (zero asset dependency)
function playNotificationChime() {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    const now = ctx.currentTime;
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = "sine";
    osc1.frequency.setValueAtTime(587.33, now); // D5
    osc1.frequency.exponentialRampToValueAtTime(880, now + 0.12); // A5

    osc2.type = "triangle";
    osc2.frequency.setValueAtTime(880, now + 0.12); // A5

    gain.gain.setValueAtTime(0.04, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now + 0.1);
    osc1.stop(now + 0.35);
    osc2.stop(now + 0.35);
  } catch {
    // Audio autoplay restricted or unavailable
  }
}

export function AdminNotificationBell() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [loading, setLoading] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const prevCountRef = useRef<number>(0);
  const isInitialMount = useRef(true);

  // Initialize sound preference from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("aether_admin_notification_sound");
    if (stored !== null) {
      setSoundEnabled(stored === "true");
    }
  }, []);

  const toggleSound = () => {
    const nextVal = !soundEnabled;
    setSoundEnabled(nextVal);
    localStorage.setItem("aether_admin_notification_sound", String(nextVal));
    if (nextVal) {
      playNotificationChime();
    }
  };

  // Fetch unread count & check for audio chime
  const checkUnreadCount = useCallback(async () => {
    try {
      const res = await adminApi.getNotificationUnreadCount();
      const newCount = res.unread_count ?? 0;

      if (!isInitialMount.current && newCount > prevCountRef.current && soundEnabled) {
        playNotificationChime();
      }

      isInitialMount.current = false;
      prevCountRef.current = newCount;
      setUnreadCount(newCount);
    } catch {
      // Ignore background polling errors
    }
  }, [soundEnabled]);

  // Load detailed notification list
  const loadNotifications = useCallback(async (cat: string) => {
    setLoading(true);
    try {
      const res = await adminApi.getNotifications({
        category: cat === "all" ? undefined : cat,
        per_page: 25,
      });
      setNotifications(res.data || []);
      setUnreadCount(res.unread_count ?? 0);
      prevCountRef.current = res.unread_count ?? 0;
    } catch {
      // Fail gracefully
    } finally {
      setLoading(false);
    }
  }, []);

  // Polling loop (every 25 seconds when page is visible)
  useEffect(() => {
    checkUnreadCount();

    const interval = setInterval(() => {
      if (document.visibilityState === "visible") {
        checkUnreadCount();
      }
    }, 25000);

    return () => clearInterval(interval);
  }, [checkUnreadCount]);

  // When popover opens or filter changes, load list
  useEffect(() => {
    if (isOpen) {
      loadNotifications(selectedCategory);
    }
  }, [isOpen, selectedCategory, loadNotifications]);

  // Outside click & ESC listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const handleNotificationClick = async (notif: AdminNotification) => {
    if (!notif.read_at) {
      // Optimistic update
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, read_at: new Date().toISOString() } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
      try {
        await adminApi.markNotificationRead(notif.id);
      } catch {
        // Fallback handled on next poll
      }
    }

    setIsOpen(false);
    if (notif.action_url) {
      router.push(notif.action_url);
    }
  };

  const handleMarkAllRead = async () => {
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, read_at: new Date().toISOString() }))
    );
    setUnreadCount(0);
    prevCountRef.current = 0;
    try {
      await adminApi.markAllNotificationsRead();
    } catch {
      // Fallback
    }
  };

  const handleDeleteNotification = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    const target = notifications.find((n) => n.id === id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    if (target && !target.read_at) {
      setUnreadCount((c) => Math.max(0, c - 1));
    }
    try {
      await adminApi.deleteNotification(id);
    } catch {
      // Ignore
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "leads":
        return {
          icon: Magnet,
          bg: "bg-sky-500/10 text-sky-400 border-sky-500/20",
        };
      case "orders":
        return {
          icon: ShoppingBag,
          bg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
        };
      case "inventory":
        return {
          icon: Boxes,
          bg: "bg-amber-500/10 text-amber-400 border-amber-500/20",
        };
      case "security":
        return {
          icon: ShieldAlert,
          bg: "bg-rose-500/10 text-rose-400 border-rose-500/20",
        };
      default:
        return {
          icon: Info,
          bg: "bg-purple-500/10 text-purple-400 border-purple-500/20",
        };
    }
  };

  const filterTabs = [
    { id: "all", label: "All" },
    { id: "leads", label: "Leads" },
    { id: "orders", label: "Orders" },
    { id: "inventory", label: "Inventory" },
  ];

  return (
    <div ref={dropdownRef} className="relative inline-block">
      {/* Bell Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Open notifications"
        aria-expanded={isOpen}
        className={`relative flex items-center justify-center p-2 rounded-md border transition-all cursor-pointer focus:outline-none select-none ${
          isOpen
            ? "bg-[#171B26] border-[#A78BFA]/50 text-white shadow-xs"
            : "bg-[#171B26] hover:bg-[#171B26]/80 border-[#272B35] text-[#929BAD] hover:text-[#E5E7EB]"
        }`}
        title="Admin Notifications"
      >
        <Bell className="w-4 h-4" />

        {/* Unread Counter Pill Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[17px] h-[17px] px-1 flex items-center justify-center text-[9.5px] font-bold text-white bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full ring-2 ring-[#090B10] shadow-sm animate-in zoom-in-75 duration-150">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div
          role="dialog"
          aria-label="Notifications popover"
          className="absolute right-0 mt-2 w-80 sm:w-96 origin-top-right rounded-lg bg-[#11141D]/98 backdrop-blur-xl border border-[#272B35] shadow-2xl ring-1 ring-black/50 z-50 animate-in fade-in zoom-in-95 duration-100 flex flex-col overflow-hidden max-h-[82vh]"
        >
          {/* Header Bar */}
          <div className="px-4 py-3 border-b border-[#272B35] bg-[#090B10]/50 flex items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white tracking-wide">
                Operational Alerts
              </span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-[#211B32] text-[#A78BFA] border border-[#A78BFA]/30 rounded-md">
                  {unreadCount} unread
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              {/* Sound Toggle */}
              <button
                type="button"
                onClick={toggleSound}
                className="p-1 rounded text-[#929BAD] hover:text-[#E5E7EB] hover:bg-[#171B26] transition-colors cursor-pointer"
                title={soundEnabled ? "Mute alert chime" : "Enable alert chime"}
              >
                {soundEnabled ? (
                  <Volume2 className="w-3.5 h-3.5 text-purple-400" />
                ) : (
                  <VolumeX className="w-3.5 h-3.5 text-[#626B7B]" />
                )}
              </button>

              {/* Mark All Read */}
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  className="flex items-center gap-1 px-2 py-1 text-[10.5px] font-semibold text-[#929BAD] hover:text-[#A78BFA] hover:bg-[#171B26] rounded transition-colors cursor-pointer"
                  title="Mark all as read"
                >
                  <CheckCheck className="w-3 h-3 text-[#A78BFA]" />
                  <span>Mark read</span>
                </button>
              )}
            </div>
          </div>

          {/* Filter Chips Bar */}
          <div className="px-3 py-2 border-b border-[#272B35]/60 bg-[#11141D] flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
            {filterTabs.map((tab) => {
              const isSelected = selectedCategory === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSelectedCategory(tab.id)}
                  className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-all cursor-pointer whitespace-nowrap ${
                    isSelected
                      ? "bg-[#211B32] text-[#A78BFA] border border-[#A78BFA]/30 shadow-xs"
                      : "text-[#929BAD] hover:text-[#E5E7EB] hover:bg-[#171B26] border border-transparent"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Notification List Body */}
          <div className="flex-1 overflow-y-auto divide-y divide-[#272B35]/40 min-h-[160px] max-h-[380px]">
            {loading && notifications.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <div className="w-5 h-5 border-2 border-[#A78BFA] border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs text-[#929BAD]">Loading alerts...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center space-y-2 select-none">
                <div className="w-9 h-9 rounded-full bg-[#171B26] border border-[#272B35] flex items-center justify-center mx-auto text-[#626B7B]">
                  <Check className="w-4 h-4 text-emerald-400" />
                </div>
                <p className="text-xs font-semibold text-white">All caught up</p>
                <p className="text-[11px] text-[#929BAD]">
                  {selectedCategory === "all"
                    ? "No new operational notifications at this time."
                    : `No ${selectedCategory} alerts found.`}
                </p>
              </div>
            ) : (
              notifications.map((item) => {
                const isUnread = !item.read_at;
                const { icon: CatIcon, bg: iconBg } = getCategoryIcon(item.category);

                return (
                  <div
                    key={item.id}
                    onClick={() => handleNotificationClick(item)}
                    className={`group relative p-3 flex items-start gap-3 transition-colors cursor-pointer ${
                      isUnread
                        ? "bg-[#171B26]/40 hover:bg-[#171B26]/80"
                        : "hover:bg-[#171B26]/40 opacity-80 hover:opacity-100"
                    }`}
                  >
                    {/* Category Icon */}
                    <div
                      className={`w-7 h-7 rounded-md border flex items-center justify-center shrink-0 mt-0.5 ${iconBg}`}
                    >
                      <CatIcon className="w-3.5 h-3.5" />
                    </div>

                    {/* Content */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1.5">
                        <p
                          className={`text-xs truncate ${
                            isUnread ? "font-bold text-white" : "font-medium text-[#E5E7EB]"
                          }`}
                        >
                          {item.title}
                        </p>
                        <span className="text-[9.5px] text-[#626B7B] shrink-0 font-mono">
                          {formatRelativeTime(item.created_at)}
                        </span>
                      </div>

                      <p className="text-[11px] text-[#929BAD] line-clamp-2 mt-0.5 leading-relaxed">
                        {item.message}
                      </p>

                      {item.action_url && (
                        <div className="flex items-center gap-1 mt-1 text-[10px] text-[#A78BFA] group-hover:underline">
                          <span>View Details</span>
                          <ChevronRight className="w-2.5 h-2.5" />
                        </div>
                      )}
                    </div>

                    {/* Right Action / Unread Dot */}
                    <div className="flex flex-col items-end justify-between shrink-0 self-stretch">
                      {isUnread ? (
                        <span className="w-2 h-2 rounded-full bg-[#A78BFA] ring-2 ring-[#11141D] mt-1" />
                      ) : (
                        <span className="w-2 h-2" />
                      )}

                      <button
                        type="button"
                        onClick={(e) => handleDeleteNotification(e, item.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-[#626B7B] hover:text-rose-400 transition-all cursor-pointer rounded"
                        title="Dismiss notification"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Bar */}
          <div className="px-4 py-2 border-t border-[#272B35] bg-[#090B10]/40 flex items-center justify-between text-[10.5px] text-[#929BAD] shrink-0">
            <span>Automated operational alerts</span>
            {notifications.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  router.push("/admin/settings/notifications");
                }}
                className="hover:text-white transition-colors cursor-pointer flex items-center gap-1"
              >
                <span>Templates</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
