import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Demo | Edify OS",
  description:
    "A guided walkthrough of the Edify OS nonprofit user portal. See the dashboard, meet your team, and understand how the whole thing works.",
};

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
