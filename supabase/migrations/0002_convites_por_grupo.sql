-- Convite de Casamento Laura & Gu
-- Migração para o modelo "1 link único" (estilo i.casei):
-- não existe mais slug individual. A busca é feita digitando o nome
-- (texto normalizado: sem acento, minúsculo, "contém").
--
-- ATENÇÃO: este script derruba a tabela antiga "convidados" (baseada em slug).
-- Só rode se ainda não há confirmações reais em produção que você precise preservar.
-- Se já tiver dados reais, me avise antes de rodar — dá pra migrar em vez de derrubar.

create extension if not exists unaccent;

drop table if exists convidados cascade;

create table convites (
  id uuid primary key default gen_random_uuid(),
  nome_exibicao text not null, -- ex: "Pedro e Aléxia" — só informativo/organização interna
  perfil text not null check (perfil in ('cerimonia_festa_after', 'festa_after')),
  criado_em timestamptz not null default now()
);

create table convidados (
  id uuid primary key default gen_random_uuid(),
  convite_id uuid not null references convites(id) on delete cascade,
  nome text not null, -- ex: "Pedro Schuster" — é o que a pessoa digita pra se achar

  confirmou_cerimonia boolean,
  confirmou_festa boolean,
  confirmou_after boolean,

  status_pagamento_after text not null default 'nao_aplicavel'
    check (status_pagamento_after in ('pendente', 'pago', 'nao_aplicavel')),

  valor_after numeric(10,2),

  respondido_em timestamptz
);

create index idx_convidados_convite_id on convidados (convite_id);

-- Índice funcional para acelerar a busca por nome normalizado (sem acento, minúsculo)
create index idx_convidados_nome_normalizado on convidados (lower(unaccent(nome)));

-- RLS ligado, sem policies: client anon é bloqueado direto na tabela.
-- Toda leitura/escrita passa pelas Edge Functions (service role key).
alter table convites enable row level security;
alter table convidados enable row level security;

comment on table convites is 'Grupos convidados para o casamento Laura & Gu (ex: casal, família)';
comment on table convidados is 'Pessoas dentro de cada convite — cada uma confirma presença individualmente. Acesso somente via Edge Functions, buscando por nome (contém, sem acento).';

-- Função usada pela Edge Function buscar-convite: acha convidados cujo nome
-- (sem acento, minúsculo) contém o termo buscado (já normalizado no client/edge).
create or replace function buscar_convidados_por_nome(termo text)
returns table (convite_id uuid)
language sql
stable
security definer
set search_path = public
as $$
  select distinct c.convite_id
  from convidados c
  where lower(unaccent(c.nome)) ilike '%' || termo || '%';
$$;
