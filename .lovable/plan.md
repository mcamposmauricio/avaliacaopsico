

# Adicionar Criacao de Usuarios na Secao de Administracao

## Objetivo

Unificar a criacao de usuarios e atribuicao de roles em uma unica secao dentro do componente `UserRolesManager`. O admin podera criar novos usuarios diretamente pela interface, ja atribuindo o papel no momento da criacao.

## Mudancas

### 1. Atualizar Edge Function `seed-test-users` para `create-tenant-user`

Renomear e generalizar a edge function para aceitar um unico usuario por vez com parametros dinamicos:

- **Input**: `{ tenant_id, email, password, full_name, role }`
- **Logica**: Cria o usuario via `auth.admin.createUser`, aguarda o trigger, corrige tenant_id no profile, remove a role `admin_rh` auto-atribuida e insere a role escolhida
- Para role `gestor`, atribui o primeiro `department_id` disponivel no tenant

### 2. Adicionar formulario de criacao no `UserRolesManager`

Acima da tabela de usuarios, adicionar um formulario compacto com:

- Campo **Nome completo** (Input text)
- Campo **Email** (Input email)
- Campo **Senha** (Input password)
- Campo **Papel** (Select com as 4 opcoes)
- Botao **Criar Usuario**

Ao submeter, chama a edge function `create-tenant-user` e invalida as queries de profiles e roles para atualizar a tabela.

### 3. Manter descricoes de roles e tabela existente

A secao de descricao dos papeis e a tabela com Select de role por usuario permanecem inalteradas abaixo do formulario.

## Detalhes Tecnicos

### Arquivo: `supabase/functions/seed-test-users/index.ts`

Sera **renomeado** para `supabase/functions/create-tenant-user/index.ts` e adaptado para:
- Receber `{ tenant_id, email, password, full_name, role }` no body
- Criar apenas 1 usuario por chamada
- Retornar `{ user_id, email, role, status }` 

### Arquivo: `supabase/config.toml`

- Remover entrada `seed-test-users`
- Adicionar entrada `create-tenant-user` com `verify_jwt = false`

### Arquivo: `src/components/settings/UserRolesManager.tsx`

- Adicionar estado para form fields: `newEmail`, `newName`, `newPassword`, `newRole`
- Adicionar mutation `createUser` que chama `supabase.functions.invoke("create-tenant-user", { body: {...} })`
- Renderizar formulario inline (grid compacto) entre as descricoes de roles e a tabela
- Apos sucesso, limpar form e invalidar queries `profiles` e `user_roles_all`

### Arquivo: `supabase/functions/seed-test-users/index.ts`

Sera deletado (substituido pelo novo `create-tenant-user`).

