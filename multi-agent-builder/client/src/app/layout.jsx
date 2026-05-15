import "@xyflow/react/dist/style.css";
import "../styles.css";
import Providers from "./providers.jsx";

export const metadata = {
  title: "Multi-Agent Builder",
  description: "Visual LangChain JS multi-agent workflow builder"
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
