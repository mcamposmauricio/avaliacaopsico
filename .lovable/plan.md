

# Troca Obrigatoria de Senha no Primeiro Acesso

## Objetivo

Quando um usuario criado pelo admin faz login pela primeira vez, ele deve ser redirecionado para uma tela de troca de senha obrigatoria antes de acessar qualquer funcionalidade do sistema.

## Abordagem

Adicionar um campo `must_change_password` (boolean, default `true`) na tabela `profiles`. Usuarios criados pela edge function `create-tenant-user` terao esse campo como `true`. Ao fazer login, o `ProtectedRoute` verifica esse campo e redireciona para uma nova pagina `/trocar-senha`. Apos trocar a senha, o campo e atualizado para `false`.

## Mudancas

### 1. Migracao de banco de dados

Adicionar coluna `must_change_password` na tabela `profiles`:

```sql
ALTER TABLE public.profiles
ADD COLUMN must_change_password boolean NOT NULL DEFAULT false;
```

Default `false` para nao afetar usuarios existentes. A edge function `create-tenant-user` vai setar `true` ao criar novos usuarios.

### 2. Atualizar Edge Function `create-tenant-user`

Apos criar o profile, atualizar `must_change_password = true` para que o novo usuario seja forcado a trocar a senha no primeiro login.

### 3. Nova pagina `/trocar-senha`

Criar `src/pages/TrocarSenha.tsx` com:

- Titulo: "Crie sua nova senha"
- Mensagem explicativa: "Por seguranca, voce precisa criar uma nova senha no primeiro acesso."
- Campo **Nova senha** (minimo 6 caracteres)
- Campo **Confirmar senha**
- Botao **Salvar nova senha**

Ao submeter:
1. Chama `supabase.auth.updateUser({ password })` para atualizar a senha
2. Atualiza `profiles.must_change_password = false`
3. Redireciona para `/dashboard`

### 4. Atualizar `ProtectedRoute`

Verificar o campo `must_change_password` do profile do usuario logado:
- Se `true` e a rota atual nao for `/trocar-senha`, redirecionar para `/trocar-senha`
- Se `false`, continuar normalmente

### 5. Atualizar `App.tsx`

Adicionar rota `/trocar-senha` protegida (requer autenticacao mas sem checagem de roles).

## Arquivos

| Arquivo | Mudanca |
|---|---|
| Migracao SQL | Adicionar coluna `must_change_password` |
| `supabase/functions/create-tenant-user/index.ts` | Setar `must_change_password = true` apos criar usuario |
| `src/pages/TrocarSenha.tsx` | Nova pagina de troca de senha |
| `src/App.tsx` | Adicionar rota `/trocar-senha` |
| `src/components/ProtectedRoute.tsx` | Verificar `must_change_password` e redirecionar |
| `src/hooks/useTenant.tsx` | Expor campo `must_change_password` do profile |

