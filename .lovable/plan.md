Inserir o componente `BrandLogo` em três pontos da tela `/auth` (login/criação de conta):

1. **Painel esquerdo (desktop — `lg:flex`)**: adicionar `<BrandLogo size="lg" />` no topo, acima do headline "Cuide do que realmente importa".
2. **Painel direito (desktop)**: adicionar `<BrandLogo size="md" />` acima do título "Bem-vindo de volta" / "Comece agora", centralizado.
3. **Mobile (`lg:hidden`)**: substituir o `<img>` direto por `<BrandLogo size="md" />` para manter consistência com o componente de marca.

Nenhuma outra alteração de layout ou lógica.