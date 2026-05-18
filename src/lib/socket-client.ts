"use client";

import { useEffect, useRef } from "react";
import { io, type Socket } from "socket.io-client";

export function useSocket() {
  const ref = useRef<Socket | null>(null);

  useEffect(() => {
    if (ref.current) return;
    ref.current = io({
      path: "/api/socket/io",
      transports: ["websocket", "polling"],
    });
    return () => {
      ref.current?.disconnect();
      ref.current = null;
    };
  }, []);

  return ref;
}
