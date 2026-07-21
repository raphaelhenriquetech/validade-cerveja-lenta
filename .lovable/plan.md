# Filtro "Validade enviada ao Tiny"

## Objetivo
Permitir filtrar a listagem para exibir apenas lotes cujo SKU já teve a validade enviada para a descrição no Tiny (campo `tiny_description_updated_at` preenchido), com contador de resultados. Apenas filtro de exibição — nenhuma outra lógica é alterada.

## Mudanças

### `src/components/BeerList.tsx` (único arquivo alterado)
1. Adicionar novo estado local `validadeFilter: 'all' | 'sent' | 'not_sent'` (default `'all'`).
2. Adicionar um controle de filtro ao lado dos filtros/busca existentes (Select ou grupo de botões):
   - "Todos"
   - "Validade enviada" (com ícone OK verde)
   - "Validade pendente"
3. Aplicar o filtro na lista já filtrada por busca/expiração:
   - `sent`: manter apenas lotes com `batch.tiny_description_updated_at` truthy.
   - `not_sent`: manter apenas lotes com `tiny_description_updated_at` nulo/vazio.
   - `all`: sem alteração.
4. Exibir contador ao lado do filtro: `X resultado(s) encontrado(s)` refletindo o total após todos os filtros aplicados (desktop e mobile).
5. Manter o filtro escondido/compacto em mobile via classe responsiva, mas funcional em ambos.

## Não altera
- Hooks (`useBeers.ts`), edge functions, schema do banco, sync com Tiny, envio de validade, badge "OK" nos ícones, nenhuma outra tela.
- Comportamento de qualquer outro filtro existente.

## Validação
- Selecionar "Validade enviada" → lista mostra apenas linhas com badge verde "OK".
- Selecionar "Validade pendente" → lista mostra apenas linhas sem o badge.
- Contador atualiza dinamicamente ao combinar com busca por nome/SKU e filtros de expiração.
