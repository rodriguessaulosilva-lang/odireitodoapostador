-- =====================================================================
-- Rodrigues Dantas Advocacia — Sistema de Gestão
-- Migração inicial: enums, tabelas, funções, RLS, views e seed.
-- PostgreSQL 17 (Supabase). Toda a visibilidade é garantida por RLS.
-- =====================================================================

-- ---------- ENUMS ----------
create type role                 as enum ('admin','socia');
create type tipo_mandato         as enum ('dativo','privado_rd','privado_pessoal');
create type escopo               as enum ('escritorio','pessoal');
create type area_juridica        as enum ('familia','civel','criminal','trabalhista','previdenciario','imobiliario');
create type fase_processual      as enum ('inicial','conhecimento','recursal','execucao_cumprimento','extrajudicial','arquivado');
create type publicacao_categoria as enum ('intimacao','despacho','sentenca','acordao','pauta');
create type prazo_status         as enum ('pendente','cumprido','perdido');
create type audiencia_tipo       as enum ('instrucao','conciliacao','julgamento');
create type audiencia_modalidade as enum ('presencial','virtual');
create type audiencia_status     as enum ('agendada','realizada','adiada','cancelada');
create type funil_etapa          as enum ('contato_inicial','consulta_agendada','consulta_realizada','proposta_enviada','contratado','perdido');
create type cliente_origem       as enum ('indicacao','instagram','tiktok','google','outro');
create type honorario_tipo       as enum ('inicial','parcelado','exito','dativo_rpv');
create type parcela_status       as enum ('pago','pendente');
create type exito_status         as enum ('aguardando','recebido');
create type rpv_status           as enum ('aguardando','sacado');
create type tarefa_tipo          as enum ('prazo_processual','elaborar_peca','diligencia','contato_cliente','audiencia','administrativo');
create type tarefa_prioridade    as enum ('urgente','alta','normal','baixa');
create type tarefa_status        as enum ('pendente','em_andamento','concluida');
create type plataforma_social    as enum ('instagram','tiktok');
create type conteudo_tipo        as enum ('video','reels','stories','carrossel','post_estatico');
create type conteudo_status      as enum ('ideia','roteiro','gravado','editado','agendado','publicado');

-- ---------- UTIL: updated_at ----------
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end $$;

-- =====================================================================
-- FUNDAMENTOS E ACESSO
-- =====================================================================
create table public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  nome       text not null,
  email      text,
  role       role not null default 'socia',
  ativo      boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.feriados (
  id        uuid primary key default gen_random_uuid(),
  data      date not null unique,
  descricao text not null,
  ambito    text not null default 'nacional'  -- nacional | estadual_go | municipal | forense
);

-- cria profile automaticamente ao criar usuário no Auth (papel padrão: socia)
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, nome, email, role)
  values (new.id,
          coalesce(new.raw_user_meta_data->>'nome', split_part(new.email,'@',1)),
          new.email, 'socia')
  on conflict (id) do nothing;
  return new;
