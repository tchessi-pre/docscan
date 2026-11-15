import { LoginForm } from "@/components/auth/LoginForm";
import { safeRedirectPath } from "@/lib/auth/validation";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirectTo?: string }>;
}) {
  const { redirectTo } = await searchParams;

  return <LoginForm redirectTo={safeRedirectPath(redirectTo)} />;
}
