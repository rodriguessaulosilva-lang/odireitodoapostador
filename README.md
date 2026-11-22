# Rodrigues Dantas Advocacia — Sistema de Gestão

Sistema web de gestão do escritório **Rodrigues Dantas Advocacia Associada**
(Santa Helena de Goiás/GO): gestão processual, financeiro de honorários, CRM,
tarefas e redes sociais — com separação de visibilidade entre os sócios
garantida por **Row Level Security** no banco.

## Stack
- **Next.js 14** (App Router) + TypeScript + Tailwind CSS
- **Supabase** (PostgreSQL + Auth + RLS)
- Deploy alvo: **Vercel**

## Visibilidade (RLS)
- **Saulo** (sócio administrador): acesso total.
- **Ana Laura** (sócia): apenas processos `privado_rd`, o financeiro desses
  processos, tarefas dela e o conteúdo de redes do escritório.
- Processos **dativos** e **pessoais** e o Instagram pessoal são exclusivos do
  Saulo — filtrados no banco, não na tela.

## Rodando localmente
```bash
npm install
cp .env.example .env.local   # e preencha as credenciais do Supabase
npm run dev                  # http://localhost:3000
```

`.env.local` (não versionado):
```
NEXT_PUBLIC_SUPABASE_URL=https://<projeto>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...
```

## Banco de dados
As migrações estão em `supabase/migrations/` (aplicadas em ordem):
- `0001_init` — enums, tabelas, triggers
- `0002_functions_rls` — funções de negócio (dias úteis/prazos), RLS, views
- `0003_seed_feriados` — feriados 2026 + recesso forense
- `0004_harden` — endurecimento de permissões

## Status dos módulos
- [x] Banco + RLS + cálculo de prazos em dias úteis
- [x] Autenticação e proteção de rotas
- [x] Dashboard (prazos, recebíveis, inadimplência, RPVs)
- [x] Gestão processual (lista/kanban, cadastro, andamentos, publicações→prazos, audiências, honorários)
- [ ] Financeiro (dashboard completo e baixa de parcelas)
- [ ] CRM / funil de clientes
- [ ] Tarefas / delegação / peças
- [ ] Redes sociais / tráfego
