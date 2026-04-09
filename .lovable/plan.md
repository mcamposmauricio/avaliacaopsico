

# Plano: Atualizar domínio de envio para flewpulse.com.br

## Contexto

Atualmente os emails são enviados com o remetente `onboarding@resend.dev` (domínio de teste do Resend). Para usar `flewpulse.com.br`, é necessário:

1. **Verificar o domínio no Resend** — Você precisa adicionar e verificar o domínio `flewpulse.com.br` no painel do Resend (resend.com/domains). Isso envolve adicionar registros DNS (SPF, DKIM, DMARC) no provedor do domínio.

2. **Atualizar a Edge Function** — Alterar a linha do remetente em `supabase/functions/send-survey-emails/index.ts`:
   - De: `${tenantName} <onboarding@resend.dev>`
   - Para: `${tenantName} <noreply@flewpulse.com.br>`

3. **Deploy** da função atualizada.

## Pré-requisito (sua ação)

Antes de eu fazer a alteração, confirme que o domínio `flewpulse.com.br` já está verificado no Resend. Se ainda não está:
1. Acesse [resend.com/domains](https://resend.com/domains)
2. Adicione `flewpulse.com.br`
3. Configure os registros DNS indicados pelo Resend no provedor do domínio
4. Aguarde a verificação ficar verde

## Alteração técnica

| Arquivo | Mudança |
|---|---|
| `supabase/functions/send-survey-emails/index.ts` | Trocar `onboarding@resend.dev` por `noreply@flewpulse.com.br` |

Após a verificação do domínio, os emails serão enviados para qualquer destinatário (sem a restrição do sandbox do Resend).

