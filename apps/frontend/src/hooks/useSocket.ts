import { useEffect, useRef } from "react";
import { getSocket } from "@/lib/socket";
import type { Socket } from "socket.io-client";

export function usePollSocket(pollId: string | undefined) {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!pollId) return;

    const socket = getSocket();
    socketRef.current = socket;

    socket.emit("join:poll", { pollId });

    return () => {
      socket.emit("leave:poll", { pollId });
    };
  }, [pollId]);

  return socketRef.current;
}
