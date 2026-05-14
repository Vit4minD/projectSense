"use client";

import { useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase/client";
import {
  getAnalyticsClient,
  setAnalyticsUser,
  setAnalyticsUserProperties,
} from "@/lib/firebase/analytics";

export function AnalyticsProvider() {
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
