"use client";
import React, { useState } from "react";
import toast from "react-hot-toast";
import Image from "next/image";
import AuthModal from "@/components/auth/AuthModal";
import { useUser } from "@/components/context/UserContext";
import { useLanguage } from "@/components/context/LanguageContext";

const API = process.env.NEXT_PUBLIC_API_URL || "https://api.pickob.com";

// "Join Our Newsletter" band — /newsletter.png as full background with the
// centered subscribe form on top. Sits right above the footer.
export default function Newsletter() {
  const { user, refreshUser } = useUser();
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [localToast, setLocalToast] = useState(null); // { type: 'success'|'error'|'warn', msg }
  const [subscribed, setSubscribed] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const showToast = (type, msg) => {
    setLocalToast({ type, msg });
    setTimeout(() => setLocalToast(null), 3500);
  };

  // update subscribed state when user loads/changes
  React.useEffect(() => {
    setEmail(user?.email || "");
    if (user?.newsletterSubscribed) {
      setSubscribed(true);
    } else {
      setSubscribed(false);
    }
  }, [user]);

  const handleToggleSubscription = async (e) => {
    e.preventDefault();
    if (!user) {
      // show interactive toast with login button
      toast(
        (toastObj) => (
          <span className="flex items-center gap-2">
            {t("footer.login_to_subscribe")}{" "}
            <button
              onClick={() => {
                toast.dismiss(toastObj.id);
                setShowAuthModal(true);
              }}
              className="font-semibold text-[#5B21B6] underline hover:text-[#4C1D95]"
            >
              {t("auth.login")}
            </button>
          </span>
        ),
        { icon: "🔒" },
      );
      return;
    }

    const enteredEmail = email.trim().toLowerCase();
    const userEmail = (user.email || "").trim().toLowerCase();
    if (!enteredEmail) {
      showToast("error", "Please enter your email address.");
      return;
    }
    if (enteredEmail !== userEmail) {
      showToast(
        "warn",
        "To subscribe with a different email, please login with that email.",
      );
      return;
    }

    setToggling(true);
    try {
      const endpoint = subscribed
        ? "/api/user/unsubscribe"
        : "/api/user/subscribe";
      const resp = await fetch(`${API}${endpoint}`, {
        method: "POST",
        credentials: "include",
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || "Server error");
      if (subscribed) {
        showToast("success", "You have unsubscribed😥");
        setSubscribed(false);
      } else {
        showToast("success", "You are now subscribed! 🎉");
        setSubscribed(true);
      }
      setEmail(user.email || "");
      refreshUser?.();
    } catch (err) {
      showToast("error", err.message || "Request failed.");
    } finally {
      setToggling(false);
    }
  };

  return (
    <>
      <section className=" relative w-full overflow-hidden bg-[#F5F6F7]">
        <Image
          src="/newsletter.png"
          alt=""
          fill
          sizes="100vw"
          className="object-cover object-center"
        />
        <div className="relative z-10 max-w-xl mx-auto text-center px-6 py-34 md:py-40">
          <h2 className="text-2xl md:text-4xl font-bold tracking-tight text-[#1F2937] mb-2">
            {t("newsletter.title")}
          </h2>
          <p className="text-sm md:text-base text-[#6B7280] mb-8">
            {t("newsletter.sub")}
          </p>
          <form
            onSubmit={handleToggleSubscription}
            className="flex items-center gap-2 border-b border-gray-400/70 pb-1.5 max-w-md mx-auto"
          >
            <svg
              className="w-4 h-4 shrink-0 text-gray-500"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <polyline points="22,6 12,13 2,6" />
            </svg>
            <label htmlFor="newsletter" className="sr-only">
              Email address
            </label>
            <input
              id="newsletter"
              type="email"
              placeholder={t("footer.email_placeholder")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 min-w-0 bg-transparent outline-none text-sm text-[#1F2937] placeholder-gray-500 py-2"
              aria-label="Email address"
              disabled={subscribed || toggling}
              style={{ opacity: subscribed ? 0.6 : 1 }}
            />
            <button
              type="submit"
              aria-label={subscribed ? "Unsubscribe" : "Subscribe"}
              disabled={toggling}
              className={`shrink-0 px-5 py-2 rounded-md text-xs font-semibold text-white transition ${
                subscribed
                  ? "bg-gray-400 hover:bg-gray-400"
                  : "bg-[#5B21B6] hover:bg-[#4C1D95]"
              }`}
            >
              {toggling
                ? subscribed
                  ? t("footer.unsubscribing")
                  : t("footer.subscribing")
                : subscribed
                  ? t("footer.unsubscribe")
                  : t("newsletter.signup")}
            </button>
          </form>
        </div>
      </section>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />

      {localToast && (
        <div
          className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-full text-sm font-medium shadow-lg text-white transition-all ${
            localToast.type === "success"
              ? "bg-green-600"
              : localToast.type === "warn"
                ? "bg-amber-500"
                : "bg-red-600"
          }`}
        >
          {localToast.msg}
        </div>
      )}
    </>
  );
}
