

# Tour Guiado de Onboarding

## Objetivo
Implementar um tour interativo passo-a-passo que guia novos usuarios pela plataforma na primeira vez que fazem login, destacando as principais areas e funcionalidades.

## Abordagem
Usar uma biblioteca leve de tour guiado (`driver.js` - ~5kb gzip, zero dependencias) integrada ao layout principal. O tour sera acionado automaticamente no primeiro login e podera ser reiniciado manualmente via menu do usuario.

## Estrutura

### 1. Instalar dependencia
- Adicionar `driver.js` ao projeto (biblioteca moderna, leve, sem dependencias).

### 2. Criar hook `useOnboardingTour`
**Arquivo:** `src/hooks/useOnboardingTour.ts`

- Verificar no `localStorage` se o tour ja foi concluido (`onboarding_tour_completed`).
- Definir os passos do tour com seletores CSS para cada elemento:
  1. **Sidebar** - "Este e o menu principal. Aqui voce acessa todas as areas da plataforma."
  2. **Estrutura** - "Comece cadastrando seus departamentos e cargos."
  3. **Colaboradores** - "Depois, importe ou cadastre seus colaboradores."
  4. **Campanhas** - "Crie campanhas de avaliacao psicossocial para enviar aos colaboradores."
  5. **Analises** - "Acompanhe os resultados e indicadores em tempo real."
  6. **Relatorios** - "Gere relatorios e laudos automaticamente."
  7. **Configuracoes** - "Personalize a plataforma com a identidade da sua empresa."
- Ao finalizar, salvar flag no `localStorage`.
- Expor funcao `startTour()` para reiniciar manualmente.

### 3. Adicionar `data-tour` attributes nos elementos alvo
**Arquivo:** `src/components/layout/AppSidebar.tsx`

- Adicionar atributos `data-tour="sidebar"`, `data-tour="nav-estrutura"`, etc. nos itens de menu para que o tour possa referencia-los via seletores CSS (`[data-tour="..."]`).

### 4. Integrar no AppLayout
**Arquivo:** `src/components/layout/AppLayout.tsx`

- Importar e chamar `useOnboardingTour()` dentro do layout.
- O tour inicia automaticamente apos o carregamento do perfil/tenant (para garantir que sidebar esta renderizada).

### 5. Botao "Refazer Tour" no menu do usuario
**Arquivo:** `src/components/layout/AppLayout.tsx`

- Adicionar item "Refazer Tour" no dropdown do avatar, chamando `startTour()`.

### 6. Estilizacao
**Arquivo:** `src/index.css`

- Customizar as cores do driver.js para seguir o tema da aplicacao (usando variaveis CSS existentes como `--primary`, `--accent`).

## Detalhes tecnicos

| Arquivo | Acao |
|---|---|
| `package.json` | Adicionar `driver.js` |
| `src/hooks/useOnboardingTour.ts` | Novo hook com logica do tour |
| `src/components/layout/AppSidebar.tsx` | Adicionar `data-tour` attributes |
| `src/components/layout/AppLayout.tsx` | Integrar hook + botao "Refazer Tour" |
| `src/index.css` | Estilos customizados do driver.js |

## Comportamento esperado
- Primeiro login: tour inicia automaticamente apos 1s de delay.
- Logins subsequentes: sem tour (flag no localStorage).
- Usuario pode reiniciar o tour a qualquer momento pelo menu do avatar.
- Tour e responsivo e funciona em mobile (driver.js suporta nativamente).
- Se o usuario fechar o tour antes de terminar, nao marca como concluido (reaparece no proximo login).

