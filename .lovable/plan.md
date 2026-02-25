

# Redesign do Painel Esquerdo - Visual Organico e Moderno

## Conceito

Substituir o layout retangular/formal atual por um design com elementos visuais organicos e decorativos usando formas SVG abstratas, circulos flutuantes com blur, e uma apresentacao mais "hero" da proposta de valor -- sem cards retangulares empilhadas.

## Nova Estrutura Visual

O painel esquerdo tera tres camadas visuais sobrepostas:

1. **Fundo**: Gradiente radial profundo (azul escuro para azul medio) + circulos decorativos desfocados (orbs) flutuando com animacao sutil de pulso
2. **Centro**: Uma ilustracao abstrata feita com SVG inline -- circulos concentricos conectados por linhas curvas representando "conexao entre pessoas e dados", com icones posicionados em nos do grafo
3. **Texto**: Headline grande e ousada ("Cuide das suas pessoas.") + subtexto leve, posicionados sobre o visual

## Elementos Especificos

### Orbs decorativas (CSS puro)
- 3-4 circulos grandes (200-400px) com cores em gradiente (`sidebar-primary` e `accent`) e `blur(80px)`, posicionados absolutamente com opacidade baixa (0.15-0.25)
- Animacao `float` sutil (translateY oscilando 20px, duracao 6-8s, infinite)

### Ilustracao central (SVG inline)
- Um grafo circular estilizado: circulo central grande + 4 nos menores ao redor conectados por linhas curvas (paths SVG)
- Cada no contem um icone (Building2, Users, Send, BarChart3) dentro de um circulo com fundo translucido
- Linhas tracejadas animadas entre os nos (stroke-dashoffset animado)
- Efeito de "pulse" suave nos nos com delay escalonado

### Tipografia
- Headline: "Cuide das suas pessoas." -- texto grande (text-3xl/4xl), font-bold, posicionado no topo
- Subtexto: "Avaliacao psicossocial inteligente, automatizada e segura." -- text-sm, opacidade reduzida
- Badges no rodape mantidos mas com estilo mais pill/soft

## Animacoes novas (CSS)

- `float`: translateY oscilante para orbs
- `dash-flow`: stroke-dashoffset animado para linhas SVG
- `node-pulse`: scale + opacity pulsando nos nos do grafo
- Stagger via animation-delay nos nos

## Arquivos modificados

| Arquivo | Mudanca |
|---|---|
| `src/pages/Auth.tsx` | Reescrever todo o painel esquerdo com novo design (orbs + SVG grafo + nova tipografia) |
| `src/index.css` | Adicionar keyframes `float`, `dash-flow`, `node-pulse` |

## O que permanece igual
- Painel direito (formulario) intocado
- Toda logica de autenticacao preservada
- Responsividade mobile (painel esquerdo oculto)
- Badges no rodape

