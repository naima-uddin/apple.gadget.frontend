"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

const UserContext = createContext({
  user: null,
  setUser: () => {},
  refreshUser: () => {},
  loading: true,
});

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const API = process.env.NEXT_PUBLIC_API_URL || "https://api.applebd.com";

  // Stable identity: several components depend on `refreshUser` in their effect
  // deps (e.g. `[user, refreshUser]`). If it were recreated every render those
  // effects would re-fire on every render and hammer /api/auth/me into a 429
  // loop (spinner flicker). useCallback keeps the reference constant.
  const refreshUser = useCallback(async () => {
    try {
      setLoading(true);
      const r = await fetch(`${API}/api/auth/me`, { credentials: "include" });
      const data = await r.json();
      setUser(data.user || null);
      return data.user || null;
    } catch (err) {
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, [API]);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  return (
    <UserContext.Provider value={{ user, setUser, refreshUser, loading }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);

export default UserContext;
