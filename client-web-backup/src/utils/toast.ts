import toast from "react-hot-toast";

const base = {
  borderRadius: "10px",
  fontSize: "14px",
  fontWeight: 600,
  padding: "12px 16px",
  maxWidth: "360px",
};

export const cpToast = {
  success: (message: string) =>
    toast.success(message, {
      style: {
        ...base,
        background: "#160408",
        color: "#F7F4F5",
        border: "1px solid #2e0a12",
        boxShadow: "0 8px 30px rgba(0,0,0,0.6)",
      },
      iconTheme: {
        primary: "#9E1B32",
        secondary: "#F7F4F5",
      },
      duration: 3000,
    }),

  error: (message: string) =>
    toast.error(message, {
      style: {
        ...base,
        background: "#160408",
        color: "#F7F4F5",
        border: "1px solid #5c0f1e",
        boxShadow: "0 8px 30px rgba(0,0,0,0.6)",
      },
      iconTheme: {
        primary: "#e05370",
        secondary: "#F7F4F5",
      },
      duration: 4000,
    }),
};