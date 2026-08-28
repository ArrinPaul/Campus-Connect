import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth/server";

export default async function LandingPage() {
  const user = await currentUser();
  
  if (user) {
    redirect("/feed");
  } else {
    redirect("/sign-in");
  }
}