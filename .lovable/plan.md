

# Gerenciamento de Roles na pagina de Configuracoes

## Objetivo

Adicionar uma nova secao "Gerenciamento de Usuarios e Roles" na pagina de Configuracoes, permitindo que o admin_rh:
1. Veja todos os usuarios do tenant com seus respectivos roles
2. Atribua novas roles a usuarios existentes
3. Remova roles de usuarios
4. Saiba que o primeiro usuario cadastrado recebe automaticamente a role admin_rh (isso ja funciona via trigger `handle_new_user`)

## O que ja existe

- Tabela `user_roles` com RLS: admin_rh pode INSERT e DELETE dentro do tenant
- Tabela `profiles` com email/full_name de cada usuario do tenant (SELECT por tenant)
- Trigger `handle_new_user` ja atribui `admin_rh` ao primeiro usuario de cada tenant
- Enum `app_role`: admin_rh, gestor, diretoria, auditoria
- Pagina de Configuracoes ja protegida para apenas admin_rh

## Plano de Implementacao

### 1. Criar componente UserRolesManager

Novo arquivo `src/components/settings/UserRolesManager.tsx` com:

- Query para listar todos os `profiles` do tenant (via `useTenant().tenantId`)
- Query para listar todos os `user_roles` do tenant
- Tabela mostrando: Nome, Email, Roles (badges), Acoes
- Para cada usuario, um dropdown/select para adicionar uma nova role
- Botao de remover role (com confirmacao via badge clicavel ou botao X)
- Protecao: nao permitir que o admin remova sua propria ultima role admin_rh

### 2. Atualizar pagina de Configuracoes

Adicionar o componente `UserRolesManager` como uma nova Card/secao na pagina `Configuracoes.tsx`, posicionada apos as secoes existentes e antes do botao "Salvar Configuracoes".

A secao tera:
- Icone Users + titulo "Gerenciamento de Roles"
- Descricao: "Atribua perfis de acesso aos usuarios do sistema"
- Tabela com todos os usuarios e suas roles
- Select para adicionar role + botao adicionar
- Badges com X para remover roles

### 3. Nota sobre o cadastro inicial

O trigger `handle_new_user` no banco ja garante que todo novo usuario que se cadastra (sem convite) recebe a role `admin_rh`. Nenhuma mudanca de banco e necessaria para isso.

---

## Detalhes Tecnicos

### Arquivo: `src/components/settings/UserRolesManager.tsx`

- useQuery `["profiles", tenantId]` -- busca todos os profiles do tenant
- useQuery `["user_roles_all", tenantId]` -- busca todos os user_roles do tenant
- useMutation para INSERT em user_roles (tenant_id, user_id, role)
- useMutation para DELETE em user_roles por id
- UI: Table do shadcn com colunas Nome, Email, Roles, Acoes
- Select do shadcn para escolher role a adicionar
- Badge para cada role atribuida, com botao X para remover
- Validacao: impedir remocao da ultima role admin_rh do proprio usuario logado

### Arquivo: `src/pages/Configuracoes.tsx`

- Importar e renderizar `<UserRolesManager />` dentro de uma nova Card
- Posicionar entre a secao de Retencao de Dados e o botao Salvar

### Nenhuma migracao de banco necessaria

Todas as tabelas e politicas RLS ja estao corretas para suportar esta funcionalidade.

