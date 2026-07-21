import { useState, useEffect } from "react";
import { cpToast } from "../utils/toast";
import { storage } from "../utils/storage";

const API_URL = process.env.EXPO_PUBLIC_API_URL;

export function useSavedVault(vaultId: string, isOwnVault: boolean, initialSaved?: boolean) {
  const [saved, setSaved] = useState(initialSaved ?? false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOwnVault || initialSaved !== undefined) return;
    const check = async () => {
      try {
        const token = await storage.getToken();
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

  const toggle = async () => {
    if (loading) return;

    // Optimistically flip immediately
    const prevSaved = saved;
    setSaved(!prevSaved);
    setLoading(true);

    try {
      const token = await storage.getToken();
      const res = await fetch(`${API_URL}/saved-vaults/${vaultId}`, {
        method: prevSaved ? "DELETE" : "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        cpToast.success(prevSaved ? "Vault unsaved." : "Vault saved!");
      } else {
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