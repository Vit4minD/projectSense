"use client";

import { useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import {
  auth,
  getAnalyticsClient,
  setAnalyticsUser,
  setAnalyticsUserProperties,
} from "@/firebase/config";

export default function AnalyticsProvider() {
  useEffect(() => {
    getAnalyticsClient();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setAnalyticsUser(user.uid);
        if (user.metadata.creationTime) {
          setAnalyticsUserProperties({
            signup_date: user.metadata.creationTime,
          });
        }
      } else {
        setAnalyticsUser(null);
      }
    });
    return () => unsubscribe();
  }, []);
  return null;
}
