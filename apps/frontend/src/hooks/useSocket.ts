import { useEffect, useState } from "react";
import { getSocket } from "@/lib/socket";
import type { Socket } from "socket.io-client";

export function usePollSocket(pollId: string | undefined) {
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    if (!pollId) return;

    const s = getSocket();
    s.emit("join:poll", { pollId });
    setSocket(s);

    return () => {
      s.emit("leave:poll", { pollId });
      setSocket(null);
    };
  }, [pollId]);

  return socket;
}
