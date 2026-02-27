

# Corrigir Criacao de Usuarios - Erro de Autenticacao

## Problema

A Edge Function `create-tenant-user` usa `supabase.auth.getClaims(token)` na linha 32, que nao e um metodo valido do SDK. Isso faz a funcao retornar erro 401 antes de criar qualquer usuario. Como resultado, nenhum usuario de teste foi criado e o login falha com "credenciais invalidas".

## Correcao

Substituir `getClaims(token)` por `getUser(token)` na Edge Function, que e o metodo correto para validar o JWT do usuario que esta chamando a funcao.

## Arquivo

| Arquivo | Mudanca |
|---|---|
| `supabase/functions/create-tenant-user/index.ts` | Trocar `getClaims(token)` por `getUser(token)` e ajustar a verificacao do resultado |

## Detalhe Tecnico

Linha 32-38 atual:
```typescript
const { data: claimsData, error: claimsError } = await callerClient.auth.getClaims(token);
if (claimsError || !claimsData?.claims) { ... }
```

Substituir por:
```typescript
const { data: { user: caller }, error: callerError } = await callerClient.auth.getUser(token);
if (callerError || !caller) { ... }
```

Apos a correcao, o admin podera criar usuarios pelo formulario na pagina de Configuracoes normalmente.
