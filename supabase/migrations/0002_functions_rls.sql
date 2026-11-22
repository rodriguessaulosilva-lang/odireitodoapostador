-- =====================================================================
-- Funções de negócio, RLS e views
-- =====================================================================

-- ---------- DIAS ÚTEIS / PRAZOS ----------
create or replace function public.is_dia_util(d date)
returns boolean language sql stable set search_path = public as $$
  select extract(isodow from d) < 6
     and not exists (select 1 from public.feriados f where f.data = d);
$$;

create or replace function public.proximo_dia_util(d date)
returns date language plpgsql stable set search_path = public as $$
declare r date := d;
begin
  while not public.is_dia_util(r) loop r := r + 1; end loop;
  return r;
end $$;

-- n-ésimo dia útil a partir de "inicio" (inicio conta como dia 1 se for útil)
create or replace function public.nth_dia_util(inicio date, n int)
returns date language plpgsql stable set search_path = public as $$
declare r date := inicio; c int := 0;
begin
  loop
    if public.is_dia_util(r) then c := c + 1; end if;
    exit when c >= n;
    r := r + 1;
  end loop;
  return r;
end $$;

-- Trigger: calcula início da contagem, vencimento (dias úteis) e alerta (3 dias corridos antes)
-- Regra: início no 1º dia útil seguinte à publicação (CPC art. 224); prazo em dias úteis (art. 219).
create or replace function public.calc_prazo()
returns trigger language plpgsql set search_path = public as $$
begin
  if new.data_publicacao is not null and new.dias_prazo is not null then
    new.data_inicio_contagem := public.proximo_dia_util(new.data_publicacao + 1);
    new.data_vencimento      := public.nth_dia_util(new.data_inicio_contagem, new.dias_prazo);
    new.data_alerta          := new.data_vencimento - 3;
  end if;
  return new;
end $$;
create trigger trg_calc_prazo
  before insert or update on public.prazos
  for each row execute function public.calc_prazo();

-- ---------- HELPERS DE VISIBILIDADE ----------
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.profiles
                where id = auth.uid() and role = 'admin' and ativo);
$$;

