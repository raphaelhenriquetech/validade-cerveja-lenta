## Objetivo
Colocar o sistema em **modo somente consulta** em relação ao Tiny ERP: nenhum comando de alteração de estoque será enviado via API. Leituras (comparativo, imagens, listagem de produtos) continuam funcionando normalmente.

## O que será suspenso
1. **Sincronização automática** ao adicionar, editar, arquivar/desarquivar e excluir lotes (`syncStockToTiny` em `src/hooks/useBeers.ts`) — as chamadas passam a não executar nada.
2. **Botão manual "Sincronizar estoque"** na lista (desktop e mobile em `src/components/BeerList.tsx`) — continua visível, mas com aparência desabilitada; ao clicar abre um popup:
   > **Recurso temporariamente suspenso**
   > O envio de estoque para o Tiny ERP está suspenso e em análise pela equipe técnica da Cerveja Lenta Tech.
   Botão único "Entendi".
3. Botão de envio de validade: já está suspenso — segue igual.

## O que NÃO muda
- Nenhuma alteração nas edge functions (`sync-tiny-stock`, `update-tiny-description` permanecem no projeto, apenas deixam de ser chamadas).
- Comparativo de estoque (`compare-tiny-stock`), imagens do Tiny e página de produtos: intactos (são apenas leitura).
- Cadastro, edição, arquivamento e exclusão de lotes no sistema local: continuam funcionando normalmente.
- Relatórios PDF, e-mail, WhatsApp e histórico de atividades: intactos.

## Detalhes técnicos
- Em `useBeers.ts`: adicionar um flag `TINY_STOCK_SYNC_ENABLED = false` no topo; `syncStockToTiny` retorna imediatamente quando desligado (sem invoke, sem toast de erro). Os pontos de chamada permanecem no código.
- Em `BeerList.tsx`: novo estado `stockSuspendedDialogOpen`; o `onClick` dos botões de sync (desktop e mobile) passa a abrir o diálogo; estilo `opacity-60 cursor-not-allowed` e tooltip "Recurso suspenso — em análise".
- Reativação futura: trocar o flag para `true` e restaurar o `onClick` — sem migrações nem redeploy.
