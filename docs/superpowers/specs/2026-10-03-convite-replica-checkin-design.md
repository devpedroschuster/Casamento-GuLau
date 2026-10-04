# Réplica do convite: entrada por nome, duas versões e confirmação real

Data: 2026-10-03 · Branch: `worktree-convite-replica` · Continua o spec
`2026-10-03-convite-replica-design.md`. **Este documento substitui a decisão
"Sem backend" daquele spec**: a réplica passa a usar o backend de check-in e
de confirmação que já existe.

## Objetivo

1. A capa passa a pedir o nome do convidado. Só abre o site quem estiver na
   lista; o botão continua se chamando ENTRAR.
2. O site tem duas versões, escolhidas pela lista a que o convidado pertence:
   - primeiro horário = `perfil` `cerimonia_festa_after` (lista do jantar);
   - segundo horário = `perfil` `festa_after` (só festa e After).
3. "Confirmar presença" (tela 7) deixa de ser só uma transição visual e passa a
   gravar a confirmação de cada pessoa do grupo.

## Decisões do Pedro (2026-10-03)

- Até chegar a arte do segundo horário, essa lista vê **a mesma versão do
  primeiro** (provisória, marcada no código).
- Desenho aprovado: campo de nome acima do ENTRAR; nome lembrado no aparelho;
  janela de confirmação com uma linha por pessoa (desmarcar = "não vai"); o
  After não é registrado no site (continua só copiando o Pix); a entrada é
  uma "porta de nome", não proteção forte.

## Fora de escopo

- Nenhuma mudança no Supabase (tabelas, RPC, Edge Functions) nem novo deploy.
  O backend usado é o que já está em produção: `buscar-convite` e
  `confirmar-presenca`.
- Proteção forte das imagens/Pix (servi-los só depois de validar o nome).
- Registrar o After (`confirmou_after`, pagamento) pelo site.
- Recusar a presença do grupo inteiro pela janela de confirmação.
- A arte real do segundo horário (entra depois, preenchendo a versão).
- `/admin` e `/padrinhos` não mudam.

## Fluxo

1. **Capa** (comum às duas versões, porque a versão só é conhecida depois do
   nome). Acima do ENTRAR há um campo de texto.
2. **ENTRAR** (toque ou Enter no campo): chama `buscarConvite(texto)`. A função
   já existente procura o nome, grava `checkin_em` para o grupo todo e devolve
   `{ id, nome_exibicao, perfil, pessoas }`.
3. **Achou**: guarda o convite em memória, grava o texto digitado no
   `localStorage` (`laura-gu:nome-checkin`) e abre o site na versão do
   `perfil`.
4. **Não achou ou erro**: o site continua na capa e mostra a mensagem acima
   do campo.
   - campo vazio (sem chamar o backend): "Digite seu nome";
   - 400 do backend: "Digite pelo menos 2 letras do nome";
   - 404: "Não encontramos esse nome na lista de convidados";
   - 409: "Encontramos mais de uma pessoa com esse nome. Digite o nome completo.";
   - falha de rede ou outro erro: "Não foi possível verificar agora. Tente de novo.".
5. **Confirmar presença** (tela 7): abre a janela de confirmação.
6. **CONFIRMAR** grava e segue a sequência atual (confirmada → After).

## Entrada na capa

- Estrutura: um bloco ancorado em `bottom: 8%`, empilhado de baixo para cima:
  ENTRAR, campo, mensagem de erro. O ENTRAR fica onde está hoje (a mensagem
  nunca o empurra).
- Campo: `type="text"`, `autoComplete="name"`, placeholder "Digite seu nome",
  fonte **16px** (evita o zoom automático do iOS), vidro escuro
  `rgba(20,12,6,.45)`, borda branca de 1px, raio 40px, largura
  `min(78vw, 300px)`, texto branco, placeholder branco a 70%.
- Mensagem de erro: texto branco com sombra escura (contraste sobre a foto),
  `role="alert"`.
- Durante a busca o ENTRAR fica desabilitado (opacidade reduzida). O rótulo
  continua "ENTRAR".
- Valor inicial: se houver nome salvo no aparelho, o campo vem preenchido, sem
  entrar sozinho. Preenchimento feito direto no elemento (campo não
  controlado), sem `setState` em efeito.

## Versões

`src/app/convite-replica/versoes.ts` descreve cada versão como dados:

```ts
export type Imagem = { src: string; largura: number; altura: number; alt: string };

export type TelaConfig = {
  imagem: Imagem;
  classe?: string;                                   // ex.: "rc-abertura"
  luzes?: { luzes: Luz[]; classe: "rc-luz-abertura" | "rc-luz-dress" };
  contagem?: boolean;                                // sobrepõe a contagem ao vivo
  areas?: AreaClicavel[];                            // links invisíveis
  presentes?: boolean;                               // 9 áreas → modal Pix
  confirmar?: boolean;                               // botão de confirmar presença
};

export type Versao = {
  telas: TelaConfig[];
  afterConfirmada: Imagem;
  after: Imagem;
  pixAfter: string;
  presentes: Presente[];
  alvoContagem: string;                              // ISO com fuso
};

export function versaoDoPerfil(perfil: Perfil): Versao;
```

