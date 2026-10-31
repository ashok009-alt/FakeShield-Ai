import { redirect } from "next/navigation";

// The immersive landing page is now the homepage.
export default function HeroPage() {
  redirect("/");
}
