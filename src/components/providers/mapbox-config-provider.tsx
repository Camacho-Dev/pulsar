"use client";

import { createContext, useContext } from "react";

const MapboxConfigContext = createContext({ token: "" });

export function MapboxConfigProvider({
  token,
  children,
}: {
  token: string;
  children: React.ReactNode;
}) {
  return (
    <MapboxConfigContext.Provider value={{ token }}>
      {children}
    </MapboxConfigContext.Provider>
  );
}

export function useMapboxConfig() {
  return useContext(MapboxConfigContext);
}
