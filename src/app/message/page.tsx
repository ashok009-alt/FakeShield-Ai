import { redirect } from "next/navigation";

/**
 * `/message` was the early name for the message analyzer. Keep the alias so
 * saved links, the assistant playbook and the extension concept all land on the
 * live tool instead of a 404.
 */
export default function MessageAliasPage() {
  redirect("/analyze");
}