end $$;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =====================================================================
-- CRM
-- =====================================================================
create table public.clientes (
  id               uuid primary key default gen_random_uuid(),
  nome_completo    text not null,
  cpf_cnpj         text,
  whatsapp         text,
  email            text,
  endereco         text,
  origem           cliente_origem,
  escopo           escopo not null default 'escritorio',
  is_dativo        boolean not null default false,
  etapa_funil      funil_etapa not null default 'contato_inicial',
  motivo_perda     text,
  data_contratacao date,
  observacoes      text,
  created_by       uuid references public.profiles(id),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index on public.clientes (escopo);
create index on public.clientes (etapa_funil);

create table public.interacoes (
  id         uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references public.clientes(id) on delete cascade,
  data       timestamptz not null default now(),
  tipo       text,   -- ligacao | whatsapp | email | reuniao | outro
  descricao  text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);
create index on public.interacoes (cliente_id);

-- =====================================================================
-- GESTÃO PROCESSUAL
-- =====================================================================
create table public.processos (
  id                       uuid primary key default gen_random_uuid(),
  numero_cnj               text,
  cliente_id               uuid references public.clientes(id),
  tipo_mandato             tipo_mandato not null,
  area                     area_juridica,
  fase                     fase_processual not null default 'inicial',
  comarca                  text,
  vara                     text,
  juiz                     text,
  data_distribuicao        date,
  responsavel_id           uuid references public.profiles(id),
  observacoes_estrategicas text,
  ativo                    boolean not null default true,
  created_by               uuid references public.profiles(id),
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);
create index on public.processos (tipo_mandato);
create index on public.processos (fase);
create index on public.processos (responsavel_id);
create index on public.processos (cliente_id);

create table public.andamentos (
  id         uuid primary key default gen_random_uuid(),
  processo_id uuid not null references public.processos(id) on delete cascade,
  data       date not null default current_date,
  descricao  text not null,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);
create index on public.andamentos (processo_id);

create table public.publicacoes (
  id              uuid primary key default gen_random_uuid(),
  processo_id     uuid not null references public.processos(id) on delete cascade,
  texto           text not null,
  data_publicacao date not null,
  categoria       publicacao_categoria,
  gerou_prazo     boolean not null default false,
  created_by      uuid references public.profiles(id),
  created_at      timestamptz not null default now()
);
create index on public.publicacoes (processo_id);

create table public.prazos (
  id                   uuid primary key default gen_random_uuid(),
  processo_id          uuid not null references public.processos(id) on delete cascade,
  publicacao_id        uuid references public.publicacoes(id) on delete set null,
  descricao            text not null,
  dias_prazo           int not null,
  data_publicacao      date not null,
  data_inicio_contagem date,
  data_vencimento      date,
  data_alerta          date,
  responsavel_id       uuid references public.profiles(id),
  status               prazo_status not null default 'pendente',
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);
create index on public.prazos (processo_id);
create index on public.prazos (data_vencimento);
create index on public.prazos (status);

create table public.audiencias (
  id          uuid primary key default gen_random_uuid(),
  processo_id uuid not null references public.processos(id) on delete cascade,
  data        date not null,
  hora        time,
  tipo        audiencia_tipo,
  modalidade  audiencia_modalidade not null default 'presencial',
  local       text,
  link_video  text,
  checklist   jsonb not null default '[]'::jsonb,   -- [{item, feito}]
  observacoes text,
  status      audiencia_status not null default 'agendada',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index on public.audiencias (processo_id);
create index on public.audiencias (data);

-- =====================================================================
-- FINANCEIRO
-- =====================================================================
create table public.honorarios (
  id                    uuid primary key default gen_random_uuid(),
  processo_id           uuid not null references public.processos(id) on delete cascade,
  tipo                  honorario_tipo not null,
  valor_total           numeric(12,2) not null default 0,
  valor_recebido        numeric(12,2) not null default 0,
  num_parcelas          int,
  percentual_exito      numeric(5,2),
  base_calculo_estimada numeric(12,2),
  valor_projetado       numeric(12,2),
  status_exito          exito_status,
  data_expedicao_rpv    date,
  status_rpv            rpv_status,
  observacoes           text,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);
create index on public.honorarios (processo_id);
create index on public.honorarios (tipo);

create table public.parcelas (
  id             uuid primary key default gen_random_uuid(),
  honorario_id   uuid not null references public.honorarios(id) on delete cascade,
  numero         int not null default 1,
  valor          numeric(12,2) not null,
  vencimento     date not null,
  status         parcela_status not null default 'pendente',
  data_pagamento date,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index on public.parcelas (honorario_id);
create index on public.parcelas (vencimento);
create index on public.parcelas (status);

-- =====================================================================
-- TAREFAS E PEÇAS
-- =====================================================================
create table public.tarefas (
  id             uuid primary key default gen_random_uuid(),
  titulo         text not null,
  descricao      text,
  processo_id    uuid references public.processos(id) on delete set null,
  tipo           tarefa_tipo not null default 'administrativo',
  responsavel_id uuid references public.profiles(id),
  criado_por_id  uuid references public.profiles(id),
  prazo          date,
  prioridade     tarefa_prioridade not null default 'normal',
  status         tarefa_status not null default 'pendente',
  concluida_em   timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index on public.tarefas (responsavel_id);
create index on public.tarefas (criado_por_id);
create index on public.tarefas (status);

create table public.modelos_peca (
  id         uuid primary key default gen_random_uuid(),
  nome       text not null,
  area       area_juridica,
  tipo       text,
  conteudo   text not null,           -- modelo com {{variaveis}}
  escopo     escopo not null default 'escritorio',
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.pecas (
  id              uuid primary key default gen_random_uuid(),
  processo_id     uuid not null references public.processos(id) on delete cascade,
  modelo_id       uuid references public.modelos_peca(id) on delete set null,
  titulo          text not null,
  conteudo_gerado text,
  arquivo_url     text,
  created_by      uuid references public.profiles(id),
  created_at      timestamptz not null default now()
);
create index on public.pecas (processo_id);

-- =====================================================================
-- REDES SOCIAIS
-- =====================================================================
create table public.perfis_sociais (
  id         uuid primary key default gen_random_uuid(),
  plataforma plataforma_social not null,
  handle     text not null,
  escopo     escopo not null default 'escritorio',
  ativo      boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.conteudos (
  id              uuid primary key default gen_random_uuid(),
  perfil_id       uuid not null references public.perfis_sociais(id) on delete cascade,
  titulo          text not null,
  tipo            conteudo_tipo not null default 'post_estatico',
  status          conteudo_status not null default 'ideia',
  data_planejada  date,
  data_publicacao date,
  pauta_roteiro   text,
  area_tema       area_juridica,
  created_by      uuid references public.profiles(id),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index on public.conteudos (perfil_id);
create index on public.conteudos (data_planejada);

create table public.rotinas_conteudo (
  id            uuid primary key default gen_random_uuid(),
  titulo        text not null,
  tipo_conteudo conteudo_tipo,
  dia_semana    int check (dia_semana between 0 and 6),
  hora          time,
  escopo        escopo not null default 'escritorio',
  ativo         boolean not null default true,
  created_at    timestamptz not null default now()
);

create table public.campanhas_trafego (
  id             uuid primary key default gen_random_uuid(),
  nome           text not null,
  perfil_id      uuid references public.perfis_sociais(id) on delete set null,
  objetivo       text,
  verba          numeric(12,2),
  periodo_inicio date,
  periodo_fim    date,
  alcance        int,
  leads          int,
  custo_por_lead numeric(12,2) generated always as
                   (case when leads is not null and leads > 0 then verba / leads else null end) stored,
  resultado_obs  text,
  escopo         escopo not null default 'escritorio',
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create table public.ideias_conteudo (
  id         uuid primary key default gen_random_uuid(),
  area       area_juridica,
  tema       text not null,
  descricao  text,
  usado      boolean not null default false,
  escopo     escopo not null default 'escritorio',
  created_at timestamptz not null default now()
);

-- ---------- Triggers de updated_at ----------
create trigger t_upd before update on public.clientes          for each row execute function public.touch_updated_at();
create trigger t_upd before update on public.processos         for each row execute function public.touch_updated_at();
create trigger t_upd before update on public.prazos            for each row execute function public.touch_updated_at();
create trigger t_upd before update on public.audiencias        for each row execute function public.touch_updated_at();
create trigger t_upd before update on public.honorarios        for each row execute function public.touch_updated_at();
create trigger t_upd before update on public.parcelas          for each row execute function public.touch_updated_at();
create trigger t_upd before update on public.tarefas           for each row execute function public.touch_updated_at();
create trigger t_upd before update on public.modelos_peca      for each row execute function public.touch_updated_at();
create trigger t_upd before update on public.conteudos         for each row execute function public.touch_updated_at();
create trigger t_upd before update on public.campanhas_trafego for each row execute function public.touch_updated_at();
