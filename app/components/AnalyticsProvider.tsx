"use client";

import { useEffect } from "react";
import { getAnalyticsClient } from "@/firebase/config";

export default function AnalyticsProvider() {
  useEffect(() => {
    getAnalyticsClient();
  }, []);
  return null;
}
