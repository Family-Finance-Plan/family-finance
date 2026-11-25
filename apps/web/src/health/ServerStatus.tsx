import { useEffect, useState } from "react";
import { he } from "../locale/he";
import { fetchHealth } from "./fetch-health";

type Status = "loading" | "ok" | "error";

export function ServerStatus() {
  const [status, setStatus] = useState<Status>("loading");

  useEffect(() => {
    const controller = new AbortController();
    fetchHealth(controller.signal)
      .then((health) => {
        setStatus(health.status === "ok" ? "ok" : "error");
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setStatus("error");
        }
      });
    return () => {
      controller.abort();
    };
  }, []);

  return (
    <p className={`server-status server-status--${status}`} role="status">
      {he.serverStatus[status]}
    </p>
  );
}
