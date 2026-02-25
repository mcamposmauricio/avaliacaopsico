

# Aumentar e Clarear os Textos do Painel Esquerdo

## Objetivo
Tornar os textos do painel esquerdo (headline, subtexto e labels dos nos) maiores, mais claros (maior opacidade/contraste) e com tipografia mais moderna.

## Mudancas em `src/pages/Auth.tsx`

### Headline (linha 89)
- De: `text-4xl xl:text-5xl font-bold tracking-tight`
- Para: `text-5xl xl:text-6xl font-extrabold tracking-tighter` -- texto maior e mais impactante

### Subtexto (linha 94)
- De: `text-sidebar-foreground/40 text-sm font-light`
- Para: `text-sidebar-foreground/60 text-base font-normal` -- maior, mais legivel, opacidade mais alta

### Labels dos nos SVG (linha 168-176)
- `fontSize`: de `"11"` para `"13"`
- `fontWeight`: de `"500"` para `"600"`
- `opacity`: de `"0.6"` para `"0.8"` -- mais visivel e clara
- Adicionar `letterSpacing="0.5"` para um toque mais moderno

### Badges do rodape
- De: `text-[11px]` para `text-xs`
- De: `text-sidebar-foreground/60` para `text-sidebar-foreground/70`

