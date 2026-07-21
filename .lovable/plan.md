## Objetivo
Suspender temporariamente **apenas** o botão de envio de validade para o Tiny ERP (ícone `CalendarClock`), sem tocar em nada da API, edge functions, sincronização de estoque ou qualquer outro recurso.

## Escopo (o que muda)
Somente `src/components/BeerList.tsx` — o botão "Enviar validade" nas views desktop e mobile.

## Comportamento novo
- O botão continua **visível** na lista (desktop e mobile), mas:
  - Fica com aparência desabilitada (opacidade reduzida / cursor bloqueado).
  - Ao clicar, **não chama** `onUpdateTinyDescription` nem qualquer função da API.
  - Abre um `AlertDialog` (popup) com a mensagem:
    > **Recurso temporariamente suspenso**
    > O envio de validade para o Tiny ERP está suspenso e em análise pela equipe técnica da Cerveja Lenta Tech para uma nova atualização.
    > Agradecemos a compreensão.
  - Botão único de "Entendi" para fechar.
- Tooltip do ícone passa a mostrar "Recurso suspenso — em análise".
- Selo verde de "OK" (histórico de envios já feitos) **permanece visível** para os lotes que já têm `tiny_description_updated_at`, apenas como registro histórico.

## O que NÃO muda
- Nenhuma alteração em edge functions (`update-tiny-description`, `sync-tiny-stock`, etc.).
- Nenhuma alteração em `useBeers.ts` — a função `updateTinyDescription` continua existindo, apenas não é mais chamada por esse botão.
- Sincronização de estoque com Tiny (add/edit/archive) continua funcionando normalmente.
- Comparativo de estoque, imagens do Tiny, PDF, WhatsApp e demais recursos: intactos.

## Como reativar no futuro
Basta remover o handler que abre o popup e restaurar o `onClick` original — 1 linha em cada view. Sem migrações, sem redeploy de edge function.

## Detalhes técnicos
- Adicionar estado local `suspendedDialogOpen` em `BeerList.tsx`.
- Substituir `onClick` dos dois botões `CalendarClock` (desktop + mobile) por `() => setSuspendedDialogOpen(true)`.
- Adicionar `disabled` visual (`opacity-60 cursor-not-allowed`) — mas sem `disabled` real, para o clique ainda disparar o popup.
- Renderizar um único `<AlertDialog>` no final do componente com a mensagem acima.
