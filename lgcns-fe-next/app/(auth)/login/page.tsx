import { Suspense } from "react";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import LoginSection from "@/component/templates/LoginSection";
import { authOptions } from "@/lib/authOptions";

export default async function Login() {
  if (await getServerSession(authOptions)) redirect("/");
  return (
    <Suspense fallback={null}>
      <LoginSection />
    </Suspense>
  );
}
