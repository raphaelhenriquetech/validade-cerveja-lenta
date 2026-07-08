# Miniatura do produto na listagem via Tiny

## Objetivo

Ao lado do nome de cada lote, exibir uma **miniatura da foto principal do produto** buscada do Tiny pelo SKU. Pequena (~40x40), nítida, com fallback quando o SKU não tem imagem cadastrada.

## Como vai funcionar

```text
Card do lote  ┌────────────────────────────────────────┐
              │ [🖼️ 40x40]  IPA Session 350ml          │
              │  nítida     Lote L2508 • 24 un         │
              │  arred.     Val. 12/08/2026            │
              └────────────────────────────────────────┘
```

Fluxo de dados:

```text
BeerList renderiza
      │
      ▼
Para cada SKU único da lista:
   consulta cache local (tabela tiny_product_cache)
      │
      ├─ Tem e fresco (< 7 dias) ──► usa image_url direto
      │
      └─ Não tem OU expirou
             │
             ▼
       invoca edge function get-tiny-product-image({ sku })
             │
             ├─ produtos.pesquisa.php?pesquisa=SKU  → id
             ├─ produto.obter.php?id=X              → anexos[0].anexo
             │
             ▼
       upsert em tiny_product_cache (sku, image_url, fetched_at)
             │
             ▼
       retorna URL, front atualiza o card
```

## Detalhes técnicos

### Backend

**Nova tabela `tiny_product_cache`** (uma linha por SKU — evita re-baixar por lote):
- `sku` (PK), `image_url` (texto), `product_name`, `tiny_product_id`, `fetched_at`, `not_found` (bool, para não ficar retentando SKUs sem imagem).
- RLS: leitura para `authenticated`, escrita apenas `service_role` (a edge function faz o upsert).

**Nova edge function `get-tiny-product-image`**:
- Aceita `{ skus: string[] }` (batch — busca várias miniaturas de uma vez, uma requisição do frontend por render).
- Para cada SKU: chama `produtos.pesquisa.php?pesquisa=SKU`, pega `id` do primeiro match, chama `produto.obter.php?id=…`, extrai `anexos[0].anexo` (URL da imagem principal).
- Usa **exponential backoff** para o erro `6` (rate limit) do Tiny, mesmo padrão de `compare-tiny-stock`.
- Upsert no cache, inclusive `not_found = true` quando o SKU não retorna anexos.
- Retorna `{ [sku]: { image_url, product_name } | null }`.

### Frontend

**Novo hook `useTinyImages(skus: string[])`**:
- Lê `tiny_product_cache` no primeiro render, devolve `Record<sku, imageUrl>`.
- Para SKUs faltantes ou com cache > 7 dias, chama `get-tiny-product-image` uma vez (dedup por render), atualiza estado.
- Expõe `refetchImage(sku)` para o botão "Atualizar imagem".

**`BeerList.tsx` (desktop + mobile)**:
- Nova coluna/elemento à esquerda do nome: `<img>` 40x40, `rounded-lg object-cover`, `loading="lazy"`, `decoding="async"`.
- Fallback: quando `image_url` é `null`, mostra ícone de cerveja emerald sobre um quadrado `bg-muted` do mesmo tamanho (mantém alinhamento).
- Skeleton pulsante enquanto `useTinyImages` está carregando.
- Botão "Atualizar imagem" dentro do menu de ações do lote (dispara `refetchImage`).

**Nitidez sem peso**:
- O Tiny devolve URLs grandes; usamos `<img>` direto com `width={40} height={40}` — o navegador redimensiona sem baixar cópia menor, mas para 40px a foto fica bem nítida em telas retina.
- `object-cover` centraliza. Sem processamento no servidor — mantém o design leve.

## Arquivos

**Migração**
- Cria `public.tiny_product_cache` com GRANT + RLS conforme padrão.

**Backend**
- `supabase/functions/get-tiny-product-image/index.ts` (novo).

**Frontend**
- `src/hooks/useTinyImages.ts` (novo).
- `src/components/BeerList.tsx`: thumbnail + skeleton + item de menu "Atualizar imagem".
- `src/components/BeerBatchThumb.tsx` (pequeno componente reutilizável para thumbnail + fallback).

## Validação

1. Abrir a Home com lotes que têm SKU → miniaturas aparecem em <2s (primeira vez) e instantâneas nas próximas visitas (cache).
2. SKU sem imagem no Tiny → mostra o fallback com ícone, sem quebrar.
3. Menu do lote → "Atualizar imagem" → força novo fetch e a imagem é substituída.
4. Rate limit do Tiny → função retenta com backoff, sem erro na UI.
5. Mobile (cards) → miniatura no canto superior esquerdo do card, mantém legibilidade do texto.
