"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { HDate, months } from "@hebcal/core";
import { ChevronLeft, ChevronRight, Plus, Bell, Settings, Clock } from "lucide-react";
import CalendarGrid from "@/components/calendar/CalendarGrid";
import EventForm, { type EventPayload } from "@/components/events/EventForm";
import Footer from "@/components/Footer";
import ZmanimSheet from "@/components/ZmanimSheet";
import {
  formatHebrewDate,
  formatGregorianDate,
  getTodayHebrew,
  GREGORIAN_MONTH_NAMES,
  HEBREW_MONTH_NAMES,
} from "@/lib/hebrew-calendar";
import {
  getHolidaysForMonth,
  DEFAULT_HOLIDAY_SETTINGS,
  type HolidaySettings,
} from "@/lib/holidays";

type UserProfile = {
  id: string;
  timezone: string;
  primaryCalendar: "HEBREW" | "GREGORIAN";
  latitude?: number | null;
  longitude?: number | null;
  holidaySettings?: HolidaySettings | null;
};

type Event = {
  id: string;
  title: string;
  type: string;
  canonicalCalendar: "HEBREW" | "GREGORIAN";
  hebrewDay?: number | null;
  hebrewMonth?: number | null;
  gregorianMonth?: number | null;
  gregorianDay?: number | null;
};

type Notification = {
  id: string;
  message: string;
  eventDate: string;
  event: Event;
  read: boolean;
};

const GUEST_USER: UserProfile = {
  id: "guest",
  timezone: "Asia/Jerusalem",
  primaryCalendar: "GREGORIAN",
  latitude: 31.7683,
  longitude: 35.2137,
  holidaySettings: null,
};

