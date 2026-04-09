

# Plano: Email de boas-vindas e instruções de uso

## Contexto

Dois fluxos de criação de usuário:
1. **Self-signup** (landing page `/auth`) — trigger `handle_new_user` cria tenant + perfil
2. **Admin-created** (edge function `create-tenant-user`) — admin cria o usuário

Ambos precisam disparar um email de boas-vindas com instruções.

## Solução

### 1. Criar Edge Function `send-welcome-email`

Nova função em `supabase/functions/send-welcome-email/index.ts` que:
- Recebe `{ email, full_name, tenant_name, is_admin_created, temp_password? }`
- Envia email via Resend API (mesmo padrão do `send-survey-emails`)
- Remetente: `Flew <noreply@flewpulse.com.br>`
- Conteúdo do email:
  - Saudação personalizada
  - Breve explicação do que é a plataforma (avaliação psicossocial)
  - Instruções de acesso (link para login)
  - Se criado por admin: informa a senha temporária e instrui a trocar no primeiro acesso
  - Se self-signup: orienta a explorar o dashboard e configurar a estrutura organizacional
  - Links para as principais funcionalidades (Estrutura, Colaboradores, Campanhas, Análises)

### 2. Chamar a função nos dois fluxos

**Fluxo self-signup (`Auth.tsx`)**: Após signup bem-sucedido com sessão, invocar `supabase.functions.invoke('send-welcome-email', ...)` com os dados do novo usuário.

**Fluxo admin (`create-tenant-user/index.ts`)**: Ao final da criação do usuário, chamar a Resend API diretamente (já tem service role) para enviar o email de boas-vindas com a senha temporária.

## Arquivos

| Arquivo | Mudança |
|---|---|
| `supabase/functions/send-welcome-email/index.ts` | Nova edge function |
| `src/pages/Auth.tsx` | Invocar welcome email após signup |
| `supabase/functions/create-tenant-user/index.ts` | Enviar welcome email ao final da criação |