create or replace function public.can_see_processo(pid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists(
    select 1 from public.processos p
    where p.id = pid and (public.is_admin() or p.tipo_mandato = 'privado_rd')
  );
$$;

create or replace function public.can_see_cliente(cid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists(
    select 1 from public.clientes c
    where c.id = cid and (public.is_admin() or c.escopo = 'escritorio')
  );
$$;

create or replace function public.can_see_honorario(hid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists(
    select 1 from public.honorarios h
    join public.processos p on p.id = h.processo_id
    where h.id = hid and (public.is_admin() or p.tipo_mandato = 'privado_rd')
  );
$$;

create or replace function public.can_see_perfil(pid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists(
    select 1 from public.perfis_sociais s
    where s.id = pid and (public.is_admin() or s.escopo = 'escritorio')
  );
$$;

-- =====================================================================
-- RLS
-- =====================================================================
alter table public.profiles          enable row level security;
alter table public.feriados          enable row level security;
alter table public.clientes          enable row level security;
alter table public.interacoes        enable row level security;
alter table public.processos         enable row level security;
alter table public.andamentos        enable row level security;
alter table public.publicacoes       enable row level security;
alter table public.prazos            enable row level security;
alter table public.audiencias        enable row level security;
alter table public.honorarios        enable row level security;
alter table public.parcelas          enable row level security;
alter table public.tarefas           enable row level security;
alter table public.modelos_peca      enable row level security;
alter table public.pecas             enable row level security;
alter table public.perfis_sociais    enable row level security;
alter table public.conteudos         enable row level security;
alter table public.rotinas_conteudo  enable row level security;
alter table public.campanhas_trafego enable row level security;
alter table public.ideias_conteudo   enable row level security;

-- profiles: todos autenticados leem (para exibir nomes); escrita só admin
create policy profiles_sel on public.profiles for select to authenticated using (true);
create policy profiles_ins on public.profiles for insert to authenticated with check (public.is_admin());
create policy profiles_upd on public.profiles for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy profiles_del on public.profiles for delete to authenticated using (public.is_admin());

-- feriados: leitura geral; escrita admin
create policy feriados_sel on public.feriados for select to authenticated using (true);
create policy feriados_ins on public.feriados for insert to authenticated with check (public.is_admin());
create policy feriados_upd on public.feriados for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy feriados_del on public.feriados for delete to authenticated using (public.is_admin());

-- clientes: admin vê tudo; sócia só escopo escritorio
create policy clientes_sel on public.clientes for select to authenticated using (public.is_admin() or escopo = 'escritorio');
create policy clientes_ins on public.clientes for insert to authenticated with check (public.is_admin() or escopo = 'escritorio');
create policy clientes_upd on public.clientes for update to authenticated using (public.is_admin() or escopo = 'escritorio') with check (public.is_admin() or escopo = 'escritorio');
create policy clientes_del on public.clientes for delete to authenticated using (public.is_admin());

-- interacoes: herdam do cliente
create policy interacoes_sel on public.interacoes for select to authenticated using (public.can_see_cliente(cliente_id));
create policy interacoes_ins on public.interacoes for insert to authenticated with check (public.can_see_cliente(cliente_id));
create policy interacoes_upd on public.interacoes for update to authenticated using (public.can_see_cliente(cliente_id)) with check (public.can_see_cliente(cliente_id));
create policy interacoes_del on public.interacoes for delete to authenticated using (public.can_see_cliente(cliente_id));

-- processos: admin tudo; sócia só privado_rd (e não pode trocar o tipo para fora de rd)
create policy processos_sel on public.processos for select to authenticated using (public.is_admin() or tipo_mandato = 'privado_rd');
create policy processos_ins on public.processos for insert to authenticated with check (public.is_admin() or tipo_mandato = 'privado_rd');
create policy processos_upd on public.processos for update to authenticated using (public.is_admin() or tipo_mandato = 'privado_rd') with check (public.is_admin() or tipo_mandato = 'privado_rd');
create policy processos_del on public.processos for delete to authenticated using (public.is_admin());

-- filhos do processo: herdam a visibilidade
do $$
declare t text;
begin
  foreach t in array array['andamentos','publicacoes','prazos','audiencias','honorarios','pecas'] loop
    execute format('create policy %1$s_sel on public.%1$s for select to authenticated using (public.can_see_processo(processo_id));', t);
    execute format('create policy %1$s_ins on public.%1$s for insert to authenticated with check (public.can_see_processo(processo_id));', t);
    execute format('create policy %1$s_upd on public.%1$s for update to authenticated using (public.can_see_processo(processo_id)) with check (public.can_see_processo(processo_id));', t);
    execute format('create policy %1$s_del on public.%1$s for delete to authenticated using (public.can_see_processo(processo_id));', t);
  end loop;
end $$;

-- parcelas: herdam via honorario -> processo
create policy parcelas_sel on public.parcelas for select to authenticated using (public.can_see_honorario(honorario_id));
create policy parcelas_ins on public.parcelas for insert to authenticated with check (public.can_see_honorario(honorario_id));
create policy parcelas_upd on public.parcelas for update to authenticated using (public.can_see_honorario(honorario_id)) with check (public.can_see_honorario(honorario_id));
create policy parcelas_del on public.parcelas for delete to authenticated using (public.can_see_honorario(honorario_id));

-- tarefas: por/para o usuário (ou admin)
create policy tarefas_sel on public.tarefas for select to authenticated
  using (public.is_admin() or responsavel_id = auth.uid() or criado_por_id = auth.uid());
create policy tarefas_ins on public.tarefas for insert to authenticated
  with check (criado_por_id = auth.uid() or public.is_admin());
create policy tarefas_upd on public.tarefas for update to authenticated
  using (public.is_admin() or responsavel_id = auth.uid() or criado_por_id = auth.uid())
  with check (public.is_admin() or responsavel_id = auth.uid() or criado_por_id = auth.uid());
create policy tarefas_del on public.tarefas for delete to authenticated
  using (public.is_admin() or criado_por_id = auth.uid());

-- modelos_peca: escopo escritorio para ambos; pessoal só admin
create policy modelos_sel on public.modelos_peca for select to authenticated using (public.is_admin() or escopo = 'escritorio');
create policy modelos_ins on public.modelos_peca for insert to authenticated with check (public.is_admin() or escopo = 'escritorio');
create policy modelos_upd on public.modelos_peca for update to authenticated using (public.is_admin() or escopo = 'escritorio') with check (public.is_admin() or escopo = 'escritorio');
create policy modelos_del on public.modelos_peca for delete to authenticated using (public.is_admin());

-- redes: perfis/rotinas/campanhas/ideias por escopo; conteudos herdam do perfil
do $$
declare t text;
begin
  foreach t in array array['perfis_sociais','rotinas_conteudo','campanhas_trafego','ideias_conteudo'] loop
    execute format('create policy %1$s_sel on public.%1$s for select to authenticated using (public.is_admin() or escopo = ''escritorio'');', t);
    execute format('create policy %1$s_ins on public.%1$s for insert to authenticated with check (public.is_admin() or escopo = ''escritorio'');', t);
    execute format('create policy %1$s_upd on public.%1$s for update to authenticated using (public.is_admin() or escopo = ''escritorio'') with check (public.is_admin() or escopo = ''escritorio'');', t);
    execute format('create policy %1$s_del on public.%1$s for delete to authenticated using (public.is_admin());', t);
  end loop;
end $$;

create policy conteudos_sel on public.conteudos for select to authenticated using (public.can_see_perfil(perfil_id));
create policy conteudos_ins on public.conteudos for insert to authenticated with check (public.can_see_perfil(perfil_id));
create policy conteudos_upd on public.conteudos for update to authenticated using (public.can_see_perfil(perfil_id)) with check (public.can_see_perfil(perfil_id));
create policy conteudos_del on public.conteudos for delete to authenticated using (public.can_see_perfil(perfil_id));

-- =====================================================================
-- VIEWS (security_invoker = respeita a RLS de quem consulta)
-- =====================================================================

-- Recebíveis com atraso derivado (base do dashboard financeiro)
create view public.vw_recebiveis with (security_invoker = on) as
select
  pa.id, pa.honorario_id, pa.numero, pa.valor, pa.vencimento, pa.status, pa.data_pagamento,
  h.tipo as honorario_tipo, h.processo_id,
  pr.tipo_mandato, pr.numero_cnj, pr.cliente_id,
  (pa.status = 'pendente' and pa.vencimento < current_date) as atrasado,
  case when pa.status = 'pendente' and pa.vencimento < current_date
       then (current_date - pa.vencimento) else 0 end as dias_atraso
from public.parcelas pa
join public.honorarios h on h.id = pa.honorario_id
join public.processos pr on pr.id = h.processo_id;

-- Prazos abertos com processo (para agenda/alertas)
create view public.vw_prazos_abertos with (security_invoker = on) as
select
  pz.id, pz.processo_id, pz.descricao, pz.dias_prazo,
  pz.data_publicacao, pz.data_inicio_contagem, pz.data_vencimento, pz.data_alerta,
  pz.status, pz.responsavel_id,
  pr.numero_cnj, pr.tipo_mandato, pr.comarca, pr.vara,
  (current_date >= pz.data_alerta and pz.status = 'pendente') as em_alerta,
  (pz.data_vencimento - current_date) as dias_restantes
from public.prazos pz
join public.processos pr on pr.id = pz.processo_id
where pz.status = 'pendente';