- `VERSAO_PRIMEIRO_HORARIO` reproduz exatamente as 7 telas atuais.
- `VERSAO_SEGUNDO_HORARIO` é, por enquanto, `VERSAO_PRIMEIRO_HORARIO`, com um
  comentário explicando que é provisória até a arte chegar.
- O componente deixa de ter telas fixas: percorre `versao.telas`. O contador
  "n / total" usa `versao.telas.length`.
- `dados.ts` continua guardando os dados brutos (Pix, presentes, áreas,
  luzes); `versoes.ts` só os monta por versão.

## Janela de confirmação

- Abre ao tocar no botão desenhado da tela 7. Mesmo visual do modal do Pix
  (cartão creme, borda dourada), com título "CONFIRMAR PRESENÇA".
- Uma linha por pessoa de `convite.pessoas`, com caixa de seleção. Estado
  inicial: marcada, exceto quem já tinha `confirmou_festa === false`.
- Texto de apoio: "Desmarque quem não vai."
- CONFIRMAR fica desabilitado se ninguém estiver marcado (a janela não serve
  para recusar o grupo inteiro). FECHAR fecha sem gravar.
- Ao confirmar, para cada pessoa chama `confirmarPresenca(id, campos)`, em
  paralelo:
  - marcada → `confirmou_festa: true` e, só se o perfil for
    `cerimonia_festa_after`, `confirmou_cerimonia: true`;
  - desmarcada → os mesmos campos com `false`.
- Sucesso total: atualiza as pessoas em memória com as respostas, fecha a
  janela e inicia a sequência atual (confirmada → After).
- Falha parcial ou total: continua na janela, atualiza em memória quem foi
  gravado e mostra "Não conseguimos salvar a confirmação de <nomes>. Tente
  de novo.". Nunca toca o After.
- Ao reabrir (mesma visita), as marcações refletem o que já foi gravado.

## Estado e arquivos

- `convite-replica.tsx`: ganha `convite: Convite | null` e orquestra capa,
  site, janela e After. Fica magro: a capa e a janela viram componentes.
- `capa-entrada.tsx` (novo): formulário da capa. Props:
  `{ aoEntrar: (convite: Convite) => void }`. Faz a busca, o armazenamento do
  nome e as mensagens de erro.
- `janela-confirmacao.tsx` (novo): props
  `{ pessoas: Pessoa[]; perfil: Perfil; aoGravar: (pessoas: Pessoa[]) => void;
  aoConcluir: () => void; aoFechar: () => void }`.
- `versoes.ts` (novo) e `dados.ts` (mantido).
- `convite-replica.css`: estilos do campo, do erro e da janela (prefixo `.rc-`).
- `src/lib/supabase-functions.ts`: usado como está (`buscarConvite`,
  `confirmarPresenca`, tipos `Convite`, `Pessoa`, `Perfil`).
- Variáveis de ambiente já existentes no deploy:
  `NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

## Limites conhecidos

- **Porta de nome:** as imagens e o Pix são arquivos públicos; quem souber a
  URL consegue vê-los sem passar pela capa.
- **Busca por "contém":** é o comportamento da função existente (mínimo de 2
  letras; mais de um grupo → pede o nome completo). Uma parte única de um nome
  já abre o site. Não muda aqui.
- **Sem recusa pelo site:** quem desmarca todos não consegue gravar; recusas
  de grupo inteiro continuam sendo tratadas fora do site.

## Verificação

1. `npx tsc --noEmit`, `npm run lint` (sem problemas além dos 5 que já existem
   em `origin/main`) e `npm run build`.
2. Servidor falso das duas funções (`buscar-convite`, `confirmar-presenca`) na
   máquina local, com `NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL` apontando para ele,
   para não tocar em dados de produção. Cenários: campo vazio, nome
   curto (400), não encontrado (404), ambíguo (409), falha de rede, perfil
   `cerimonia_festa_after`, perfil `festa_after`, grupo de uma pessoa, grupo de
   três, desmarcar uma pessoa, falha de gravação, reabrir a janela depois de
   gravar.
3. Conferir no navegador (375 px e 1280 px) que depois da entrada as telas, as
   áreas clicáveis e a sequência do After continuam idênticas ao que foi
   verificado antes (mesmas medidas).
4. Teste com o backend real fica para o preview do Vercel, depois do PR.

## Entrega

Commits na branch `worktree-convite-replica`. PR só quando o Pedro pedir.
Nenhuma mudança é publicada nem implantada por conta própria.
