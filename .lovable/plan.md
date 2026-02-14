
# Plano de Correções — Fluxo End-to-End

## Problemas Identificados

Após testes detalhados no preview e análise dos dados no banco, o sistema funciona em sua maior parte, mas existem problemas pontuais que impedem o fluxo completo:

| # | Problema | Impacto |
|---|---------|---------|
| 1 | Encerrar campanha sem respostas nao avisa o usuario | Alto |
| 2 | Campanha muda para "closed" mesmo sem respostas | Alto |
| 3 | Pagina Analises pode mostrar "sem dados" brevemente antes do tenantId carregar | Baixo |
| 4 | Confirmacao de email obrigatoria dificulta testes | Medio |

---

## Correção 1 — Validar respostas antes de encerrar campanha

**Arquivo**: `src/pages/Campanhas.tsx`

Na mutacao `closeCampaign`, apos chamar `process-scoring`, verificar o retorno. Se `responses_processed === 0`, exibir um toast de aviso e NAO mudar o status para "closed".

Logica:
1. Chamar `process-scoring`
2. Verificar `res.data.responses_processed`
3. Se zero: mostrar toast "Nenhuma resposta completa encontrada. Nao e possivel encerrar."
4. Se > 0: prosseguir com a atualizacao de status para "closed"

---

## Correção 2 — Confirmacao de email e toast de erro no login

**Arquivo**: `src/pages/Auth.tsx`

O toast de erro ja existe (linha 40), mas o feedback visual e discreto. Melhorar para exibir mensagens mais claras:
- "Credenciais invalidas" em vez do erro tecnico do Supabase
- Apos signup, sugerir verificar a caixa de spam

---

## Correção 3 — Proteção na query de Analises

**Arquivo**: `src/pages/Analises.tsx`

A query de campanhas ja tem `enabled: !!tenantId`, mas o estado inicial `selectedCampaignId === ""` pode causar queries subsequentes com campaignId vazio. Adicionar guard para garantir que nenhuma query roda com ID vazio.

---

## Correção 4 — Melhorar feedback nos botoes de Relatorios

**Arquivo**: `src/pages/Relatorios.tsx`

Adicionar tratamento para o caso de `report_id` invalido na edge function (ja aconteceu no teste: o report_id "test-dummy" nao existe mas a funcao nao falha — o update simplesmente nao encontra a row). Adicionar verificacao de que o insert do report foi bem-sucedido antes de chamar a edge function.

---

## Resumo Tecnico

As correcoes sao pontuais e envolvem:
- **Campanhas.tsx**: Adicionar verificacao de `responses_processed` no retorno do scoring
- **Auth.tsx**: Melhorar mensagens de erro no login/signup  
- **Analises.tsx**: Guard adicional para queries com ID vazio
- **Relatorios.tsx**: Verificacao de insert antes de chamar edge function

Nenhuma alteracao de banco de dados ou edge functions e necessaria — ambos funcionam corretamente nos testes.
