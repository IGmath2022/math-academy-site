// client/src/utils/useAuthHeader.js
import { useEffect, useMemo, useState } from "react";

/** Authorization 헤더를 항상 최신으로 유지하는 훅 */
export default function useAuthHeader() {
  const [token, setToken] = useState(() => localStorage.getItem("token") || "");

  useEffect(() => {
    const sync = () => setToken(localStorage.getItem("token") || "");
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);

  return useMemo(
    () => (token ? { headers: { Authorization: `Bearer ${token}` } } : {}),
    [token]
  );
}