import { redirect } from "next/navigation";

// Old URL: preferences moved to /settings, the trip guide to /prepare.
export default function Essentials() {
  redirect("/prepare");
}
