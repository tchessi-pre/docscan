"use client";

import { AlertTriangle, LogIn } from "lucide-react";
import Link from "next/link";
import { useActionState } from "react";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signIn, type AuthResult } from "@/lib/auth/actions";

async function action(
  _previous: AuthResult | null,
  formData: FormData,
): Promise<AuthResult> {
  return signIn(formData);
}

export function LoginForm({ redirectTo }: { redirectTo: string }) {
  const [state, formAction, isPending] = useActionState(action, null);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Connexion</CardTitle>
        <CardDescription>Accède à tes documents DocScan.</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="flex flex-col gap-4">
          <input type="hidden" name="redirectTo" value={redirectTo} />
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
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Mot de passe</Label>
              <Link
                href="/forgot-password"
                className="text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                Mot de passe oublié ?
              </Link>
            </div>
            <PasswordInput
              id="password"
              name="password"
              autoComplete="current-password"
              required
            />
          </div>
          <Button type="submit" disabled={isPending}>
            <LogIn />
            {isPending ? "Connexion…" : "Se connecter"}
          </Button>
        </form>
        <p className="pt-4 text-center text-sm text-muted-foreground">
          Pas encore de compte ?{" "}
          <Link href="/signup" className="text-foreground underline underline-offset-4">
            Créer un compte
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
