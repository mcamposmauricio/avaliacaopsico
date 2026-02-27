

# Gerenciamento de Usuarios como Pagina Independente

## Objetivo

1. Extrair o gerenciamento de usuarios da pagina de Configuracoes para uma pagina propria `/usuarios`
2. Adicionar funcionalidades de edicao (nome) e exclusao de usuarios
3. Adicionar o item "Usuarios" no menu lateral entre "Configuracoes" e "Governanca"

## Mudancas

### 1. Nova pagina `src/pages/Usuarios.tsx`

Criar pagina dedicada com:
- Titulo "Gerenciamento de Usuarios"
- Formulario de criacao (ja existente no UserRolesManager)
- Tabela de usuarios com colunas: Nome, Email, Papel, Acoes
- Botao de editar (abre dialog para alterar nome)
- Botao de excluir (com confirmacao via AlertDialog)
- Descricao dos papeis

### 2. Atualizar `UserRolesManager.tsx`

Adicionar ao componente:
- **Edicao**: Dialog para editar o nome do usuario, chamando `supabase.from("profiles").update({ full_name })` 
- **Exclusao**: AlertDialog de confirmacao. Ao confirmar, chama uma nova edge function `delete-tenant-user` que:
  - Remove o registro de `user_roles` do tenant
  - Remove o registro de `profiles` do tenant
  - Opcionalmente remove o usuario do Auth (via `admin.deleteUser`) se nao tiver profiles em outros tenants
- Coluna "Acoes" na tabela com botoes de editar/excluir
- Impedir exclusao do proprio usuario logado

### 3. Nova Edge Function `supabase/functions/delete-tenant-user/index.ts`

Necessaria porque a exclusao de usuario do Auth requer `service_role_key`:
- Valida o caller (mesmo padrao do create-tenant-user)
- Recebe `user_id` e `tenant_id`
- Deleta role e profile do usuario naquele tenant
- Se o usuario nao tem mais profiles em nenhum tenant, deleta do Auth tambem
- Retorna sucesso

### 4. Atualizar sidebar (`AppSidebar.tsx`)

Adicionar item "Usuarios" no array `adminNav`, entre Configuracoes e Governanca:
```
{ title: "Usuarios", url: "/usuarios", icon: Users, roles: ["admin_rh"] }
```

Reordenar para: Configuracoes > Usuarios > Governanca

### 5. Atualizar rotas e permissoes

- `src/App.tsx`: Adicionar rota `/usuarios` protegida com role `admin_rh`
- `src/hooks/usePermissions.ts`: Adicionar `/usuarios: ["admin_rh"]` ao mapa de rotas
- `src/pages/Configuracoes.tsx`: Remover o card de "Gerenciamento de Roles" (sera a pagina propria)

### 6. Atualizar `supabase/config.toml`

Adicionar configuracao `verify_jwt = false` para a nova edge function `delete-tenant-user`.

## Arquivos

| Arquivo | Mudanca |
|---|---|
| `src/pages/Usuarios.tsx` | Nova pagina dedicada ao gerenciamento de usuarios |
| `src/components/settings/UserRolesManager.tsx` | Adicionar edicao de nome e exclusao com confirmacao |
| `supabase/functions/delete-tenant-user/index.ts` | Nova edge function para excluir usuario |
| `src/components/layout/AppSidebar.tsx` | Adicionar "Usuarios" no menu entre Configuracoes e Governanca |
| `src/App.tsx` | Adicionar rota `/usuarios` |
| `src/hooks/usePermissions.ts` | Adicionar permissao para `/usuarios` |
| `src/pages/Configuracoes.tsx` | Remover card de gerenciamento de roles |

## Detalhes da Exclusao

A exclusao exibe um AlertDialog: "Tem certeza que deseja excluir este usuario? Esta acao nao pode ser desfeita."

Regras:
- Nao permitir excluir o proprio usuario logado
- Nao permitir excluir se for o unico admin_rh do tenant
- Ao excluir, remove role + profile + usuario do Auth (se sem outros tenants)

## Detalhes da Edicao

Dialog simples com campo de nome. Ao salvar, atualiza `profiles.full_name` via query direta do cliente (RLS ja permite update do proprio tenant via admin_rh). Para editar usuarios que nao sao o proprio, sera necessario usar a edge function ou ajustar para que admin_rh possa atualizar profiles do seu tenant. Como a RLS atual so permite `user_id = auth.uid()` para UPDATE, a edicao de outros usuarios sera feita via edge function ou adicionando uma policy RLS para admin_rh.

### Migracao SQL necessaria

Adicionar policy para admin_rh poder atualizar profiles do seu tenant:

```sql
CREATE POLICY "Admin RH can update profiles in tenant"
ON public.profiles FOR UPDATE TO authenticated
USING (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'admin_rh'::app_role))
WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'admin_rh'::app_role));
```
