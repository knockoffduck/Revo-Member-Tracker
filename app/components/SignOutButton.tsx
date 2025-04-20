"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

export default function SignOutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSignOut = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push("/auth/sign-in"); // redirect to login page
          router.refresh(); // Refresh server components/data
        },
        onError: () => {
          console.error("Failed to sign out");
        },
        onRequest: () => {
          setLoading(true);
        },
      },
    });
  };

  return loading ? (
    <Button disabled>Signing Out...</Button>
  ) : (
    <Button onClick={handleSignOut}>Sign Out</Button>
  );
}
