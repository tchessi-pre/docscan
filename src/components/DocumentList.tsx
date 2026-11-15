import { Inbox } from "lucide-react";
import Link from "next/link";
import { DeleteDocumentButton } from "@/components/DeleteDocumentButton";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DOC_TYPE_LABELS, STATUS_BADGE_CLASSES, STATUS_LABELS } from "@/lib/documents/labels";
import type { Database } from "@/lib/supabase/database.types";

type DocumentRow = Database["public"]["Tables"]["documents"]["Row"];

export function DocumentList({ documents }: { documents: DocumentRow[] }) {
  if (documents.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-2 py-10 text-center text-muted-foreground">
          <Inbox className="size-8" />
          <p className="text-sm">Aucun document pour l&apos;instant.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Date</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {documents.map((doc) => (
              <TableRow key={doc.id}>
                <TableCell>
                  <Link
                    href={`/documents/${doc.id}`}
                    className="underline underline-offset-2"
                  >
                    {doc.filename}
                  </Link>
                </TableCell>
                <TableCell>{DOC_TYPE_LABELS[doc.doc_type]}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={STATUS_BADGE_CLASSES[doc.status]}>
                    {STATUS_LABELS[doc.status]}
                  </Badge>
                </TableCell>
                <TableCell>{new Date(doc.created_at).toLocaleDateString("fr-FR")}</TableCell>
                <TableCell>
                  <DeleteDocumentButton documentId={doc.id} filename={doc.filename} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
