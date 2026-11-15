import type { DocType } from "./schemas";

const COMMON_RULES = `Règles impératives :
- Ne jamais inventer une information : si elle est absente du document, mets "value" à une chaîne vide "".
- Quand "value" n'est pas vide, renseigne toujours "page" (numéro de page, 1-indexé — jamais 0) et "quote" (courte citation du document qui justifie la valeur) ; sinon laisse "page" à 0 et "quote" à "".
- Mets "confidence" à "low" si l'information est ambiguë ou déduite plutôt que lue directement, "medium" en cas de doute léger, "high" sinon.
- Pour chaque champ, renseigne "key" (identifiant stable en snake_case, ex. "montant_ttc") et "label" (libellé humain en français, ex. "Montant TTC").`;

const SYSTEM_PROMPTS: Record<DocType, string> = {
  quote: `Tu extrais les informations d'un devis.

${COMMON_RULES}

Champs attendus : émetteur, client, numéro, date, validité, montant HT, TVA, montant TTC, conditions de paiement, délai de réalisation, et les lignes principales (désignation, quantité, prix de chaque ligne). Pour chaque ligne, numérote les clés (ex. "ligne_1_designation", "ligne_1_quantite", "ligne_1_prix") et les libellés (ex. "Désignation (ligne 1)").`,
  specification: `Tu extrais les informations d'un cahier des charges.

${COMMON_RULES}

Champs attendus : maître d'ouvrage, objet, date limite de réponse, budget indicatif, contact, et les listes suivantes où chaque élément est un champ à part entière : livrables, exigences techniques clés, normes citées, critères de sélection.`,
  other: `Tu extrais les informations clés d'un document.

${COMMON_RULES}

Champs attendus : titre, auteur ou émetteur, date, un résumé en 3 phrases, 5 points clés (un champ par point), et les dates et montants mentionnés dans le document (un champ par élément trouvé).`,
};

export function getSystemPrompt(docType: DocType): string {
  return SYSTEM_PROMPTS[docType];
}
