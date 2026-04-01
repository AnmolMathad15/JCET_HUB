import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { setExtraHeadersGetter } from "@workspace/api-client-react";

setExtraHeadersGetter(() => {
  try {
    const raw = localStorage.getItem("user");
    if (!raw) return null;
    const user = JSON.parse(raw);
    const headers: Record<string, string> = {};
    if (user?.id)  headers["x-user-id"]  = user.id;
    if (user?.usn) headers["x-user-usn"] = user.usn;
    return Object.keys(headers).length ? headers : null;
  } catch {
    return null;
  }
});

createRoot(document.getElementById("root")!).render(<App />);
