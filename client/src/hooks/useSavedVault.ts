import { useState, useEffect } from "react";
import { cpToast } from "../utils/toast";

const API_URL = import.meta.env.VITE_API_URL;

export function useSavedVault(vaultId: string, isOwnVault: boolean) {
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOwnVault) return;
    const check = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_URL}/saved-vaults/status/${vaultId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setSaved(data.saved);
        }
      } catch {
        // silently fail — icon just stays empty
      }
    };
    check();
  }, [vaultId, isOwnVault]);

  const toggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (loading) return;

    // Optimistically flip immediately
    const prevSaved = saved;
    setSaved(!prevSaved);
    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/saved-vaults/${vaultId}`, {
        method: prevSaved ? "DELETE" : "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        cpToast.success(prevSaved ? "Vault unsaved." : "Vault saved!");
      } else {
        // Roll back on failure
        setSaved(prevSaved);
        cpToast.error("Something went wrong.");
      }
    } catch {
      setSaved(prevSaved);
      cpToast.error("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return { saved, loading, toggle };
}