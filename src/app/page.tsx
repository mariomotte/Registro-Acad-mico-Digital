import { redirect } from "next/navigation";

export default function Home() {
  // Normally logic for session check would go here
  redirect("/(dashboard)");
  return null;
}
