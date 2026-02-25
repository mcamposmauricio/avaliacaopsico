

# Redesign da Tela de Login - Layout Split Screen

## Conceito Visual

A tela sera dividida em duas metades horizontais:
- **Esquerda (55%)**: Painel escuro (azul profundo, cor do sidebar) com uma mini landing page visual mostrando o fluxo do sistema usando "blueprint cards" animadas
- **Direita (45%)**: Fundo claro com o formulario de login/cadastro atual, centralizado

No mobile, o painel esquerdo fica oculto e so aparece o formulario.

## Painel Esquerdo - Mini LP Visual

Fundo com gradiente do azul profundo do sidebar (`--sidebar-background`) com pattern sutil de grid/dots. Conteudo:

1. **Logo + headline**: "MarQ HR" + "Avaliacao Psicossocial Inteligente"
2. **Blueprint/Flow Visual**: 3-4 cards glassmorphism (borda branca semi-transparente, fundo translucido) dispostas em sequencia vertical com conectores (linhas tracejadas), cada uma representando uma etapa:
   - Card 1: icone Building2 + "Monte sua Estrutura" + "Departamentos, cargos e equipes"
   - Card 2: icone Users + "Cadastre Colaboradores" + "Importe ou adicione manualmente"
   - Card 3: icone Send + "Lance Campanhas" + "Questionarios psicossociais automatizados"
   - Card 4: icone BarChart3 + "Analise Resultados" + "Relatorios e planos de acao com IA"
3. **Rodape**: Badges com "LGPD Compliant", "Multi-tenant", "White Label"
4. **Animacao**: Cards entram com stagger fade-in (delay progressivo), conectores aparecem com animacao de "draw line"

## Painel Direito - Formulario

Mantem toda a logica atual do formulario (login/signup toggle, campos, validacao, submit). Mudancas visuais:
- Remove o logo e subtitulos (ja estao no painel esquerdo)
- Card com sombra mais sutil
- Adiciona um pequeno "Bem-vindo de volta" ou "Comece agora" como titulo contextual

## Arquivo modificado

| Arquivo | Mudanca |
|---|---|
| `src/pages/Auth.tsx` | Reescrever layout para split-screen com painel LP esquerdo + formulario direito |
| `src/index.css` | Adicionar keyframe para animacao de "draw-line" nos conectores e grid pattern |
| `tailwind.config.ts` | Adicionar keyframe `slide-in-left` para animacao stagger das cards |

## Detalhes tecnicos

- Layout: `flex` com `lg:flex-row`, painel esquerdo `hidden lg:flex` (some no mobile)
- Cards do blueprint: componentes inline com classes Tailwind (glassmorphism via `bg-white/10 backdrop-blur border border-white/20`)
- Conectores: `div` com `border-l-2 border-dashed border-white/20` entre cards
- Animacoes: CSS keyframes com `animation-delay` progressivo via style inline
- Responsividade: no mobile so aparece o formulario com logo compacto acima
