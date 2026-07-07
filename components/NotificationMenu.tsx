"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { displayName, formatDate } from "@/lib/profiles";
import {
  getMentionNotifications,
  getUnreadMentionCount,
  markMentionAsRead,
} from "@/lib/notifications";
import type { CommentMentionNotification, Profile } from "@/lib/types";

interface NotificationMenuProps {
  profile: Profile;
}

function truncate(text: string, max = 80): string {
  const clean = text.trim().replace(/\s+/g, " ");
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max - 1)}…`;
}

export function NotificationMenu({ profile }: NotificationMenuProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<CommentMentionNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const [items, unread] = await Promise.all([
        getMentionNotifications(supabase, profile.id),
        getUnreadMentionCount(supabase, profile.id),
      ]);
      setNotifications(items);
      setUnreadCount(unread);
    } finally {
      setLoading(false);
    }
  }, [profile.id]);

  useEffect(() => {
    void loadNotifications();
  }, [loadNotifications]);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`mentions-${profile.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "comment_mentions",
          filter: `mentioned_user_id=eq.${profile.id}`,
        },
        () => {
          void loadNotifications();
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [loadNotifications, profile.id]);

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const items = useMemo(() => notifications.slice(0, 12), [notifications]);

  const handleOpenNotification = async (notification: CommentMentionNotification) => {
    const supabase = createClient();
    if (!notification.read_at) {
      try {
        await markMentionAsRead(supabase, notification.id, profile.id);
        setUnreadCount((count) => Math.max(count - 1, 0));
        setNotifications((prev) =>
          prev.map((item) =>
            item.id === notification.id
              ? { ...item, read_at: new Date().toISOString() }
              : item
          )
        );
      } catch {
        // Ignore and still navigate.
      }
    }

    const params = new URLSearchParams({
      card: notification.card_id,
      comment: notification.comment_id,
    });
    router.push(`/feeds/${notification.feed_id}?${params.toString()}#comment-${notification.comment_id}`);
  };

  return (
    <div className="notification-menu" ref={menuRef}>
      <button
        type="button"
        className={`notification-trigger${open ? " open" : ""}`}
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Notifications"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M15 17h5l-1.4-1.4a2 2 0 0 1-.6-1.4V11a6 6 0 1 0-12 0v3.2a2 2 0 0 1-.6 1.4L4 17h5"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M10 17a2 2 0 0 0 4 0"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
      </button>

      {open && (
        <div className="notification-dropdown" role="menu">
          <div className="notification-header">
            <strong>Mentions</strong>
          </div>
          {loading ? (
            <p className="notification-empty">Loading...</p>
          ) : items.length === 0 ? (
            <p className="notification-empty">No notifications yet.</p>
          ) : (
            <div className="notification-list">
              {items.map((notification) => (
                <button
                  key={notification.id}
                  type="button"
                  className={`notification-item${notification.read_at ? "" : " unread"}`}
                  onClick={() => void handleOpenNotification(notification)}
                >
                  <div className="notification-item-top">
                    <strong>{displayName(notification.actor)}</strong>
                    <span>{formatDate(notification.created_at)}</span>
                  </div>
                  <div className="notification-item-body">
                    mentioned you in <span>{notification.feed?.title ?? "a feed"}</span>
                  </div>
                  <div className="notification-item-snippet">
                    {truncate(notification.comment?.body ?? "")}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
