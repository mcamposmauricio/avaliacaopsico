

# Integrar Resend (chamada direta) para Envio de Emails

## Resumo

Atualizar a Edge Function `send-survey-emails` para usar a API do Resend diretamente (`https://api.resend.com/emails`), sem o gateway do Lovable Cloud.

## Etapas

### 1. Adicionar secret `RESEND_API_KEY`
- Solicitar ao usuário a chave de API do Resend via ferramenta `add_secret`
- Obter a chave em: [resend.com/api-keys](https://resend.com/api-keys)

### 2. Reescrever `supabase/functions/send-survey-emails/index.ts`

**Mudanças principais:**
- Chamada direta a `https://api.resend.com/emails` com `Authorization: Bearer ${RESEND_API_KEY}`
- Remover modo simulado — retornar erro se `RESEND_API_KEY` não existir
- Remetente: `onboarding@resend.dev` (teste) — depois domínio próprio
- Novo template de email conforme padrão fornecido:

**Assunto:** `Convite: Avaliação de Riscos Psicossociais - Participe!`

**Corpo:** Saudação com nome do colaborador, nome da empresa, bullets sobre anonimato/LGPD, link da avaliação, data limite (campo `ends_at` da campanha), assinatura "Equipe de RH"

### Arquivo alterado

| Arquivo | Ação |
|---|---|
| `supabase/functions/send-survey-emails/index.ts` | Reescrever — API direta Resend + novo template |

