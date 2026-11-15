"use client";

import { FileText, Upload, X } from "lucide-react";
import { useRef, useState } from "react";

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

export function FileDropzone({ id, name }: { id: string; name: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);

  function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragActive(false);
    const dropped = event.dataTransfer.files;
    if (inputRef.current) {
      inputRef.current.files = dropped;
    }
    setFile(dropped[0] ?? null);
  }

  function handleClear(event: React.MouseEvent) {
    event.stopPropagation();
    setFile(null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => inputRef.current?.click()}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          inputRef.current?.click();
        }
      }}
      onDragOver={(event) => {
        event.preventDefault();
        setDragActive(true);
      }}
      onDragLeave={() => setDragActive(false)}
      onDrop={handleDrop}
      className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 text-center transition-colors ${
        dragActive ? "border-primary bg-primary/5" : "border-input hover:bg-muted/50"
      }`}
    >
      <input
        ref={inputRef}
        id={id}
        name={name}
        type="file"
        accept="application/pdf"
        required
        className="sr-only"
        onChange={(event) => setFile(event.target.files?.[0] ?? null)}
      />
      {file ? (
        <div className="flex items-center gap-2 text-sm">
          <FileText className="size-4 text-muted-foreground" />
          <span className="font-medium">{file.name}</span>
          <span className="text-muted-foreground">({formatSize(file.size)})</span>
          <button
            type="button"
            onClick={handleClear}
            className="rounded p-0.5 text-muted-foreground hover:text-foreground"
            aria-label="Retirer le fichier"
          >
            <X className="size-3.5" />
          </button>
        </div>
      ) : (
        <>
          <Upload className="size-6 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Glissez un PDF ici ou cliquez pour parcourir
          </p>
        </>
      )}
    </div>
  );
}
