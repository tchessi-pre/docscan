"use client";

import { AlertTriangle, KeyRound } from "lucide-react";
import { useActionState } from "react";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { updatePassword, type AuthResult } from "@/lib/auth/actions";

async function action(
  _previous: AuthResult | null,
  formData: FormData,
): Promise<AuthResult> {
  return updatePassword(formData);
}

export function ResetPasswordForm() {
  const [state, formAction, isPending] = useActionState(action, null);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Nouveau mot de passe</CardTitle>
        <CardDescription>Choisis un nouveau mot de passe pour ton compte.</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="flex flex-col gap-4">
          {state && !state.ok && (
            <Alert variant="destructive">
              <AlertTriangle />
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          )}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="password">Nouveau mot de passe</Label>
            <PasswordInput
              id="password"
              name="password"
              autoComplete="new-password"
              minLength={8}
              required
            />
            <p className="text-xs text-muted-foreground">8 caractères minimum.</p>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
            <PasswordInput
              id="confirmPassword"
              name="confirmPassword"
              autoComplete="new-password"
              minLength={8}
              required
            />
          </div>
          <Button type="submit" disabled={isPending}>
            <KeyRound />
            {isPending ? "Enregistrement…" : "Enregistrer le mot de passe"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
