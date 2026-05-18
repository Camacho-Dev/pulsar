"use client";

import { usePushRegistration } from "@/hooks/use-push-registration";

export function PushRegistrationMount() {
  usePushRegistration();
  return null;
}
