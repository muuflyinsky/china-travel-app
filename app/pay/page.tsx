import { redirect } from "next/navigation";

// Merged in SPEC v0.4; kept so old links and bookmarks still land somewhere useful.
export default function Moved() {
  redirect("/#pay");
}
