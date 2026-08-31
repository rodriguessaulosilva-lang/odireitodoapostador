-- =====================================================================
-- Seed de feriados 2026 (nacionais + forenses) + recesso forense.
-- Base para o cálculo de prazos em dias úteis. Feriados estaduais (GO)
-- e municipais (Santa Helena de Goiás) podem ser adicionados na tela de
-- administração — o cálculo os considera automaticamente.
-- =====================================================================

insert into public.feriados (data, descricao, ambito) values
  ('2026-01-01','Confraternização Universal','nacional'),
  ('2026-04-21','Tiradentes','nacional'),
  ('2026-05-01','Dia do Trabalho','nacional'),
  ('2026-09-07','Independência do Brasil','nacional'),
  ('2026-10-12','Nossa Senhora Aparecida','nacional'),
  ('2026-11-02','Finados','nacional'),
  ('2026-11-15','Proclamação da República','nacional'),
  ('2026-11-20','Consciência Negra','nacional'),
  ('2026-12-25','Natal','nacional'),
  -- Forenses / pontos facultativos (prazos suspensos no Judiciário)
  ('2026-02-16','Carnaval','forense'),
  ('2026-02-17','Carnaval','forense'),
  ('2026-02-18','Quarta-feira de Cinzas','forense'),
  ('2026-04-03','Sexta-feira Santa','forense'),
  ('2026-06-04','Corpus Christi','forense'),
  ('2026-10-28','Dia do Servidor Público','forense'),
  ('2026-12-24','Véspera de Natal','forense'),
  ('2026-12-31','Véspera de Ano Novo','forense')
on conflict (data) do nothing;

-- Recesso forense (CPC art. 220 — prazos suspensos): 20/12/2026 a 20/01/2027
insert into public.feriados (data, descricao, ambito)
select d::date, 'Recesso forense', 'forense'
from generate_series('2026-12-20'::date, '2027-01-20'::date, interval '1 day') as d
on conflict (data) do nothing;
