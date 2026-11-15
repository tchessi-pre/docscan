create type doc_status as enum ('uploaded','processing','extracted','validated','failed');
create type doc_type   as enum ('quote','specification','other');

create table documents (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  filename      text not null,
  storage_path  text not null,
  doc_type      doc_type not null,
  status        doc_status not null default 'uploaded',
  error         text,
  created_at    timestamptz not null default now()
);

create table extractions (
  id            uuid primary key default gen_random_uuid(),
  document_id   uuid not null references documents(id) on delete cascade,
  fields        jsonb not null,
  model         text not null,
  input_tokens  int,
  output_tokens int,
  edited        boolean not null default false,
  validated_at  timestamptz,
  created_at    timestamptz not null default now()
);

alter table documents enable row level security;
alter table extractions enable row level security;

create policy "documents_select_own" on documents
  for select using (auth.uid() = user_id);

create policy "documents_insert_own" on documents
  for insert with check (auth.uid() = user_id);

create policy "documents_update_own" on documents
  for update using (auth.uid() = user_id);

create policy "documents_delete_own" on documents
  for delete using (auth.uid() = user_id);

create policy "extractions_select_own" on extractions
  for select using (
    exists (
      select 1 from documents
      where documents.id = extractions.document_id
        and documents.user_id = auth.uid()
    )
  );

create policy "extractions_insert_own" on extractions
  for insert with check (
    exists (
      select 1 from documents
      where documents.id = extractions.document_id
        and documents.user_id = auth.uid()
    )
  );

create policy "extractions_update_own" on extractions
  for update using (
    exists (
      select 1 from documents
      where documents.id = extractions.document_id
        and documents.user_id = auth.uid()
    )
  );

create policy "extractions_delete_own" on extractions
  for delete using (
    exists (
      select 1 from documents
      where documents.id = extractions.document_id
        and documents.user_id = auth.uid()
    )
  );

insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do nothing;

create policy "documents_storage_select_own" on storage.objects
  for select using (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "documents_storage_insert_own" on storage.objects
  for insert with check (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "documents_storage_delete_own" on storage.objects
  for delete using (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
