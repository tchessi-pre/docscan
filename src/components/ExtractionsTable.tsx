"use client";

import { ChevronRight, FileText, Inbox, SearchX } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { cn } from "cn";
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
import type { DocumentExtraction } from "@/lib/documents/extracted-rows";
import {
  CONFIDENCE_BADGE_CLASSES,
  CONFIDENCE_ICONS,
  CONFIDENCE_LABELS,
  DOC_TYPE_LABELS,
  STATUS_BADGE_CLASSES,
  STATUS_ICONS,
  STATUS_LABELS,
} from "@/lib/documents/labels";
import type { Database } from "@/lib/supabase/database.types";

type StatusFilter = "all" | Database["public"]["Enums"]["doc_status"];
type TypeFilter = "all" | Database["public"]["Enums"]["doc_type"];

export function ExtractionsTable({ rows }: { rows: DocumentExtraction[] }) {
  const [collapsed, setCollapsed] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");

  function toggle(documentId: string) {
    setCollapsed((current) =>
      current.includes(documentId)
        ? current.filter((id) => id !== documentId)
        : [...current, documentId],
    );
  }

  if (rows.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
          <span className="flex size-10 items-center justify-center rounded-full bg-muted">
            <Inbox className="size-5 text-muted-foreground" />
          </span>
          <p className="text-sm font-medium">Aucune donnée extraite</p>
          <p className="text-sm text-muted-foreground">
            Analysez un document pour voir ses données apparaître ici.
          </p>
        </CardContent>
      </Card>
    );
  }

  const query = search.trim().toLowerCase();
  const filteredRows = rows.filter(({ document, fields }) => {
    const matchesStatus = statusFilter === "all" || document.status === statusFilter;
    const matchesType = typeFilter === "all" || document.doc_type === typeFilter;
    const matchesSearch =
      query === "" ||
      document.filename.toLowerCase().includes(query) ||
      fields.some(
        (field) =>
          field.label.toLowerCase().includes(query) ||
          (field.value ?? "").toLowerCase().includes(query),
      );
    return matchesStatus && matchesType && matchesSearch;
  });

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Rechercher un document ou un champ…"
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
      {filteredRows.length === 0 ? (
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
              <TableHead className="w-64">Champ</TableHead>
              <TableHead>Valeur</TableHead>
              <TableHead className="w-16">Page</TableHead>
              <TableHead className="w-32">Confiance</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRows.map(({ document, fields }) => {
              const StatusIcon = STATUS_ICONS[document.status];
              const isCollapsed = collapsed.includes(document.id);
              return [
                <TableRow
                  key={document.id}
                  className="cursor-pointer bg-muted/40 hover:bg-muted/60"
                  onClick={() => toggle(document.id)}
                >
                  <TableCell colSpan={4} className="select-none">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <button
                        type="button"
                        aria-expanded={!isCollapsed}
                        aria-label={isCollapsed ? "Déplier" : "Replier"}
                        onClick={(event) => {
                          event.stopPropagation();
                          toggle(document.id);
                        }}
                        className="-ml-1 flex shrink-0 items-center justify-center rounded-sm p-0.5 text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                      >
                        <ChevronRight
                          className={cn(
                            "size-4 transition-transform",
                            !isCollapsed && "rotate-90",
                          )}
                        />
                      </button>
                      <Link
                        href={`/documents/${document.id}`}
                        onClick={(event) => event.stopPropagation()}
                        className="flex items-center gap-2 font-medium underline-offset-2 hover:text-primary hover:underline"
                      >
                        <FileText className="size-3.5 shrink-0 text-muted-foreground" />
                        {document.filename}
                      </Link>
                      <span className="text-muted-foreground">·</span>
                      <span className="text-sm text-muted-foreground">
                        {DOC_TYPE_LABELS[document.doc_type]}
                      </span>
                      <Badge
                        variant="outline"
                        className={STATUS_BADGE_CLASSES[document.status]}
                      >
                        <StatusIcon className="size-3" />
                        {STATUS_LABELS[document.status]}
                      </Badge>
                      <span className="ml-auto text-xs text-muted-foreground">
                        {fields.length} champ{fields.length > 1 ? "s" : ""}
                      </span>
                    </div>
                  </TableCell>
                </TableRow>,
                ...(isCollapsed
                  ? []
                  : fields.length === 0
                    ? [
                      <TableRow key={`${document.id}-empty`}>
                        <TableCell colSpan={4} className="text-muted-foreground italic">
                          Aucune donnée extraite.
                        </TableCell>
                      </TableRow>,
                    ]
                    : fields.map((field, index) => {
                      const ConfidenceIcon = CONFIDENCE_ICONS[field.confidence];
                      return (
                        <TableRow key={`${document.id}-${field.key}-${index}`}>
                          <TableCell className="font-medium">{field.label}</TableCell>
                          <TableCell className="whitespace-normal text-muted-foreground">
                            {field.value}
                          </TableCell>
                          <TableCell className="text-muted-foreground tabular-nums">
                            {field.page ?? "—"}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={CONFIDENCE_BADGE_CLASSES[field.confidence]}
                            >
                              <ConfidenceIcon className="size-3" />
                              {CONFIDENCE_LABELS[field.confidence]}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })),
              ];
            })}
          </TableBody>
        </Table>
        </CardContent>
      </Card>
      )}
    </div>
  );
}
