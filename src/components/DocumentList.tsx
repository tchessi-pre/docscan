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
import {
  DOC_TYPE_ICONS,
  DOC_TYPE_LABELS,
  STATUS_BADGE_CLASSES,
  STATUS_ICONS,
  STATUS_LABELS,
} from "@/lib/documents/labels";
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
            {documents.map((doc) => {
              const TypeIcon = DOC_TYPE_ICONS[doc.doc_type];
              const StatusIcon = STATUS_ICONS[doc.status];
              return (
                <TableRow key={doc.id}>
                  <TableCell>
                    <Link
                      href={`/documents/${doc.id}`}
                      className="underline underline-offset-2"
                    >
                      {doc.filename}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center gap-1.5">
                      <TypeIcon className="size-3.5 text-muted-foreground" />
                      {DOC_TYPE_LABELS[doc.doc_type]}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={STATUS_BADGE_CLASSES[doc.status]}>
                      <StatusIcon
                        className={`size-3 ${doc.status === "processing" ? "animate-spin" : ""}`}
                      />
                      {STATUS_LABELS[doc.status]}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(doc.created_at).toLocaleDateString("fr-FR")}</TableCell>
                  <TableCell>
                    <DeleteDocumentButton documentId={doc.id} filename={doc.filename} />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
