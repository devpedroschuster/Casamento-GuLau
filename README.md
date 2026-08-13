# Convite de Casamento — Laura & Gu

Projeto standalone (fora do Nexofy) para convite digital com confirmação de
presença por etapa e QR Code Pix para o after.

## 1. Configurar o Supabase

1. No projeto Supabase novo, rode a migration:
   ```
   supabase db push
   ```
   ou cole o conteúdo de `supabase/migrations/0001_init.sql` no SQL Editor do painel.

2. Faça o deploy das Edge Functions:
   ```
   supabase functions deploy get-convidado
   supabase functions deploy confirmar-presenca
   ```

3. Configure os secrets das functions (não vão no `.env` do Next):
   ```
   supabase secrets set SUPABASE_URL=https://<project-ref>.supabase.co
   supabase secrets set SUPABASE_SERVICE_ROLE_KEY=<sua service role key>
   ```

## 2. Configurar o Next.js

Copie `.env.example` para `.env.local` e preencha:
- `NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL` → `https://<project-ref>.supabase.co/functions/v1`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` → chave anon do projeto
- `NEXT_PUBLIC_PIX_KEY`, `NEXT_PUBLIC_PIX_NOME`, `NEXT_PUBLIC_PIX_CIDADE` → dados do Pix
- `NEXT_PUBLIC_VALOR_AFTER_PADRAO` → valor cobrado por pessoa no after (ex: `80.00`)

```
npm install
npm run dev
```

## 3. Importar convidados em massa

Monte um CSV `convidados.csv`:
```csv
nome,perfil
João Silva,cerimonia_festa_after
Maria Souza,festa_after
```

Rode:
```
SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... SITE_URL=https://seu-dominio.com \
npm run importar-convidados -- convidados.csv
```

Isso insere todos no banco e gera `convidados-links.csv` com nome + slug + link
pronto para disparar manualmente (WhatsApp, e-mail etc).

## 4. Deploy

Recomendado: Vercel.
```
vercel
```
Configure as mesmas env vars do `.env.local` no painel da Vercel.

## Estrutura

- `src/app/convite/[slug]/` — página do convite, personalizada por convidado
- `src/lib/supabase-functions.ts` — client para chamar as Edge Functions
- `src/lib/pix.ts` — geração do payload Pix (BR Code) + QR Code
- `supabase/functions/get-convidado` — busca convidado por slug
- `supabase/functions/confirmar-presenca` — grava confirmação, valida etapas por perfil
- `supabase/migrations/0001_init.sql` — schema da tabela `convidados`
- `scripts/importar-convidados.mjs` — import em massa via CSV

## Segurança

RLS está ativado na tabela `convidados` sem nenhuma policy — o client anon não
acessa a tabela diretamente. Toda leitura/escrita passa pelas Edge Functions
(que usam a service role key), e a function `confirmar-presenca` só grava as
etapas permitidas pelo perfil do convidado, mesmo que o payload enviado tente
forçar outra coisa.
