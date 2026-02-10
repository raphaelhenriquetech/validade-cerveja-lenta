

# Landing Page de Vendas - StockBrew

## Objetivo
Criar uma landing page de vendas moderna, responsiva e com suporte a dark mode, acessivel na rota `/landing`, sem autenticacao necessaria.

## Estrutura da Pagina

### Secoes da Landing Page

1. **Hero** - Logo StockBrew, titulo impactante, subtitulo com proposta de valor, botao CTA ("Comece Agora" -> /auth), badge "PWA - Instale no celular"
2. **Funcionalidades** - Grid de cards com icones (Lucide) destacando as 6 principais funcoes: Controle de Validade, Dashboard em Tempo Real, Relatorios Automaticos, Etiquetas J3/Tracken, Consulta de CEP, Historico de Atividades
3. **Integracoes** - Secao visual com logos/icones das integracoes: Tiny ERP, J3/Tracken, WhatsApp, Email (Resend), PWA
4. **Beneficios** - Lista com icones de check: Reducao de perdas, Automacao de processos, Controle centralizado, Acesso mobile
5. **Depoimentos** - Carousel (Embla) com depoimentos fictcios de clientes satisfeitos
6. **CTA Final** - Secao de conversao com gradiente, titulo forte e botao para cadastro

### Detalhes Tecnicos

**Arquivos a criar:**
- `src/pages/Landing.tsx` - Pagina completa da landing page com todas as secoes

**Arquivos a editar:**
- `src/App.tsx` - Adicionar rota `/landing` como rota publica (sem ProtectedRoute)

**Componentes reutilizados:**
- `Button` (shadcn/ui) - CTAs
- `Card` (shadcn/ui) - Cards de funcionalidades
- `Badge` (shadcn/ui) - Tags e destaques
- `Carousel` (Embla) - Depoimentos
- `ThemeToggle` - Alternancia de tema no header da landing
- Logos existentes: `stockbrew-logo-light.png`, `stockbrew-logo-dark.png`

**Design:**
- Cores do design system existente (primary roxo, accent azul, status colors)
- Background `bg-[#F8FAFC]` / `dark:bg-[#18181B]` conforme padrao
- Animacoes `animate-fade-in`, `hover-lift` ja existentes no CSS
- Font `Inter` / `Manrope` para display
- Secoes alternando backgrounds claros/escuros para contraste
- Totalmente responsivo (mobile-first)
- Suporte completo a dark mode

**Rota:**
- `/landing` - publica, sem autenticacao
- Botoes CTA redirecionam para `/auth`

