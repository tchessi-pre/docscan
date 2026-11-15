"use client";

import { AlertTriangle, MailCheck, Send } from "lucide-react";
import Link from "next/link";
import { useActionState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requestPasswordReset, type AuthResult } from "@/lib/auth/actions";

async function action(
  _previous: AuthResult | null,
  formData: FormData,
): Promise<AuthResult> {
  return requestPasswordReset(formData);
}

export function ForgotPasswordForm() {
  const [state, formAction, isPending] = useActionState(action, null);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Mot de passe oublié</CardTitle>
        <CardDescription>
          Nous t&apos;envoyons un lien pour choisir un nouveau mot de passe.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {state?.ok ? (
          <Alert>
            <MailCheck />
            <AlertDescription>
              Si un compte existe pour cette adresse, un lien de réinitialisation vient
              d&apos;être envoyé.
            </AlertDescription>
          </Alert>
        ) : (
          <form action={formAction} className="flex flex-col gap-4">
            {state && !state.ok && (
              <Alert variant="destructive">
                <AlertTriangle />
                <AlertDescription>{state.error}</AlertDescription>
              </Alert>
            )}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" autoComplete="email" required />
            </div>
            <Button type="submit" disabled={isPending}>
              <Send />
              {isPending ? "Envoi…" : "Envoyer le lien"}
            </Button>
          </form>
        )}
        <p className="pt-4 text-center text-sm text-muted-foreground">
          <Link href="/login" className="text-foreground underline underline-offset-4">
            Retour à la connexion
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
