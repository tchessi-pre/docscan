alter table extractions
  add column type_mismatch boolean not null default false,
  add column type_mismatch_reason text;
