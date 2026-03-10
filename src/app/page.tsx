
import { redirect } from "next/navigation";

export default function Home() {
  // Redirect to the dashboard which is handled by the (dashboard) route group
  // Since (dashboard)/page.tsx is at the root of the group, it's accessible at "/"
  // But to avoid conflict with this file, we can redirect to a sub-route or 
  // simply ensure this file doesn't shadow the group if possible.
  // In Next.js, (dashboard)/page.tsx and page.tsx at the same level conflict.
  // We'll treat this as the landing/redirect logic.
  redirect("/incidents"); 
  return null;
}
