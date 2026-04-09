

# Plano: Corrigir acesso à avaliação

## Problema identificado

Duas causas simultâneas impedem o acesso:

1. O convite enviado por email (id `354a1f6f`) pertence à campanha `1257aa60` com status **closed**
2. A campanha ativa (`029d4955`) tem `ends_at = 2026-03-15`, que já passou (hoje é 09/04/2026) -- mesmo se o convite fosse dessa campanha, o check de data bloquearia

## Solução

### 1. Atualizar `ends_at` da campanha ativa para uma data futura
- Migration: `UPDATE survey_campaigns SET ends_at = '2026-06-30 23:59:59+00' WHERE id = '029d4955-5b91-42e2-ac5f-94c7dbd9b020'`

### 2. Reenviar o email usando o convite correto
- O convite `d68acfcc` (campanha ativa `029d4955`, status `active`, `is_used = false`) é o correto para Ingrid Castro
- Reenviar email via Edge Function usando esse `invitation_id`

### Arquivos/ações

| Ação | Detalhe |
|---|---|
| Migration SQL | Atualizar `ends_at` da campanha ativa |
| Reenvio de email | Invocar `send-survey-emails` com `invitation_ids: ["d68acfcc-4292-4701-acaf-9181e80361c1"]` e `campaign_id: "029d4955-5b91-42e2-ac5f-94c7dbd9b020"` |

Após isso, o link no novo email apontará para a campanha ativa com data válida.

