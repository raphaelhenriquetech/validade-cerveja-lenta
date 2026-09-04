# Multiempresa no StockBrew (Na Caixa Cestaria)

Objetivo: usar o mesmo sistema com uma segunda empresa (Na Caixa Cestaria) com dados totalmente isolados, sem alterar nada do que já funciona para a Cerveja Lenta, e com caminho pronto para cadastrar novas empresas depois.

## Como vai funcionar

- Cada empresa tem nome, logo e cor de destaque próprios.
- Cada usuário é vinculado a uma empresa. Ao logar, ele só vê os lotes, o dashboard, os relatórios e o histórico da própria empresa.
- Os 303 lotes existentes passam a pertencer à Cerveja Lenta. Nada é apagado, movido ou renomeado.
- Após o login, o topo do sistema mostra o logo e o nome da empresa do usuário, e o avatar do perfil usa esse mesmo logo.
- A nova empresa usa apenas o controle de lotes e validades (sem Tiny ERP, sem e-mail e sem WhatsApp) — as integrações continuam exclusivas da Cerveja Lenta.
- Para adicionar uma terceira empresa no futuro: cadastrar a empresa (nome + logo) e vincular os usuários dela. Nenhuma mudança de código será necessária.

## O que não muda

- Nenhuma tela, regra ou automação atual é alterada em comportamento.
- O relatório diário automático (8h e 15h) e a função pública `vencimentos` consumida pelo n8n continuam retornando exatamente os dados da Cerveja Lenta.
- Os botões suspensos de estoque/validade permanecem como estão.
- Nenhuma tabela de configuração de integrações (Tiny, e-mail, WhatsApp, J3) é modificada.

## Detalhes técnicos

Banco (uma migração aditiva):
- `companies`: `id`, `name`, `slug`, `logo_url`, `accent_color`, timestamps. Insere Cerveja Lenta (empresa padrão) e Na Caixa Cestaria.
- `company_members`: `user_id`, `company_id`, `role`, único por par. Define o acesso.
- Função `has_company_access(_user_id, _company_id)` e `current_company_id(_user_id)` como `security definer` / `stable`, evitando recursão em RLS.
- `company_id uuid` adicionado a `beer_batches` e `activity_logs`, com backfill para a Cerveja Lenta e depois `NOT NULL` + default via trigger a partir da empresa do usuário autenticado.
- RLS atualizada nessas duas tabelas: leitura/escrita apenas quando `has_company_access(auth.uid(), company_id)`. GRANTs mantidos para `authenticated` e `service_role`.
- `companies`: leitura para membros; `company_members`: cada usuário lê seus próprios vínculos.

Funções de servidor:
- `vencimentos` e `send-expiration-report` / `send-whatsapp-report` passam a filtrar explicitamente pelo `company_id` da Cerveja Lenta, garantindo saída idêntica à atual.

Frontend:
- Novo `useCompany()` (contexto) que carrega a empresa do usuário logado a partir de `company_members` e expõe `companyId`, `name`, `logoUrl`.
- `useBeers` e `useActivityLogs` passam a enviar `company_id` nos inserts e a filtrar por ele nas consultas (a RLS já garante o isolamento; o filtro deixa as queries explícitas).
- `AppLayout`: logo + nome da empresa no topo (desktop e mobile) e logo no avatar do menu de perfil; fallback para o logo StockBrew quando a empresa não tem imagem.
- Logo da Na Caixa Cestaria publicado como asset (`lovable-assets`) e gravado em `companies.logo_url`.
- Se um usuário pertencer a mais de uma empresa, o menu de perfil mostra um seletor de empresa; com uma só empresa, nada aparece.

Após a migração, criar o usuário da Na Caixa Cestaria e vinculá-lo à nova empresa.