export default function HomePage() {
  const router = useRouter();
  const { isSignedIn, isLoaded } = useAuth();
  const [isGuest, setIsGuest] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth() + 1);
  const [primaryCalendar, setPrimaryCalendar] = useState<"HEBREW" | "GREGORIAN">("GREGORIAN");

  const [showAddEvent, setShowAddEvent] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showZmanim, setShowZmanim] = useState(false);
  const [zmanimDate, setZmanimDate] = useState<Date>(today);
  const [showGoToDate, setShowGoToDate] = useState(false);
  const [pickerMonth, setPickerMonth] = useState(today.getMonth() + 1);
  const [pickerYear, setPickerYear] = useState(today.getFullYear());
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("welcome") === "1") {
        setShowWelcome(true);
        window.history.replaceState({}, "", "/");
      }
    }
  }, []);

  const holidaySettings = user?.holidaySettings
    ? { ...DEFAULT_HOLIDAY_SETTINGS, ...user.holidaySettings }
    : DEFAULT_HOLIDAY_SETTINGS;

  const holidays = getHolidaysForMonth(viewYear, viewMonth, holidaySettings);
  const [selectedDate, setSelectedDate] = useState<{ gregorian: Date; hebrew: HDate } | null>(null);
  const [selectedDayEvents, setSelectedDayEvents] = useState<Event[]>([]);

  const todayHebrew = user
    ? getTodayHebrew(user.timezone, user.latitude, user.longitude)
    : new HDate(today);

  const loadData = useCallback(async () => {
    try {
      const [userRes, eventsRes, notifsRes] = await Promise.all([
        fetch("/api/user"),
        fetch("/api/events"),
        fetch("/api/notifications"),
      ]);

      if (userRes.status === 404) {
        router.push("/onboarding");
        return;
      }

      const userData: UserProfile = await userRes.json();
      const eventsData: Event[] = await eventsRes.json();
      const notifsData: Notification[] = await notifsRes.json();

      setUser(userData);
      setPrimaryCalendar(userData.primaryCalendar);
      setEvents(eventsData);
      setNotifications(notifsData);
    } catch {
      // silently fail; user will see empty state
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (!isLoaded) return;
    if (isSignedIn) {
      localStorage.removeItem("luach_guest");
      loadData();
      fetch("/api/notifications", { method: "POST" });
    } else {
      const guestFlag = localStorage.getItem("luach_guest");
      if (guestFlag === "true") {
        setIsGuest(true);
        setUser(GUEST_USER);
        setPrimaryCalendar("GREGORIAN");
        setLoading(false);
      } else {
        router.push("/welcome");
      }
    }
  }, [isLoaded, isSignedIn, loadData, router]);

  function prevMonth() {
    if (viewMonth === 1) { setViewMonth(12); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  }

  function nextMonth() {
    if (viewMonth === 12) { setViewMonth(1); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  }

  function goToToday() {
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth() + 1);
  }

  async function togglePrimaryCalendar() {
    const next = primaryCalendar === "GREGORIAN" ? "HEBREW" : "GREGORIAN";
    setPrimaryCalendar(next);
    if (user) {
      await fetch("/api/user", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ primaryCalendar: next }),
      });
    }
  }

  function handleDayClick(gregorian: Date, hebrew: HDate) {
    setSelectedDate({ gregorian, hebrew });
    const dayEvents = events.filter((ev) => {
      if (ev.canonicalCalendar === "HEBREW") {
        return ev.hebrewMonth === hebrew.getMonth() && ev.hebrewDay === hebrew.getDate();
      } else {
        return ev.gregorianMonth === gregorian.getMonth() + 1 && ev.gregorianDay === gregorian.getDate();
      }
    });
    setSelectedDayEvents(dayEvents);
  }

  async function handleSaveEvent(payload: EventPayload) {
    const res = await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      const { primary, paired } = await res.json();
      setEvents((prev) => [primary, ...(paired ? [paired] : []), ...prev]);
      setShowAddEvent(false);
      setSelectedDate(null);
      fetch("/api/notifications", { method: "POST" }).then(() => loadData());
    }
  }

  async function handleMarkNotificationRead(id: string) {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
        <div className="text-[var(--muted-foreground)]">Loading…</div>
      </div>
    );
  }

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="min-h-screen bg-[var(--background)] flex flex-col w-full">
      {/* Top bar */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)] bg-[var(--card)]">
        <button
          onClick={togglePrimaryCalendar}
          className="text-xs font-medium px-3 py-1.5 rounded-full border border-[var(--border)] text-[var(--foreground)] min-h-[auto]"
        >
          {primaryCalendar === "GREGORIAN" ? "Switch to Hebrew" : "Switch to English"}
        </button>

        <button
          onClick={goToToday}
          className="text-sm font-bold text-[var(--foreground)] min-h-[auto]"
        >
          Today
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowNotifications(true)}
            className="relative p-1.5 rounded-full min-h-[auto] min-w-[auto]"
          >
            <Bell size={20} className="text-[var(--foreground)]" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>
          <button
            onClick={() => router.push("/settings")}
            className="p-1.5 rounded-full min-h-[auto] min-w-[auto]"
          >
            <Settings size={20} className="text-[var(--foreground)]" />
          </button>
        </div>
      </header>

      {/* Guest banner */}
      {isGuest && (
        <div className="w-full bg-amber-100 dark:bg-amber-900/50 border-b border-amber-200 dark:border-amber-700 px-4 py-2 flex items-center justify-between gap-3">
          <p className="text-xs text-amber-900 dark:text-amber-100">
            You're using Luach as a guest. Your location is set to Jerusalem, and events and settings are not saved.
          </p>
          <button
            onClick={() => router.push("/sign-in")}
            className="text-xs font-semibold text-[var(--primary)] shrink-0 min-h-[auto] min-w-[auto]"
          >
            Sign in →
          </button>
        </div>
      )}

      {/* Month navigation */}
      <div className="flex items-center justify-between px-4 py-2">
        <button onClick={prevMonth} className="p-2 rounded-full min-h-[auto] min-w-[auto]">
          <ChevronLeft size={20} className="text-[var(--foreground)]" />
        </button>
        <button
          className="text-center min-h-[auto] min-w-[auto]"
          onClick={() => {
            if (primaryCalendar === "GREGORIAN") {
              setPickerMonth(viewMonth);
              setPickerYear(viewYear);
            } else {
              const h = new HDate(new Date(viewYear, viewMonth - 1, 15));
              setPickerMonth(h.getMonth());
              setPickerYear(h.getFullYear());
            }
            setShowGoToDate(true);
          }}
        >
          <div className="font-semibold text-[var(--foreground)]">
            {primaryCalendar === "GREGORIAN"
              ? `${GREGORIAN_MONTH_NAMES[viewMonth - 1]} ${viewYear}`
              : (() => { const h = new HDate(new Date(viewYear, viewMonth - 1, 15)); return `${formatHebrewDate(h)} ${h.getFullYear()}`; })()
            }
          </div>
          <div className="text-xs text-[var(--muted-foreground)]">
            {primaryCalendar === "GREGORIAN"
              ? (() => { const h = new HDate(new Date(viewYear, viewMonth - 1, 15)); return `${formatHebrewDate(h)} ${h.getFullYear()}`; })()
              : `${GREGORIAN_MONTH_NAMES[viewMonth - 1]} ${viewYear}`
            }
          </div>
        </button>
        <button onClick={nextMonth} className="p-2 rounded-full min-h-[auto] min-w-[auto]">
          <ChevronRight size={20} className="text-[var(--foreground)]" />
        </button>
      </div>

      {/* Calendar */}
      <div className="pb-4">
        <CalendarGrid
          year={viewYear}
          month={viewMonth}
          primaryCalendar={primaryCalendar}
          events={events}
          holidays={holidays}
          todayGregorian={today}
          onDayClick={handleDayClick}
        />
      </div>

      {/* Today strip */}
      <div className="mx-4 mb-4 rounded-xl bg-[var(--secondary)] px-4 py-3 flex items-center justify-between">
        <div className="text-center flex-1">
          <div className="text-xs text-[var(--muted-foreground)] mb-0.5">Today</div>
          <div className="font-semibold text-[var(--foreground)]">
            {formatGregorianDate(today, true)}
          </div>
          <div className="text-sm text-[var(--muted-foreground)]">
            {formatHebrewDate(todayHebrew, true)}
          </div>
        </div>
        <button
          onClick={() => { setZmanimDate(today); setShowZmanim(true); }}
          className="flex flex-col items-center gap-0.5 p-2 min-h-[auto] min-w-[auto]"
          title="Zmanim"
        >
          <Clock size={18} className="text-[var(--muted-foreground)]" />
          <span className="text-[9px] text-[var(--muted-foreground)] leading-none">Zmanim</span>
        </button>
      </div>

      <Footer />

      {/* FAB */}
      {!isGuest && (
        <button
          onClick={() => setShowAddEvent(true)}
          className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-[var(--primary)] text-white shadow-lg flex items-center justify-center min-h-[auto] min-w-[auto]"
        >
          <Plus size={24} />
        </button>
      )}

      {/* Day detail sheet */}
      {selectedDate && (
        <div
          className="fixed inset-0 z-40 flex items-end bg-black/40"
          onClick={() => setSelectedDate(null)}
        >
          <div
            className="w-full max-w-lg mx-auto bg-[var(--card)] rounded-t-2xl p-5 pb-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between gap-2">
              <div>
              {(() => {
                const key = selectedDate.gregorian.toISOString().slice(0, 10);
                const holidayEntry = holidays.get(key);
                return holidayEntry ? (
                  <div className="text-xs font-semibold text-amber-600 uppercase tracking-wide mb-1">{holidayEntry.name}</div>
                ) : null;
              })()}
              <div className="font-bold text-lg text-[var(--foreground)]">
                {formatGregorianDate(selectedDate.gregorian, true)}
              </div>
              <div className="text-sm text-[var(--muted-foreground)]">
                {formatHebrewDate(selectedDate.hebrew, true)}
              </div>
              </div>
              <button
                onClick={() => { setZmanimDate(selectedDate.gregorian); setShowZmanim(true); }}
                className="flex flex-col items-center gap-0.5 p-1 min-h-[auto] min-w-[auto] shrink-0 mt-1"
              >
                <Clock size={18} className="text-[var(--muted-foreground)]" />
                <span className="text-[9px] text-[var(--muted-foreground)] leading-none">Zmanim</span>
              </button>
            </div>

            {selectedDayEvents.length === 0 ? (
              <p className="text-[var(--muted-foreground)] text-sm">No events on this day.</p>
            ) : (
              <ul className="space-y-2">
                {selectedDayEvents.map((ev) => (
                  <li key={ev.id} className="rounded-lg bg-[var(--secondary)] px-4 py-3">
                    <div className="font-medium text-[var(--foreground)]">{ev.title}</div>
                    <div className="text-xs text-[var(--muted-foreground)] capitalize">
                      {ev.type.toLowerCase()} · via {ev.canonicalCalendar.toLowerCase()} calendar
                    </div>
                  </li>
                ))}
              </ul>
            )}

            <button
              onClick={() => setShowAddEvent(true)}
              className="mt-4 w-full rounded-lg bg-[var(--primary)] text-white py-3 text-sm font-medium"
            >
              Add event on this day
            </button>
          </div>
        </div>
      )}

      {/* Add event sheet */}
      {showAddEvent && (
        <div
          className="fixed inset-0 z-50 flex items-end bg-black/40"
          onClick={() => { setShowAddEvent(false); setSelectedDate(null); }}
        >
          <div
            className="w-full max-w-lg mx-auto bg-[var(--card)] rounded-t-2xl p-5 pb-8 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-bold mb-4 text-[var(--foreground)]">Add event</h2>
            <EventForm
              initialGregorianDate={selectedDate?.gregorian}
              initialHebrewDate={selectedDate?.hebrew}
              primaryCalendar={primaryCalendar}
              onSave={handleSaveEvent}
              onCancel={() => { setShowAddEvent(false); setSelectedDate(null); }}
            />
          </div>
        </div>
      )}

      {/* Welcome modal */}
      {showWelcome && (
        <div className="fixed inset-0 z-50 bg-[var(--background)] overflow-y-auto flex flex-col">
          <div className="flex-1 px-8 pt-16 pb-8 max-w-lg mx-auto w-full">
            <div className="mb-12">
              <h1 className="text-4xl font-bold text-[var(--foreground)] mb-2">Luach</h1>
              <p className="text-[var(--muted-foreground)] text-base">Your Jewish lifecycle calendar</p>
            </div>

            {[
              {
                title: "What Luach does",
                body: ["Luach tracks the events that matter most in Jewish life — birthdays, anniversaries, and yahrzeits — and follows them across both the Hebrew and Gregorian calendars, automatically, every year."],
              },
              {
                title: "How events work",
                body: [
                  "When you add a birthday or anniversary, Luach creates two linked events: one anchored to the Hebrew date, one to the English date. Each recurs independently on its own calendar. Each sends its own reminder. You never miss either.",
                  "Yahrzeits are Hebrew-only — the Hebrew date is what matters. If you know the English date, enter it and Luach converts it for you, accounting for whether it was before or after sunset.",
                ],
              },
              {
                title: "Jewish holidays",
                body: [
                  "Luach displays Jewish holidays directly on the calendar. Major holidays, Rosh Chodesh, Chanukah, Sefirat HaOmer, and more — all customizable by category. Choose Diaspora or Israel schedule.",
                  "Find holiday settings under Settings → Jewish holidays.",
                ],
              },
              {
                title: "Do this first",
                body: ["Open Settings and confirm your time zone — this determines when the Hebrew date changes at sunset. If you want accurate Zmanim (halachic times), add your location there too."],
              },
              {
                title: "Then do this",
                body: ["Tap the + button to add your first event. A birthday or yahrzeit is a good place to start."],
              },
            ].map((s) => (
              <div key={s.title} className="mb-10">
                <h2 className="text-xs font-semibold uppercase tracking-widest text-[var(--primary)] mb-3">{s.title}</h2>
                <div className="space-y-2">
                  {s.body.map((p, i) => (
                    <p key={i} className="text-sm leading-relaxed text-[var(--foreground)]">{p}</p>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="px-8 pb-12 max-w-lg mx-auto w-full">
            <button
              onClick={() => setShowWelcome(false)}
              className="w-full rounded-xl bg-[var(--primary)] text-white py-4 text-base font-semibold min-h-[auto]"
            >
              Open my calendar
            </button>
          </div>
        </div>
      )}

      {/* Zmanim sheet */}
      {showZmanim && (
        <ZmanimSheet
          date={zmanimDate}
          latitude={user?.latitude}
          longitude={user?.longitude}
          timezone={user?.timezone ?? "America/New_York"}
          onClose={() => setShowZmanim(false)}
        />
      )}

      {/* Go to date sheet */}
      {showGoToDate && (() => {
        const selectClass = "rounded-lg border border-[var(--border)] bg-[var(--card)] px-2 py-2 text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]";
        const isGregorian = primaryCalendar === "GREGORIAN";
        const gregYears = Array.from({ length: 200 }, (_, i) => 2100 - i);
        const hebYears = Array.from({ length: 200 }, (_, i) => 5900 - i);
        const isLeap = !isGregorian && HDate.isLeapYear(pickerYear);
        const hebMonthOptions = Object.entries(HEBREW_MONTH_NAMES)
          .map(([num, name]) => ({ value: Number(num), label: name }))
          .filter(({ value }) => isLeap || value !== months.ADAR_I);

        function go() {
          if (isGregorian) {
            setViewMonth(pickerMonth);
            setViewYear(pickerYear);
          } else {
            const greg = new HDate(1, pickerMonth, pickerYear).greg();
            setViewMonth(greg.getMonth() + 1);
            setViewYear(greg.getFullYear());
          }
          setShowGoToDate(false);
        }

        return (
          <div className="fixed inset-0 z-50 flex items-end bg-black/40" onClick={() => setShowGoToDate(false)}>
            <div className="w-full max-w-lg mx-auto bg-[var(--card)] rounded-t-2xl p-5 pb-8" onClick={(e) => e.stopPropagation()}>
              <h2 className="text-lg font-bold mb-4 text-[var(--foreground)]">Go to date</h2>
              <div className="flex gap-2 mb-6">
                <select
                  value={pickerMonth}
                  onChange={(e) => setPickerMonth(Number(e.target.value))}
                  className={`${selectClass} flex-1`}
                >
                  {isGregorian
                    ? GREGORIAN_MONTH_NAMES.map((name, i) => (
                        <option key={i + 1} value={i + 1}>{name}</option>
                      ))
                    : hebMonthOptions.map(({ value, label }) => (
                        <option key={value} value={value}>{label}</option>
                      ))
                  }
                </select>
                <select
                  value={pickerYear}
                  onChange={(e) => setPickerYear(Number(e.target.value))}
                  className={`${selectClass} w-24`}
                >
                  {(isGregorian ? gregYears : hebYears).map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
              <button onClick={go} className="w-full rounded-lg bg-[var(--primary)] text-white py-3 font-medium min-h-[auto]">
                Go
              </button>
            </div>
          </div>
        );
      })()}

      {/* Notifications sheet */}
      {showNotifications && (
        <div
          className="fixed inset-0 z-50 flex items-end bg-black/40"
          onClick={() => setShowNotifications(false)}
        >
          <div
            className="w-full max-w-lg mx-auto bg-[var(--card)] rounded-t-2xl p-5 pb-8 max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-bold mb-4 text-[var(--foreground)]">Upcoming reminders</h2>
            {notifications.length === 0 ? (
              <p className="text-[var(--muted-foreground)] text-sm">No upcoming reminders.</p>
            ) : (
              <ul className="space-y-2">
                {notifications.map((n) => (
                  <li key={n.id} className="flex items-start justify-between gap-3 rounded-lg bg-[var(--secondary)] px-4 py-3">
                    <div>
                      <div className="font-medium text-sm text-[var(--foreground)]">{n.message}</div>
                      <div className="text-xs text-[var(--muted-foreground)] mt-0.5">
                        {new Date(n.eventDate).toLocaleDateString("en-US", {
                          weekday: "short", month: "short", day: "numeric",
                        })}
                      </div>
                    </div>
                    <button
                      onClick={() => handleMarkNotificationRead(n.id)}
                      className="text-xs text-[var(--muted-foreground)] underline shrink-0 min-h-[auto] min-w-[auto] py-0"
                    >
                      Dismiss
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
