

# Corrigir Primeiro Acesso e Login do Gestor

## Problemas Identificados

### 1. Usuario preso na tela de troca de senha
Apos trocar a senha com sucesso, o usuario navega para `/dashboard`. Porem, o React Query ainda tem o valor antigo `must_change_password: true` em cache. O `ProtectedRoute` le esse valor e redireciona de volta para `/trocar-senha`, criando um loop infinito.

**Causa**: `TrocarSenha.tsx` atualiza o banco mas nao invalida o cache do React Query.

### 2. gestor@teste.flew.com com credenciais invalidas
O usuario existe no banco (user_id: `877ff815...`) mas o login falha. Isso acontece porque quando o email ja existia no Auth e foi re-vinculado ao tenant pela edge function, o bloco de "duplicate handling" (linhas 86-96) NAO atualiza a senha do usuario. Apenas atualiza metadata e profile. Entao a senha continua sendo a anterior (possivelmente definida na primeira criacao via seed).

**Causa**: A edge function `create-tenant-user` nao chama `updateUserById` com a nova senha no caso de email duplicado.

### 3. Erro "same_password" nao tratado
Os logs mostram erro 422 "New password should be different from the old password" quando o usuario tenta trocar para a mesma senha. A pagina TrocarSenha nao trata esse erro de forma amigavel.

## Correcoes

### Arquivo 1: `src/pages/TrocarSenha.tsx`
- Importar `useQueryClient` do React Query
- Apos atualizar a senha e o profile com sucesso, chamar `queryClient.invalidateQueries({ queryKey: ["profile"] })` para limpar o cache
- Isso faz o `ProtectedRoute` ler o valor atualizado `must_change_password: false`
- Tratar o erro "same_password" com mensagem amigavel: "A nova senha deve ser diferente da senha atual"

### Arquivo 2: `supabase/functions/create-tenant-user/index.ts`
- No bloco de email duplicado (apos linha 89), adicionar a atualizacao de senha:
```typescript
await adminClient.auth.admin.updateUserById(userId, {
  password,
  user_metadata: { tenant_id, full_name },
});
```
- Isso garante que ao re-vincular um usuario existente, a senha informada pelo admin seja aplicada

## Arquivos

| Arquivo | Mudanca |
|---|---|
| `src/pages/TrocarSenha.tsx` | Invalidar cache do profile apos troca de senha + tratar erro same_password |
| `supabase/functions/create-tenant-user/index.ts` | Atualizar senha do usuario no caso de email duplicado |

