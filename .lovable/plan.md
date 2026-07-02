# Adicionar validade na descrição do produto no Olist Tiny

## Objetivo
Nova ação em cada lote (com SKU) que atualiza APENAS a **descrição do produto no Tiny**, adicionando/atualizando a linha de validade. Não altera estoque, não envia lote.

## Comportamento

- Botão de ação em cada linha de `BeerList.tsx` (só habilitado quando o lote tem SKU).
- Ao clicar: chama nova edge function `update-tiny-description` passando `sku` e `expiration_date` do lote.
- Se houver múltiplos lotes ativos com o mesmo SKU, a edge function usa a **validade mais próxima (mais urgente)** entre eles.
- Formato inserido na descrição: `Validade: DD/MM/AAAA` (uma linha).
- Se já existir uma linha "Validade: ..." na descrição, ela é **substituída**. Caso contrário, é **anexada ao final** da descrição existente, preservando o texto atual.
- Feedback via toast (sucesso/erro) e registro em `activity_logs`.

## Arquivos

### Criar
- `supabase/functions/update-tiny-description/index.ts`
  - Recebe `{ sku: string, expirationDate?: string }` (se `expirationDate` não vier, busca no banco a validade mais próxima entre os lotes ativos com esse SKU).
  - Fluxo:
    1. `produtos.pesquisa.php?pesquisa=<sku>` → obtém `id` do produto.
    2. `produto.obter.php?id=<id>` → obtém a `descricao_complementar` (ou `descricao`) atual.
    3. Monta nova descrição: remove regex `/^\s*Validade:.*$/m` e concatena `\nValidade: DD/MM/AAAA`.
    4. `produto.alterar.php` com POST `token` + `produto` (JSON com `id` e `descricao_complementar` atualizada).
  - Trata erros da API Tiny e retorna JSON com status.

### Editar
- `supabase/config.toml` — registrar `[functions.update-tiny-description]` com `verify_jwt = false`.
- `src/hooks/useBeers.ts` — adicionar função `updateTinyDescription(sku, expirationDate)` que invoca a edge function, mostra toast e loga atividade.
- `src/components/BeerList.tsx`:
  - Adicionar prop opcional `onUpdateTinyDescription?: (sku, expirationDate, batchInfo) => Promise<boolean>`.
  - Novo state `updatingDescSkus: Set<string>` (visual de loading).
  - Novo botão de ação na coluna "Ações" (ícone `FileText` ou `CalendarClock` da lucide), com Tooltip "Atualizar validade na descrição do Tiny". Desabilitado se não houver SKU.
- `src/pages/Index.tsx` — passar `onUpdateTinyDescription` para `<BeerList />` conectando ao hook.

## Detalhes técnicos

- Campo escolhido no Tiny: `descricao_complementar` (campo de texto livre exibido no cadastro do produto). Confirmar via chamada real; se o Tiny do usuário não usar esse campo, ajustar para `descricao`.
- A validade é formatada com `date-fns` (`format(parseISO(date), 'dd/MM/yyyy')`).
- Segurança: reutiliza o secret existente `TINY_API_TOKEN`. Não expõe token no cliente.
- Sem alteração de schema/tabelas.