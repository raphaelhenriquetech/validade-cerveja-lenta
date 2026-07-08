
# StockBrew — Redesign Emerald + Fix Edição de Lote

## Objetivo
1. Permitir alterar o **código do lote** no diálogo de edição (hoje só quantidade/nome/validade/SKU).
2. Redesign completo com paleta **Emerald Prestige**, tipografia **Space Grotesk + DM Sans** e novo shell de **dashboard com sidebar**.
3. Mobile impecável: sidebar vira drawer, tudo em cards, alvos de toque ≥44px.
4. Não quebrar nada: integrações Tiny (sync estoque, comparar, atualizar descrição/validade), Olist, J3/Tracken, WhatsApp, Resend, PWA, ativity_logs, dark mode.

## Fix da edição de lote

- `BeerList.tsx`: adicionar estado `editLot`, popular ao abrir o dialog, novo `<Input>` "Código do Lote" no `Dialog` de edição, incluir `lot` no payload do `onUpdateBatch`.
- `useBeers.updateBatch`: já aceita `Partial<BeerBatch>`. Confirmar que o log de atividade registra a mudança de `lot` (comparar `oldBatch.lot` vs novo) — se não registrar, adicionar entrada.
- Validação: `lot` obrigatório e trim; bloquear salvar vazio.

## Direção visual

**Paleta Emerald Prestige** (via tokens HSL em `src/index.css`, sem cores hardcoded):
- `--primary`: emerald 160 84% 24% (`#064e3b`)
- `--primary-glow`: 160 55% 32% (`#0d7a5f`)
- `--accent` (dourado): 45 55% 54% (`#c9a84c`)
- `--background` claro: 45 45% 96% (`#f5f0e0` suavizado)
- `--background` escuro: 160 20% 8%
- Status: crítico #b91c1c, atenção #d97706, alerta dourado, ok emerald
- Sombra "elegant" com tinta emerald para cards/hover

**Tipografia** via `@fontsource/space-grotesk` + `@fontsource/dm-sans` importados em `main.tsx`; Tailwind `fontFamily.heading = Space Grotesk`, `fontFamily.sans = DM Sans`. Aplicar `font-heading` em títulos/H1‑H3, DM Sans no corpo. Remover Inter.

**Motion**: `framer-motion` já em uso (se ausente, instalar). Fade+slide nos cards do dashboard, hover-lift nas linhas de tabela, transição suave no sidebar collapse.

## Shell com sidebar (shadcn)

Novo `src/components/layout/AppLayout.tsx` com `SidebarProvider` + `AppSidebar` + `<Outlet/>`. Refatorar `App.tsx` para envolver rotas protegidas nesse layout.

`AppSidebar` (`collapsible="icon"`, drawer no mobile):
- Logo StockBrew no topo (usa `stockbrew-logo-light/dark`).
- Grupo **Estoque**: Home (`/`), Produtos Tiny (`/produtos-tiny`).
- Grupo **Log​ística**: Etiquetas J3 (`/etiquetas-j3`).
- Grupo **Sistema**: Configurações (`/configuracoes`).
- Rodapé do sidebar: usuário logado + botão Sair + `ThemeToggle`.
- `NavLink` com `isActive` destacando em emerald.

Header slim (h-14): `SidebarTrigger` + breadcrumb da rota + ações contextuais da página (ex.: botão "Gerar Relatório" na Home).

```text
┌──────┬──────────────────────────────────────┐
│ Logo │ [☰] Home                    [Report] │
│ ──── ├──────────────────────────────────────┤
│ 🏠   │                                      │
│ 📦   │       Dashboard cards                │
│ 🚚   │       Formulário compacto            │
│ ⚙️   │       Tabela / cards de lotes        │
│      │                                      │
│ ──── │                                      │
│ 👤   │                                      │
└──────┴──────────────────────────────────────┘
```

## Home refeita

