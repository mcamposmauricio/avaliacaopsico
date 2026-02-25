

# Favicon, Branding e Remoção de Rastros Lovable

## 1. Favicon e Metatags

### `index.html`
- **Title**: "MarQ HR — Avaliacao Psicossocial"
- **Description**: "Plataforma de avaliacao de fatores psicossociais no trabalho conforme NR-1. Gestao de campanhas, analises e relatorios de compliance."
- **Favicon**: apontar para `/favicon.jpeg` (imagem do upload)
- **Author**: "MarQ HR"
- **og:title / og:description**: mesmos valores acima
- **og:image / twitter:image**: remover referencia a `lovable.dev/opengraph-image`
- **twitter:site**: remover `@Lovable`
- Remover todos os comentarios TODO

### `public/favicon.jpeg`
- Copiar o logo uploaded (`user-uploads://logomarq.jpeg`)

---

## 2. Remocao de rastros Lovable

### `index.html`
- Ja coberto acima: remover todas as mencoes a "Lovable" nos metatags

### `README.md`
- Substituir conteudo inteiro por README proprio do projeto:
  - Nome: MarQ HR - Avaliacao Psicossocial
  - Descricao: plataforma de avaliacao de fatores psicossociais conforme NR-1
  - Stack: React, TypeScript, Tailwind CSS, shadcn/ui
  - Sem mencao a Lovable

### `src/pages/Auth.tsx`
- Substituir o quadrado "AP" pelo logo real (`/favicon.jpeg`) usando tag `<img>`
- Atualizar titulo "Avaliacao Psicossocial" para "MarQ HR" ou manter como subtitulo

---

## 3. O que NAO pode ser removido

| Item | Motivo |
|------|--------|
| `lovable-tagger` em `package.json` / `vite.config.ts` | Dev dependency do sistema de build, nao aparece em producao. Remover pode quebrar o projeto dentro do Lovable |
| URL `avaliacaopsico.lovable.app` em `send-survey-emails` | E a URL publicada real. So muda se conectar dominio customizado |
| `.env`, `client.ts`, `types.ts` | Arquivos auto-gerenciados, nao devem ser editados |

---

## Arquivos modificados

| Arquivo | Mudanca |
|---------|---------|
| `public/favicon.jpeg` | Logo do upload |
| `index.html` | Title, description, og tags, favicon, remover Lovable |
| `README.md` | README proprio do projeto |
| `src/pages/Auth.tsx` | Logo real no lugar do quadrado "AP" |

