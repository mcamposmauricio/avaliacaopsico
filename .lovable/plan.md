# Plano: Rebrand global para People Pulse

## Escopo confirmado
- Substituição global da marca Flew → **People Pulse** em toda a plataforma
- Nova paleta healthtech (azul #0078D7 / verde #59C414 / grafite #2B2D2F / fundo #F5F7FA / branco)
- Renomeação do índice **FPI → PPI** (People Pulse Index)
- Logo aplicada onde fizer sentido (sidebar, login, favicon, emails) com **fundo branco obrigatório** (PNG sem transparência) e tamanho generoso por causa da baixa resolução
- Profundidade: **apenas tokens + logo** (sem refatorar componentes)

## 1. Logo
- Copiar a imagem enviada para `src/assets/peoplepulse-logo.png` (uso nos componentes React via import) e `public/peoplepulse-logo.png` (uso em emails e meta tags)
- Copiar também para `public/favicon.png` (sobrescreve o favicon atual)
- Criar um componente leve `src/components/brand/BrandLogo.tsx` que renderiza a logo dentro de um container `bg-white` com padding (resolve fundo branco obrigatório) e aceita prop `size` para garantir tamanho mínimo legível (ex.: h-10 na sidebar, h-16 no login, h-20 no email)

## 2. Paleta (tokens HSL em `src/index.css`)
Reescrever as variáveis do tema light (e dark consistente) com:
- `--background`: cinza claro `#F5F7FA` → `210 25% 97%`
- `--foreground` / textos: grafite `#2B2D2F` → `210 3% 17%`
- `--primary`: azul `#0078D7` → `207 100% 42%`
- `--primary-foreground`: branco
- `--accent` / sucesso: verde `#59C414` → `94 81% 42%`
- `--success`: mesmo verde
- `--card`: branco puro
- `--muted` / borders: tons de cinza derivados de #F5F7FA
- `--sidebar-background`: branco com `--sidebar-foreground` grafite, `--sidebar-primary` azul (sidebar passa de navy escuro para light premium healthtech)
- Manter warning/destructive atuais (semânticos)

## 3. Substituições textuais Flew → People Pulse / FPI → PPI
Arquivos a atualizar (somente strings de marca/índice, sem mexer em lógica):

| Arquivo | Mudança |
|---|---|
| `index.html` | `<title>`, meta description, author, og:title/description → People Pulse |
| `README.md` | Título e descrição |
| `src/components/layout/AppSidebar.tsx` | Trocar texto "Flew" pelo `<BrandLogo />` no topo |
| `src/pages/Auth.tsx` | Inserir `<BrandLogo size="lg" />` no painel; manter headline "Cuide das suas pessoas." |
| `src/pages/Dashboard.tsx`, `Analises.tsx`, `Governanca.tsx`, `PlanoAcao.tsx` | Strings "Flew" / "FPI" → "People Pulse" / "PPI" |
| `src/hooks/useOnboardingTour.ts` | Textos do tour |
| `src/lib/flew.ts` | Manter nome de arquivo (evita refator). Atualizar comentário/constante: `FPI` → `PPI`, disclaimer permanece |
| Edge functions de email (`send-welcome-email`, `send-survey-emails`, `create-tenant-user`, `generate-report`, `process-scoring`, `seed-demo-tenant`, `seed-test-data`) | Trocar remetente "Flew" para "People Pulse", subject/body, e referência ao índice FPI→PPI. Logo nos emails apontando para `https://www.flewpulse.com.br/peoplepulse-logo.png` (domínio público atual) dentro de header branco |

Obs.: domínio de envio `noreply@flewpulse.com.br` e variáveis `.env` permanecem inalterados (infra). Apenas o **display name** muda.

## 4. Favicon e meta tags
- Substituir `public/favicon.png` pela nova logo
- Remover `public/favicon.ico` se existir (para evitar override)
- Atualizar `<title>` e meta description em `index.html` para "People Pulse — Bem-estar e Saúde Mental no Trabalho / Avaliação Psicossocial NR-1"

## 5. QA
- Verificar visualmente sidebar, /auth, /dashboard após mudança de tokens (contraste do grafite sobre branco/cinza claro)
- Confirmar que botões/badges de risco continuam legíveis com a nova paleta

## Arquivos tocados (resumo)
- `src/assets/peoplepulse-logo.png` (novo, copiado do upload)
- `public/peoplepulse-logo.png`, `public/favicon.png` (novos)
- `src/components/brand/BrandLogo.tsx` (novo)
- `src/index.css` (tokens)
- `index.html`, `README.md`
- `src/components/layout/AppSidebar.tsx`, `src/pages/Auth.tsx`, `Dashboard.tsx`, `Analises.tsx`, `Governanca.tsx`, `PlanoAcao.tsx`
- `src/hooks/useOnboardingTour.ts`, `src/lib/flew.ts`
- 7 edge functions (apenas strings de marca/índice)

Sem migrations, sem mudanças de schema, sem refator de lógica.