- **KPIs no topo (bento)**: 4 cards clicáveis (Vencidos, Crítico ≤7d, ≤15d, ≤30d) + card "OK >30d". Ícone circular, número grande em Space Grotesk, delta sutil. Cliques mantêm o filtro atual.
- **Formulário "Novo Lote"** em card colapsável (aberto por padrão no desktop, fechado no mobile com botão flutuante `+` fixo bottom-right).
- **Lista**:
  - Desktop: tabela com colunas revisadas, linhas com hover-lift, badges menores, ações agrupadas num menu overflow (`⋯`) quando >3 ícones para reduzir ruído. Manter visíveis: editar, sync Tiny, atualizar validade (com bolinha OK persistida), comparar estoque; mover archive/delete para o menu.
  - Mobile: cards já existentes redesenhados — header limpo, chips de status coloridos, ações em row scrollável com labels curtos.
- Tabs "Ativos / Arquivados" viram segmento pill no topo da lista.
- Busca com ícone à esquerda, atalho `⌘K` (nice-to-have, opcional).

## Configurações, Tiny, J3

Mesmo shell + tokens. Sem mudança de lógica. Ajustar apenas:
- Cabeçalho da página unificado (título + descrição + ações à direita).
- Cards com `bg-card`, `border-border`, `shadow-sm`.
- Formulários com espaçamento consistente (`space-y-4`), labels DM Sans, inputs h-11.

## Mobile checklist

- Sidebar vira drawer (shadcn já faz).
- KPIs em 2 colunas no mobile, 5 no desktop.
- Form colapsável + FAB de adicionar.
- Tabelas → cards (já existe, apenas repolir).
- Botões de ação: ícone + label curto, min-h-11.
- Sticky header simples com trigger + título da rota.
- Testar 360px, 414px e 768px.

## Preservar (não mexer na lógica)

- `useBeers`, `useJ3Orders`, `useJ3SellerConfig`, `useActivityLogs`, `useAuth`, `usePWA`.
- Todas as edge functions e chamadas Supabase.
- `ExpirationBadge`, `ReportGenerator`, `pdfGenerator`.
- Rotas atuais (`/`, `/configuracoes`, `/produtos-tiny`, `/etiquetas-j3`, `/auth`, `/install`, `/landing`).
- Comportamento do OK persistido do envio de validade (bolinha verde no ícone).

## Arquivos afetados

**Criar**
- `src/components/layout/AppLayout.tsx`
- `src/components/layout/AppSidebar.tsx`
- `src/components/layout/PageHeader.tsx` (título+ações reutilizável)

**Editar**
- `src/index.css` — tokens Emerald + fontes + sombras
- `tailwind.config.ts` — `fontFamily.heading/sans`
- `src/main.tsx` — imports `@fontsource/space-grotesk`, `@fontsource/dm-sans`
- `src/App.tsx` — rotas protegidas dentro de `AppLayout`
- `src/pages/Index.tsx` — remover header próprio, usar `PageHeader`; refazer grid de KPIs, FAB, tabs pill
- `src/pages/Settings.tsx`, `TinyProducts.tsx`, `J3Orders.tsx` — usar `PageHeader`, remover navegação duplicada
- `src/components/BeerForm.tsx` — versão compacta / colapsável
- `src/components/BeerList.tsx` — **adicionar edição do lote**, menu overflow de ações, repolir mobile cards
- `src/components/ExpirationDashboard.tsx` — novo layout bento dos KPIs
- `src/components/ExpirationBadge.tsx` — usar tokens novos
- `src/components/ThemeToggle.tsx` — ok, só revisar posição no sidebar footer
- `src/components/Footer.tsx` — versão minimal (o layout tem sidebar agora)

**Não tocar**
- `src/integrations/supabase/*`, `supabase/functions/*`, `supabase/config.toml`, `.env`, `supabase/migrations/*`.

## Validação

- Playwright headless em `localhost:8080`: login, editar lote (mudar código), sync Tiny, atualizar validade (ver OK persistir após reload), navegar entre páginas via sidebar, colapsar sidebar, viewport 375/768/1280.
- Verificar dark mode em todas as páginas.
- `bun run build` limpo.
