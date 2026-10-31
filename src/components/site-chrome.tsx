"use client";

import { usePathname } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { AssistantBubble } from "@/components/assistant-bubble";
import type { ProviderStatus } from "@/lib/intel/threatIntel";

/**
 * Site-wide chrome. The immersive landing page ("/") brings its own full-screen
 * navigation and footer strip, so the standard header/footer are only rendered
 * for the rest of the routes.
 */
export function SiteChrome({
  children,
  threatFeed,
  providers,
}: {
  children: React.ReactNode;
  threatFeed: boolean;
  providers: ProviderStatus;
}) {
  const pathname = usePathname();
  // The shared family checker is deliberately calm; keep the assistant out of it.
  const showAssistant = !pathname.startsWith("/protect/");

  if (pathname === "/") {
    return (
      <main id="main" className="relative z-10 flex flex-1 flex-col">
        {children}
        {showAssistant ? <AssistantBubble /> : null}
      </main>
    );
  }

  return (
    <>
      <SiteHeader threatFeed={threatFeed} providers={providers} />
      <main id="main" className="relative z-10 flex-1">
        {children}
      </main>
      <SiteFooter />
      {showAssistant ? <AssistantBubble /> : null}
    </>
  );
}
