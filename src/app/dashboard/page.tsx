import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getSessionCookieName, verifySession } from "@/lib/auth/session";
import { DashboardClient } from "@/app/dashboard/ui/dashboard-client";

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(getSessionCookieName())?.value ?? "";
  const session = token ? await verifySession(token) : null;

  if (!session) redirect("/");

  return <DashboardClient />;
}

