import { DOC_TYPE_LABELS, STATUS_LABELS } from "@/lib/documents/labels";
import type { Database } from "@/lib/supabase/database.types";

type DocumentRow = Database["public"]["Tables"]["documents"]["Row"];

export function DocumentList({ documents }: { documents: DocumentRow[] }) {
  if (documents.length === 0) {
    return <p>Aucun document pour l&apos;instant.</p>;
  }

  return (
    <table>
      <thead>
        <tr>
          <th className="text-left">Nom</th>
          <th className="text-left">Type</th>
          <th className="text-left">Statut</th>
          <th className="text-left">Date</th>
        </tr>
      </thead>
      <tbody>
        {documents.map((doc) => (
          <tr key={doc.id}>
            <td>{doc.filename}</td>
            <td>{DOC_TYPE_LABELS[doc.doc_type]}</td>
            <td>{STATUS_LABELS[doc.status]}</td>
            <td>{new Date(doc.created_at).toLocaleDateString("fr-FR")}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
