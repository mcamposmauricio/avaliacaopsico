## Auth page logo cleanup

### Scope
Small visual adjustment on the `/auth` page.

### Changes
1. **Remove** the `<BrandLogo size="lg" />` from the left visual panel (above "Cuide do que realmente importa").
2. **Enlarge** the logo above the form to double the current size (from `md` to `xl`) — both on desktop and mobile — while keeping the `object-contain` proportion.

### File
- `src/pages/Auth.tsx` — remove left-panel logo block, bump form logo size to `xl`.