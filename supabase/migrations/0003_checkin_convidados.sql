-- Check-in individual: marca quando alguém do mesmo convite (grupo) foi
-- encontrado com sucesso na busca pública do site. Coluna aditiva e
-- opcional — não altera nem remove nada do que já existe.
alter table convidados add column checkin_em timestamptz;

comment on column convidados.checkin_em is
  'Gravado pela Edge Function buscar-convite na primeira vez que alguém do mesmo convite (grupo) é encontrado na busca pública. Null = ainda não fez check-in.';
