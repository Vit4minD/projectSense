import { isSupported, logEvent, setUserId, setUserProperties, type Analytics } from "firebase/analytics";

let analyticsPromise: Promise<Analytics | null> | null = null;

async function loadAnalytics(): Promise<Analytics | null> {
  if (typeof window === "undefined") return null;
  if (!process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID) return null;
  try {
    if (!(await isSupported())) return null;
  } catch {
    return null;
  }
  const [{ getAnalytics }, { getApp }] = await Promise.all([
    import("firebase/analytics"),
    import("firebase/app"),
  ]);
  try {
    return getAnalytics(getApp());
  } catch {
    return null;
  }
}

export function getAnalyticsClient(): Promise<Analytics | null> {
  if (!analyticsPromise) {
    analyticsPromise = loadAnalytics();
  }
  return analyticsPromise;
}

export async function trackEvent(name: string, params?: Record<string, unknown>): Promise<void> {
  const analytics = await getAnalyticsClient();
  if (!analytics) return;
  try {
    logEvent(analytics, name, params as Record<string, string | number | boolean>);
  } catch {
    // Swallow analytics errors — they should never affect product behavior.
  }
}

export async function setAnalyticsUser(uid: string | null): Promise<void> {
  const analytics = await getAnalyticsClient();
  if (!analytics) return;
  try {
    setUserId(analytics, uid);
  } catch {
    // ignore
  }
}

export async function setAnalyticsUserProperties(props: Record<string, string>): Promise<void> {
  const analytics = await getAnalyticsClient();
  if (!analytics) return;
  try {
    setUserProperties(analytics, props);
  } catch {
    // ignore
  }
}
