"use client";

import { AlertTriangle, UserPlus } from "lucide-react";
import Link from "next/link";
import { useActionState } from "react";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signUp, type AuthResult } from "@/lib/auth/actions";

async function action(
  _previous: AuthResult | null,
  formData: FormData,
): Promise<AuthResult> {
  return signUp(formData);
}

export function SignupForm() {
  const [state, formAction, isPending] = useActionState(action, null);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Créer un compte</CardTitle>
        <CardDescription>Une adresse email et un mot de passe suffisent.</CardDescription>
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
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" autoComplete="email" required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="password">Mot de passe</Label>
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
            <UserPlus />
            {isPending ? "Création…" : "Créer mon compte"}
          </Button>
        </form>
        <p className="pt-4 text-center text-sm text-muted-foreground">
          Déjà inscrit ?{" "}
          <Link href="/login" className="text-foreground underline underline-offset-4">
            Se connecter
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
