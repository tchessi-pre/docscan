import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DOC_TYPE_LABELS, STATUS_LABELS } from "@/lib/documents/labels";
import type { Database } from "@/lib/supabase/database.types";

type DocumentRow = Database["public"]["Tables"]["documents"]["Row"];

export function DocumentList({ documents }: { documents: DocumentRow[] }) {
  if (documents.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">Aucun document pour l&apos;instant.</p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nom</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Statut</TableHead>
          <TableHead>Date</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {documents.map((doc) => (
          <TableRow key={doc.id}>
            <TableCell>
              <Link href={`/documents/${doc.id}`} className="underline underline-offset-2">
                {doc.filename}
              </Link>
            </TableCell>
            <TableCell>{DOC_TYPE_LABELS[doc.doc_type]}</TableCell>
            <TableCell>{STATUS_LABELS[doc.status]}</TableCell>
            <TableCell>{new Date(doc.created_at).toLocaleDateString("fr-FR")}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
