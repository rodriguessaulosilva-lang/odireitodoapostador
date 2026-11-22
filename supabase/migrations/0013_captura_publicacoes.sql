-- Tabela para armazenar publicações capturadas do DJEN
create table public.captura_publicacoes (
  id              uuid primary key default gen_random_uuid(),
  external_id     text not null unique,  -- ID do DJEN para deduplicate
  texto           text not null,
  categoria       publicacao_categoria,
  data_publicacao date not null,
  numero_oab      text not null,  -- OAB 65292
  uf_oab          text not null,  -- GO
  url             text,
  matched_processo_id uuid references public.processos(id) on delete set null,
  foi_importado   boolean not null default false,
  created_at      timestamptz not null default now()
);

create index on public.captura_publicacoes (external_id);
create index on public.captura_publicacoes (data_publicacao);
create index on public.captura_publicacoes (matched_processo_id);
create index on public.captura_publicacoes (foi_importado);
