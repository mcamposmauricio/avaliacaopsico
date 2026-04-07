

# Atualizar Branding para Flew

## Resumo

Substituir todas as referências "MarQ HR" por "Flew", usar a imagem dos quadrados como favicon e a imagem com texto "Flew" como logo no app.

## Mudanças

### 1. Copiar imagens para o projeto
- `user-uploads://image.png` (quadrados) → `public/favicon.png` (favicon)
- `user-uploads://image-2.png` (logo Flew) → `src/assets/flew-logo.png` (logo no app)
- Deletar `public/favicon.jpeg` antigo

### 2. `index.html`
- `<title>`: "Flew — Avaliação Psicossocial"
- `<meta name="author">`: "Flew"
- `<meta property="og:title">`: "Flew — Avaliação Psicossocial"
- `<link rel="icon">`: `/favicon.png` type `image/png`

### 3. `src/pages/Auth.tsx`
- Importar `flew-logo.png` de `@/assets/flew-logo.png`
- Mobile logo: trocar `src` para o import, `alt="Flew"`, ajustar tamanho
- Trocar `<h1>MarQ HR</h1>` → `<h1>Flew</h1>`

### Arquivos

| Arquivo | Ação |
|---|---|
| `public/favicon.png` | Criar (copiar upload quadrados) |
| `public/favicon.jpeg` | Deletar |
| `src/assets/flew-logo.png` | Criar (copiar upload logo) |
| `index.html` | Editar (meta tags → Flew, favicon → .png) |
| `src/pages/Auth.tsx` | Editar (logo + textos → Flew) |

