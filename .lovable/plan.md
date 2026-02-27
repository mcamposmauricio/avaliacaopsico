

# Criar 3 usuarios de teste com diferentes roles

## Objetivo

Criar uma edge function `seed-test-users` que cria 3 usuarios de teste no mesmo tenant do usuario logado, cada um com um papel diferente (gestor, diretoria, auditoria).

## Abordagem

Criar uma edge function que usa a Service Role Key para:
1. Criar 3 usuarios via `supabase.auth.admin.createUser` (com email_confirm: true para pular verificacao)
2. O trigger `handle_new_user` vai criar o profile e atribuir `admin_rh` automaticamente -- precisamos corrigir isso depois
3. Atualizar o `tenant_id` do profile para apontar pro tenant do usuario que chamou a funcao
4. Deletar a role `admin_rh` auto-atribuida e inserir a role correta

### Usuarios a serem criados

| Email | Senha | Role |
|---|---|---|
| gestor@teste.flew.com | teste123456 | gestor |
| diretoria@teste.flew.com | teste123456 | diretoria |
| auditoria@teste.flew.com | teste123456 | auditoria |

## Implementacao

### 1. Edge function `seed-test-users`

Nova funcao em `supabase/functions/seed-test-users/index.ts` que:
- Recebe o `tenant_id` no body (ou extrai do token do usuario autenticado)
- Usa `supabase.auth.admin.createUser` para cada usuario com `email_confirm: true`
- Aguarda o trigger criar o profile, depois atualiza o `tenant_id` do profile para o tenant correto
- Deleta todas as roles auto-atribuidas e insere a role correta
- Para o gestor, tambem atribui um `department_id` no profile (primeiro departamento encontrado)

### 2. Botao temporario na pagina de Configuracoes

Adicionar um botao "Criar Usuarios de Teste" na secao de Gerenciamento de Roles que chama a edge function. Apos sucesso, invalida as queries de profiles e roles para atualizar a tabela.

## Detalhes Tecnicos

### Edge Function

```text
POST /seed-test-users
Body: { tenant_id: string }
Auth: Bearer token do admin logado

Para cada usuario:
1. auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { tenant_id, full_name } })
   - Passando tenant_id no metadata para que o trigger handle_new_user use o tenant correto
2. Deletar role admin_rh auto-atribuida pelo trigger
3. Inserir role correta (gestor/diretoria/auditoria)
4. Para gestor: atualizar profiles.department_id com primeiro departamento do tenant
```

### Arquivos

| Arquivo | Mudanca |
|---|---|
| `supabase/functions/seed-test-users/index.ts` | Nova edge function |
| `src/pages/Configuracoes.tsx` | Botao "Criar Usuarios de Teste" |

