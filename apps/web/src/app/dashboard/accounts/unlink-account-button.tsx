"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  provider: string;
  providerAccountId: string;
}

export function UnlinkAccountButton({ provider, providerAccountId }: Props) {
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const router = useRouter();

  function handleUnlink() {
    if (!confirming) {
      setConfirming(true);
      return;
    }

    setLoading(true);
    fetch("/api/auth/unlink", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ provider, providerAccountId }),
    })
      .then(async (response) => {
        if (!response.ok) {
          const data = (await response.json()) as { error?: string };
          alert(data.error || "Failed to unlink account.");
        } else {
          router.refresh();
        }
      })
      .catch(() => {
        alert("Failed to unlink account. Please try again.");
      })
      .finally(() => {
        setLoading(false);
        setConfirming(false);
      });
  }

  function handleCancel() {
    setConfirming(false);
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={() => handleUnlink()}
          disabled={loading}
          className="rounded-md bg-red-500/20 px-3 py-1 text-xs font-medium text-red-300 border border-red-500/30 hover:bg-red-500/30 transition-colors disabled:opacity-50"
        >
          {loading ? "Removing..." : "Confirm"}
        </button>
        <button
          onClick={handleCancel}
          className="rounded-md bg-white/5 px-3 py-1 text-xs font-medium text-gray-400 border border-white/10 hover:bg-white/10 transition-colors"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => handleUnlink()}
      className="rounded-md bg-white/5 px-3 py-1 text-xs font-medium text-gray-400 border border-white/10 hover:bg-red-500/20 hover:text-red-300 hover:border-red-500/30 transition-colors"
    >
      Disconnect
    </button>
  );
}
