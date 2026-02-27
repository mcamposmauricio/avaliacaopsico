

# Corrigir Tratamento de Erros na Criacao de Usuarios

## Problema

A edge function `create-tenant-user` esta funcionando corretamente apos a correcao anterior. O problema agora e duplo:

1. **Erro generico no frontend**: Quando a edge function retorna status 400, o `supabase.functions.invoke` encapsula o erro em um `FunctionsHttpError` com mensagem generica. O texto real do erro (ex: "A user with this email address has already been registered") nao chega ao usuario.

2. **Usuarios orfaos**: Os emails `gestor@teste.flew.com` e `diretoria@teste.flew.com` ja existem no sistema de autenticacao (provavelmente criados pela antiga funcao seed), mas nao aparecem na tabela de profiles do tenant atual.

## Correcoes

### 1. Melhorar tratamento de erro no `UserRolesManager.tsx`

Extrair a mensagem de erro real da resposta da edge function em vez de usar a mensagem generica do `FunctionsHttpError`:

```typescript
const createUser = useMutation({
  mutationFn: async () => {
    const { data, error } = await supabase.functions.invoke("create-tenant-user", {
      body: { ... },
    });
    if (error) {
      // Tentar extrair mensagem do corpo da resposta
      const context = await error.context?.json?.().catch(() => null);
      throw new Error(context?.error || error.message);
    }
    if (data?.error) throw new Error(data.error);
    return data;
  },
  ...
});
```

### 2. Tratar email duplicado na edge function

Na edge function `create-tenant-user`, quando o `createUser` retorna erro `email_exists`, buscar o usuario existente e atualizar seu tenant/role em vez de falhar:

- Se o email ja existe, buscar o `user.id` pelo email usando `adminClient.auth.admin.listUsers`
- Verificar se o usuario ja pertence ao tenant
- Se nao pertence, atualizar o profile e role para o tenant correto
- Se ja pertence, retornar erro amigavel

## Arquivos

| Arquivo | Mudanca |
|---|---|
| `src/components/settings/UserRolesManager.tsx` | Extrair mensagem de erro real do `FunctionsHttpError` |
| `supabase/functions/create-tenant-user/index.ts` | Tratar caso de email duplicado: vincular usuario existente ao tenant |

## Detalhe Tecnico

### Edge Function - Tratamento de email existente

Apos o erro `email_exists` do `createUser`:

```typescript
// Se erro de email duplicado, buscar usuario existente
if (createErr?.message?.includes("already been registered")) {
  const { data: { users } } = await adminClient.auth.admin.listUsers();
  const existing = users.find(u => u.email === email);
  if (!existing) throw new Error("User not found");
  
  // Atualizar profile e role para o tenant
  userId = existing.id;
  // ... continuar com update de profile e role
}
```

### Frontend - Extracao de erro

O `FunctionsHttpError` tem uma propriedade `context` que contem a `Response` original. Usar `context.json()` para obter o corpo com a mensagem real.

