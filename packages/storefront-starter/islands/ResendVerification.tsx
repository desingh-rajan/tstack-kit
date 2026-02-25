import { useState } from "preact/hooks";

interface ResendVerificationProps {
  token: string;
}

export default function ResendVerification(
  { token }: ResendVerificationProps,
) {
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [message, setMessage] = useState("");

  const handleResend = async () => {
    setStatus("loading");
    try {
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        setStatus("success");
        setMessage(data.message || "Verification email sent!");
      } else {
        setStatus("error");
        setMessage(data.message || "Failed to resend verification email.");
      }
    } catch {
      setStatus("error");
      setMessage("Network error. Please try again.");
    }
  };

  return (
    <div class="inline">
      {status === "idle" && (
        <button
          type="button"
          onClick={handleResend}
          class="underline text-indigo-600 hover:text-indigo-500"
        >
          Resend verification
        </button>
      )}
      {status === "loading" && <span class="text-gray-500">Sending...</span>}
      {status === "success" && <span class="text-green-600">{message}</span>}
      {status === "error" && <span class="text-red-600">{message}</span>}
    </div>
  );
}
