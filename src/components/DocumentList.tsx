"use client";

import { FileText, Inbox, SearchX } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { DeleteDocumentButton } from "@/components/DeleteDocumentButton";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
type StatusFilter = "all" | DocumentRow["status"];
type TypeFilter = "all" | DocumentRow["doc_type"];

export function DocumentList({ documents }: { documents: DocumentRow[] }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");

  const filtered = documents.filter((doc) => {
    const matchesSearch = doc.filename.toLowerCase().includes(search.trim().toLowerCase());
    const matchesStatus = statusFilter === "all" || doc.status === statusFilter;
    const matchesType = typeFilter === "all" || doc.doc_type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <h2 className="text-sm font-medium">Documents</h2>
        {documents.length > 0 && (
          <Badge variant="secondary" className="text-muted-foreground">
            {documents.length}
          </Badge>
        )}
      </div>
      {documents.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Rechercher un document…"
            className="max-w-xs"
          />
          <Select
            value={statusFilter}
            onValueChange={(value) => setStatusFilter(value as StatusFilter)}
            items={{ all: "Tous les statuts", ...STATUS_LABELS }}
          >
            <SelectTrigger className="w-fit">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              {Object.entries(STATUS_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={typeFilter}
            onValueChange={(value) => setTypeFilter(value as TypeFilter)}
            items={{ all: "Tous les types", ...DOC_TYPE_LABELS }}
          >
            <SelectTrigger className="w-fit">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les types</SelectItem>
              {Object.entries(DOC_TYPE_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      {documents.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
            <span className="flex size-10 items-center justify-center rounded-full bg-muted">
              <Inbox className="size-5 text-muted-foreground" />
            </span>
            <p className="text-sm font-medium">Aucun document pour l&apos;instant</p>
            <p className="text-sm text-muted-foreground">
              Déposez un PDF ci-dessus pour lancer une extraction.
            </p>
          </CardContent>
        </Card>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
            <span className="flex size-10 items-center justify-center rounded-full bg-muted">
              <SearchX className="size-5 text-muted-foreground" />
            </span>
            <p className="text-sm font-medium">Aucun résultat</p>
            <p className="text-sm text-muted-foreground">
              Essayez d&apos;ajuster la recherche ou les filtres.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((doc) => {
                  const TypeIcon = DOC_TYPE_ICONS[doc.doc_type];
                  const StatusIcon = STATUS_ICONS[doc.status];
                  return (
                    <TableRow key={doc.id}>
                      <TableCell className="max-w-[18rem]">
                        <Link
                          href={`/documents/${doc.id}`}
                          className="flex items-center gap-2 font-medium hover:text-primary hover:underline underline-offset-2"
                        >
                          <FileText className="size-3.5 shrink-0 text-muted-foreground" />
                          <span className="truncate">{doc.filename}</span>
                        </Link>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        <span className="inline-flex items-center gap-1.5">
                          <TypeIcon className="size-3.5" />
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
                      <TableCell className="text-muted-foreground">
                        {new Date(doc.created_at).toLocaleDateString("fr-FR")}
                      </TableCell>
                      <TableCell className="text-right">
                        <DeleteDocumentButton documentId={doc.id} filename={doc.filename} />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </section>
  );
}
