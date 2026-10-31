// Route-group layout — deliberately has NO SiteHeader / SiteFooter
// so the hero page can be full-screen.
export default function HeroGroupLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
