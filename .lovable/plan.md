
# Redesign Completo — UI/UX Moderno

## Visao Geral

O sistema atual tem uma estetica funcional mas generica. O redesign foca em criar uma experiencia visual premium e profissional, com melhor hierarquia visual, micro-interacoes, e padroes modernos de dashboard SaaS.

## Mudancas no Design System

### 1. Nova Paleta de Cores (index.css)
- Fundo principal mais quente: cinza com leve tom azulado (menos frio)
- Cards com sombra suave e borda mais sutil
- Gradientes sutis nos KPIs e header
- Cores semanticas mais vibrantes para scores (verde/amarelo/vermelho)
- Sidebar com gradiente vertical escuro ao inves de cor solida

### 2. Tipografia e Espacamento
- Titulos de pagina maiores (text-3xl) com subtitulo mais espaçado
- Labels dos KPIs com tracking mais largo
- Espacamento vertical mais generoso entre secoes (space-y-8)

### 3. Animacoes (tailwind.config.ts)
- Fade-in nos cards ao carregar
- Hover scale sutil nos cards de KPI
- Transicao suave no sidebar
- Skeleton com shimmer effect

---

## Mudancas por Arquivo

### AppLayout.tsx — Header Redesenhado
- Header com altura maior (h-16), fundo com blur/glassmorphism sutil (bg-card/80 backdrop-blur)
- Breadcrumb ou nome da pagina atual no header
- Avatar do usuario com dropdown (nome + role)
- Botao de logout dentro do dropdown, nao exposto diretamente
- Separador visual entre sidebar trigger e tenant name

### AppSidebar.tsx — Sidebar Premium
- Logo area com padding maior e separador inferior
- Icones com tamanho ligeiramente maior (h-5 w-5)
- Item ativo com barra lateral colorida (border-left accent) alem do background
- Hover com transicao suave (transition-all duration-200)
- Footer com versao do sistema e link de suporte
- Grupos com labels em uppercase, tracking-wider, font-semibold

### Auth.tsx — Tela de Login Modernizada
- Fundo com gradiente sutil (azul escuro para cinza)
- Card de login com sombra maior e border radius maior
- Logo maior e animado (fade-in na entrada)
- Inputs com foco colorido (ring accent)
- Botao com gradiente e hover elevado
- Separador visual "ou" para futuras opcoes de login social
- Texto legal/LGPD no rodape

### Dashboard.tsx — Dashboard Premium
- KPI cards com icone em circulo colorido (bg accent/10 com icone accent)
- Valor do KPI maior (text-3xl) e badge de status ao lado (Ex: "Bom" em verde)
- Cards de dimensoes com barras de progresso mais estilizadas (rounded-full, gradiente)
- Card de campanha ativa com timeline visual e indicadores de cor
- Saudacao personalizada no topo ("Bom dia, [nome]")
- Animacao fade-in nos cards ao carregar
- Empty states com ilustracao/icone grande e CTA claro

### Analises.tsx — Graficos Refinados
- Tabs com estilo pill (rounded-full, bg accent quando ativo)
- Cores de graficos harmonizadas com a paleta do sistema
- Tooltips customizados nos graficos com fundo escuro e texto claro
- Heatmap com celulas rounded e cores mais suaves (gradiente verde-amarelo-vermelho)
- Legenda melhorada com badge colorido
- Seletor de campanha como combobox estilizado

### Campanhas.tsx — Cards de Campanha Melhorados
- Card com borda lateral colorida por status (verde=ativa, cinza=rascunho, azul=encerrada)
- Timeline visual mostrando etapas (Rascunho -> Convites -> Ativa -> Encerrada)
- Botoes de acao com icones mais expressivos
- Dialog de criacao com stepper visual
- Badge de status com dot colorido animado (pulse para "Ativa")

### Colaboradores.tsx — Tabela Moderna
- Tabela com linhas zebradas sutis e hover highlight
- Avatar placeholder com iniciais do colaborador
- Badges de status com dot colorido
- Acoes em menu dropdown ao inves de icones inline
- Barra de busca/filtro no topo
- Contagem de resultados "Mostrando X de Y"

### Estrutura.tsx — Layout Melhorado
- Tabs com estilo mais moderno (underline ou pill)
- Cards de itens em grid ao inves de tabela simples
- Cada item com icone representativo e count de sub-itens
- Empty state com ilustracao

### Configuracoes.tsx — Settings Moderno
- Secoes com icone de header
- Preview da marca (como ficaria o sidebar com as cores escolhidas)
- Upload de logo com drag-and-drop area
- Slider visual para min_group_size ao inves de input numerico
- Secoes colapsaveis

### Relatorios.tsx — Cards de Relatorio
- Cards ao inves de tabela para relatorios gerados
- Preview do tipo (icone grande de PDF)
- Botao de download com progresso
- Secao de geracao com cards por campanha ao inves de lista

### PlanoAcao.tsx — Kanban-like
- Cards com borda lateral colorida por status
- Indicador de prazo (verde = no prazo, amarelo = proximo, vermelho = atrasado)
- Filtro por dimensao e status no topo
- Progress ring mostrando % concluido no sumario

### Governanca.tsx — Dashboard de Compliance
- KPI cards com icone em circulo e cor tematica
- Tabela com formatacao melhorada e filtros
- Indicadores visuais de conformidade

### SurveyRuntime.tsx — Experiencia do Respondente
- Stepper visual no topo com nome das dimensoes
- Escala Likert com labels completos (nao so numeros)
- Cards de pergunta com numero grande e texto claro
- Progresso com cor que muda conforme avanca (azul -> verde)
- Tela de conclusao com animacao de check

---

## Secao Tecnica

### Arquivos Modificados
1. `src/index.css` — Nova paleta, variaveis CSS, estilos globais
2. `tailwind.config.ts` — Novas animacoes e utilities
3. `src/App.css` — Remover estilos default do Vite (nao usados)
4. `src/components/layout/AppLayout.tsx` — Header glassmorphism, dropdown usuario
5. `src/components/layout/AppSidebar.tsx` — Sidebar premium, active indicator
6. `src/pages/Auth.tsx` — Login redesenhado com gradiente
7. `src/pages/Dashboard.tsx` — KPIs premium, saudacao, empty states
8. `src/pages/Analises.tsx` — Tabs pill, cores harmonizadas, heatmap refinado
9. `src/pages/Campanhas.tsx` — Cards com borda status, timeline
10. `src/pages/Colaboradores.tsx` — Tabela moderna, avatares, busca
11. `src/pages/Estrutura.tsx` — Tabs e cards modernos
12. `src/pages/Configuracoes.tsx` — Layout de settings premium
13. `src/pages/Relatorios.tsx` — Cards ao inves de tabela
14. `src/pages/PlanoAcao.tsx` — Cards com indicadores visuais
15. `src/pages/Governanca.tsx` — Dashboard compliance refinado
16. `src/pages/SurveyRuntime.tsx` — UX do respondente melhorada

### Principios de Design Aplicados
- **Hierarquia Visual**: Titulos, subtitulos e conteudo com tamanhos e pesos claros
- **Espacamento Consistente**: Padding e gaps uniformes (multiplos de 4px)
- **Feedback Visual**: Hover states, transicoes, loading states
- **Empty States**: Mensagens claras com icone e CTA quando nao ha dados
- **Acessibilidade**: Contraste adequado, focus rings visiveis, labels semanticos
- **Responsividade**: Grid adaptativo para mobile/tablet/desktop

### Sem Mudancas em
- Logica de negocio (queries, mutations, edge functions)
- Banco de dados
- Roteamento
- Autenticacao
