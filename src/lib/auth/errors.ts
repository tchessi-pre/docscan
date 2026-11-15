const MESSAGES: Record<string, string> = {
  "Invalid login credentials": "Email ou mot de passe incorrect.",
  "User already registered": "Un compte existe déjà avec cet email.",
  "Email not confirmed": "Confirme ton adresse email avant de te connecter.",
  "Password should be at least": "Le mot de passe est trop court.",
  "For security purposes": "Trop de tentatives. Réessaie dans quelques instants.",
  "Email rate limit exceeded": "Trop d'emails envoyés. Réessaie dans quelques instants.",
};

// Les messages de Supabase Auth sont en anglais : on les remplace par une
// version française quand on sait les reconnaître, sinon on reste générique.
export function translateAuthError(message: string): string {
  const known = Object.keys(MESSAGES).find((key) => message.includes(key));
  return known ? MESSAGES[known] : "Une erreur est survenue. Réessaie.";
}
