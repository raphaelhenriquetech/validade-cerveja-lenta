

# Revisao Completa da Landing Page - Logo Grande + Mobile Responsivo

## Problemas Identificados

1. **Logo muito pequeno** - Atualmente `h-8` (32px), precisa aumentar ~300%
2. **Responsividade mobile** precisa de revisao geral em todas as secoes

## Alteracoes Planejadas

### 1. Logo no Header
- Aumentar de `h-8` para `h-24` (96px) no desktop e `h-16` (64px) no mobile
- Ajustar padding do header para acomodar o logo maior (`py-4`)

### 2. Hero Section - Mobile
- Reduzir padding vertical no mobile (`py-12 md:py-32`)
- Titulo: `text-3xl md:text-6xl` para melhor leitura no mobile
- Subtitulo: `text-base md:text-xl`
- Botoes empilhados no mobile (ja esta com `flex-col sm:flex-row`)

### 3. Funcionalidades - Mobile
- Grid ja responsivo (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`) - OK
- Reduzir padding da secao no mobile (`py-12 md:py-20`)

### 4. Integracoes - Mobile
- Mudar grid mobile de `grid-cols-2` para `grid-cols-1 sm:grid-cols-2 lg:grid-cols-5`
- Cards com mais espaco interno no mobile

### 5. Depoimentos / Carousel - Mobile
- Reduzir padding lateral (`px-4 md:px-12`)
- Carousel items ocupam 100% no mobile (ja esta `md:basis-1/2`)
- Esconder setas do carousel no mobile e usar swipe
- Alternativa: mostrar setas menores no mobile

### 6. CTA Final - Mobile
- Titulo: `text-2xl md:text-4xl`
- Reduzir padding (`py-12 md:py-20`)

### 7. Secoes gerais
- Reduzir `mb-14` dos headers de secao para `mb-8 md:mb-14`
- Titulos de secao: `text-2xl md:text-4xl`

### Detalhes Tecnicos

**Arquivo editado:** `src/pages/Landing.tsx`

**Resumo das classes Tailwind alteradas:**
- Header logo: `h-8` -> `h-16 md:h-24`
- Header padding: `py-3` -> `py-4`
- Hero: `py-20 md:py-32` -> `py-12 md:py-32`
- H1: `text-4xl md:text-6xl` -> `text-3xl md:text-6xl`
- Secoes: padding e titulos com breakpoints mobile/desktop
- Integracoes grid: `grid-cols-2` -> `grid-cols-1 sm:grid-cols-2`
- Carousel container: `px-12` -> `px-2 md:px-12`
- CTA h2: `text-3xl md:text-4xl` -> `text-2xl md:text-4xl`

