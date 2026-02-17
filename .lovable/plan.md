
# Melhorar Fluxo de Campanhas, Envio por Email e Desativar Colaboradores

## 1. Melhorar usabilidade dos links de convite

**Problema atual:** Os botoes "Copiar Links" e "Exportar CSV" so aparecem para campanhas em status `draft`, `active` ou `scheduled`. Quando a campanha e encerrada ou arquivada, nao ha como consultar os links e status dos convites.

**Solucao:** Tornar os botoes de consulta de links visiveis em **todos os status** (inclusive `closed` e `archived`). Alem disso, adicionar um botao dedicado "Ver Convites" que abre um dialog com a lista completa de convites, seus status (respondido/pendente) e links individuais copiáveis.

### Mudancas em `src/pages/Campanhas.tsx`:
- Remover a restricao de status na condicao `hasInvites && (c.status === "draft" || ...)` para os botoes de Copiar Links e Exportar CSV -- tornar disponivel para qualquer status com convites
- Adicionar botao "Enviar por Email" (detalhado na secao 2)
- Reorganizar botoes de acao: acoes de status (Ativar, Encerrar, Arquivar) separadas das acoes de distribuicao (Copiar Links, Exportar CSV, Enviar por Email)

## 2. Envio de questionarios por email

**Implementacao:** Criar uma edge function `send-survey-emails` que:
- Recebe `campaign_id` como parametro
- Busca todos os convites nao utilizados da campanha com dados do colaborador (nome, email)
- Busca dados do tenant (nome, logo) e da campanha (nome, mensagem de convite)
- Envia email para cada colaborador com seu link individual usando o servico de email nativo do Supabase (Inbucket em dev / SMTP configurado em producao)
- Retorna contagem de emails enviados

### Arquivos:
- **Novo:** `supabase/functions/send-survey-emails/index.ts`
- **Editar:** `supabase/config.toml` -- adicionar configuracao da funcao
- **Editar:** `src/pages/Campanhas.tsx` -- adicionar botao "Enviar por Email" com confirmacao

### Fluxo no frontend:
1. Usuario clica "Enviar por Email" no card da campanha
2. Dialog de confirmacao mostra quantos emails serao enviados (convites pendentes com email)
3. Ao confirmar, invoca a edge function
4. Toast de sucesso/erro com contagem

### Detalhes da edge function:
- Usa `SUPABASE_SERVICE_ROLE_KEY` para acessar dados
- Monta email HTML com branding do tenant, nome do colaborador e link unico
- Usa a Supabase Auth Admin API (`auth.admin.createUser` nao se aplica) -- na verdade, usara fetch direto para enviar via Resend ou similar

**Nota:** Como nao ha servico de email externo configurado, a edge function gerara os emails no formato correto e registrara o envio. Para producao real, sera necessario conectar um servico como Resend. Por ora, a funcao simulara o envio e registrara em log, mostrando os emails que seriam enviados.

**Alternativa recomendada:** Usar o Resend (servico de email) que requer uma API key. A funcao verificara se a secret `RESEND_API_KEY` existe; se sim, envia de verdade; se nao, apenas loga e retorna sucesso simulado com aviso.

## 3. Desativar colaboradores (exceto Mauricio Campos e Marco Macedo)

Executar via SQL direto no banco:

```sql
UPDATE employees 
SET is_active = false 
WHERE id NOT IN (
  'e83fa721-4cc1-44d1-baaa-353666204096',  -- Mauricio Campos
  '7e45ff05-b223-47c2-a00c-59d0853b432f'   -- Marco Macedo
);
```

## Resumo de arquivos

| Arquivo | Acao |
|---------|------|
| `src/pages/Campanhas.tsx` | Editar: links visiveis em todos status, botao Enviar por Email com dialog de confirmacao |
| `supabase/functions/send-survey-emails/index.ts` | Novo: edge function para envio de emails |
| `supabase/config.toml` | Editar: adicionar config da nova funcao |

### Dados a atualizar
- Desativar 50 colaboradores (manter apenas 2 ativos)
