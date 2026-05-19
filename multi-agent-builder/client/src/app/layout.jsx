import "@xyflow/react/dist/style.css";
import "../styles.css";
import Providers from "./providers.jsx";

export const metadata = {
  title: "FluxDrive",
  description: "Visual multi-agent LLM workflow builder"
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
