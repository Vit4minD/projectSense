"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase/client";
import {
  getAnalyticsClient,
  setAnalyticsUser,
  setAnalyticsUserProperties,
  trackEvent,
} from "@/lib/firebase/analytics";

export function AnalyticsProvider() {
  const pathname = usePathname();

  // Firebase Analytics does not auto-log page views for client-side (SPA) route
  // changes, so fire one explicitly whenever the path changes.
  useEffect(() => {
    if (pathname) void trackEvent("page_view", { page_path: pathname });
  }, [pathname]);

  useEffect(() => {
    void getAnalyticsClient();
    const auth = getFirebaseAuth();
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        void setAnalyticsUser(user.uid);
        if (user.metadata.creationTime) {
          void setAnalyticsUserProperties({ signup_date: user.metadata.creationTime });
        }
      } else {
        void setAnalyticsUser(null);
      }
    });
    return unsub;
  }, []);
  return null;
}
