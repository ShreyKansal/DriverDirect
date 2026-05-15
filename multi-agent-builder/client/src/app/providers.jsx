"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "../context/ThemeContext.jsx";

export default function Providers({ children, session }) {
  return (
    <ThemeProvider>
      <SessionProvider session={session}>{children}</SessionProvider>
    </ThemeProvider>
  );
}
