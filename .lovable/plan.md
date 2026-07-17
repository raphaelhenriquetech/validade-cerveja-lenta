
## Problema

Ao atualizar a validade via `update-tiny-description`, a função chama `produto.alterar.php` reenviando **apenas alguns campos** (id, codigo, nome, unidade, preco, origem, situacao, tipo, descricao_complementar). A API do Tiny trata `produto.alterar.php` como **substituição do anúncio**: campos não enviados (GTIN/EAN, NCM, peso, dimensões, marca, categoria, fornecedor, descrição principal, etc.) são apagados / zerados.

Resultado: SKUs que receberam envio de validade perderam EAN e NCM.

## Correção (prioridade alta)

Refazer o payload de `supabase/functions/update-tiny-description/index.ts` para **preservar 100% do anúncio** e mudar somente `descricao_complementar`:

1. Após `produto.obter.php`, capturar o objeto `produto` completo retornado.
2. Montar o payload de alteração fazendo **spread do produto original inteiro** e sobrescrever apenas `descricao_complementar` (mantendo `id` e `sequencia: 1`).
3. Remover campos que o Tiny devolve mas não aceita em alterar (ex.: `data_criacao`, `preco_custo_medio`, blocos read-only). Manter EAN (`gtin`), `gtin_embalagem`, `ncm`, `origem`, `peso_liquido`, `peso_bruto`, `altura`, `largura`, `comprimento`, `marca`, `categoria`, `unidade_por_caixa`, `descricao_complementar` limpo/atualizado, `anexos`, `variacoes`, `fornecedores`, etc., exatamente como vieram.
4. Logar o payload final (mascarando token) para auditoria antes do redeploy.
5. Testar em 1 SKU não crítico antes de liberar em massa: enviar validade, depois consultar `produto.obter.php` e conferir que `gtin` e `ncm` continuam iguais.

### Salvaguarda adicional

- Antes de chamar `produto.alterar.php`, validar que `produto.gtin` e `produto.ncm` estão presentes no objeto que será enviado. Se qualquer um estiver vazio no retorno do `obter`, **abortar** com erro claro ("Anúncio sem GTIN/NCM — atualização bloqueada para evitar perda de dados") em vez de enviar.
- Comentário no código deixando explícito que `produto.alterar.php` é destrutivo e nunca deve ser chamado com payload parcial.

## Segundo ponto — recuperar EAN/NCM já apagados

Resposta direta: **a API do Tiny não tem endpoint público de histórico/rollback de anúncio**. Uma vez que `produto.alterar.php` sobrescreveu o registro, o valor anterior não é exposto via API.

Opções reais para recuperar:

1. **Interface web do Tiny** — em alguns planos existe "Histórico de alterações" na tela do produto (aba de auditoria). Se o seu plano tiver, dá para ver o valor anterior de GTIN/NCM manualmente por SKU e recadastrar. Vale abrir 1 produto afetado e conferir se essa aba aparece.
2. **Suporte Tiny/Olist** — abrir chamado pedindo restauração dos campos a partir de backup interno deles. Já aconteceu de restaurarem, mas depende de janela de retenção.
3. **Fontes externas** — se você tem planilha de cadastro, export anterior, XML de nota de entrada, catálogo do fornecedor, ou o EAN impresso na embalagem, dá para repopular. Posso montar um utilitário no Stock Brew que, dado um CSV `sku,gtin,ncm`, chama `produto.alterar.php` **preservando o restante** e regrava esses dois campos em lote.

Recomendo: (a) corrigir a função agora para parar o sangramento; (b) listar quais SKUs receberam envio de validade após a data em que a função entrou em produção (temos `tiny_description_updated_at` no banco) para saber exatamente o universo afetado; (c) decidir entre suporte Tiny e reimport via CSV.

## Detalhes técnicos

- Arquivo único alterado: `supabase/functions/update-tiny-description/index.ts`.
- Nenhuma mudança de schema, front-end ou outras funções.
- Deploy da função após alteração; teste com 1 SKU de controle antes de liberar uso normal.
- Posso, em seguida, gerar uma query listando os SKUs afetados (via `beer_batches.tiny_description_updated_at is not null`) para você cruzar com o Tiny e dimensionar o estrago.
