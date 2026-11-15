import { AlertTriangle } from "lucide-react";
import Link from "next/link";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

export default async function ResetPasswordPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Lien invalide</CardTitle>
          <CardDescription>
            Ce lien de réinitialisation a expiré ou a déjà été utilisé.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Alert variant="destructive">
            <AlertTriangle />
            <AlertDescription>
              Demande un nouveau lien pour réinitialiser ton mot de passe.
            </AlertDescription>
          </Alert>
          <Link
            href="/forgot-password"
            className="text-center text-sm text-foreground underline underline-offset-4"
          >
            Demander un nouveau lien
          </Link>
        </CardContent>
      </Card>
    );
  }

  return <ResetPasswordForm />;
}
