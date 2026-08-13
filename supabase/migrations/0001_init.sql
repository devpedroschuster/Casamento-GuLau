-- Convite de Casamento Laura & Gu
-- Tabela principal de convidados

create table if not exists convidados (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  nome text not null,
  perfil text not null check (perfil in ('cerimonia_festa_after', 'festa_after')),

  confirmou_cerimonia boolean,
  confirmou_festa boolean,
  confirmou_after boolean,

  status_pagamento_after text not null default 'nao_aplicavel'
    check (status_pagamento_after in ('pendente', 'pago', 'nao_aplicavel')),

  valor_after numeric(10,2),

  criado_em timestamptz not null default now(),
  respondido_em timestamptz
);

create index if not exists idx_convidados_slug on convidados (slug);

-- RLS ligado: ninguém acessa direto pelo client.
-- Toda leitura/escrita passa pelas Edge Functions (service role key),
-- que validam o slug antes de expor ou alterar qualquer registro.
alter table convidados enable row level security;

-- Nenhuma policy criada de propósito = client anon fica totalmente bloqueado.
-- As Edge Functions usam a service role key, que ignora RLS.

comment on table convidados is 'Convidados do casamento Laura & Gu — acesso somente via Edge Functions por slug';
