
Objetivo: eliminar vazamento de dados entre tenants (dashboard/governança/relatórios/análises/campanhas), garantindo que uma empresa nova veja apenas dados do próprio tenant (ou vazio).

1) Diagnóstico confirmado (causa raiz)
- O vazamento não está só no frontend; existe abertura de leitura no backend:
  - Migration `20260217140334_85c043cd...` criou políticas públicas com `USING (true)` sem `TO anon`.
  - Isso permite leitura ampla também para usuários autenticados.
- Além disso, várias queries do app não aplicam `tenant_id` explicitamente e dependem apenas de RLS.
- A função de geração de relatório (`generate-report`) usa chave privilegiada e aceita `campaign_id`/`tenant_id` recebidos do cliente sem validação forte de pertencimento, o que amplia risco de acesso indireto cruzado.

2) Correção no backend (prioridade máxima)
2.1 Endurecer políticas públicas
- Criar migration para:
  - Dropar e recriar políticas:
    - `Public read campaigns via invitation`
    - `Public read survey templates`
    - `Public read survey dimensions`
    - `Public read survey items`
    - `Public read tenant branding`
  - Recriar essas políticas com `TO anon` (somente fluxo público do questionário).
- Manter políticas de isolamento por tenant para `authenticated` como fonte de verdade.

2.2 Validar tenant na função de relatório
- Atualizar `supabase/functions/generate-report/index.ts` para:
  - Ler JWT do header `Authorization`.
  - Validar usuário autenticado.
  - Confirmar que o usuário pertence ao `tenant_id` informado (via perfil/tenant do usuário).
  - Confirmar que:
    - `campaign_id` pertence ao mesmo tenant,
    - `report_id` pertence ao mesmo tenant.
  - Em caso de divergência, retornar erro de autorização e não gerar arquivo.
- Resultado: mesmo que alguém tente forçar IDs de outro tenant, a função bloqueia.

3) Correção defensiva no frontend (escopo amplo)
Aplicar filtro explícito por tenant em todas as consultas de campanha/relatórios onde houver coluna `tenant_id`:
- `src/pages/Dashboard.tsx`
  - `survey_campaigns`: adicionar `.eq("tenant_id", tenantId)` em:
    - contagem de campanhas ativas,
    - campanha ativa,
    - última campanha encerrada.
- `src/pages/Governanca.tsx`
  - `survey_campaigns`: adicionar `.eq("tenant_id", tenantId)` na base de participação.
- `src/pages/Relatorios.tsx`
  - `reports`: adicionar `.eq("tenant_id", tenantId)`.
  - `survey_campaigns` (encerradas): adicionar `.eq("tenant_id", tenantId)`.
- `src/pages/Analises.tsx`
  - consultas em `survey_campaigns` (listas e evolução): adicionar `.eq("tenant_id", tenantId)`.
- `src/pages/Campanhas.tsx`
  - listagem de campanhas: adicionar `.eq("tenant_id", tenantId)` (defesa adicional).
  
Observação:
- Isso é “defense in depth”: mesmo com RLS correto, o cliente já pede apenas dados do tenant atual.

4) Higiene de sessão/cache para evitar percepção de “dados fantasma”
- Revisar invalidação de cache React Query na troca de sessão:
  - no logout, limpar/invalidate queries globais para evitar exibição residual de dados de usuário anterior.
- Garantir que telas com `enabled: !!tenantId` também tratem estado vazio de forma segura até carregar perfil/tenant.

5) Validação pós-correção (teste de aceitação)
5.1 Teste com `marciadorh@testepsico.com.br`
- Login e validação em:
  - Dashboard: sem campanhas ativas / sem IGP / sem alertas.
  - Governança: participação/consentimentos/auditoria vazios (ou só registros do próprio tenant, se existirem).
  - Relatórios: sem laudos/relatórios.
  - Análises/Campanhas: sem dados pré-existentes.

5.2 Teste de isolamento cruzado
- Validar com usuário de tenant antigo:
  - continua vendo apenas dados do próprio tenant.
- Confirmar que nenhum usuário vê campanhas de tenant alheio.

5.3 Teste de questionário público
- Abrir `/survey?token=...` anonimamente e confirmar que continua funcionando.
- Confirmar que usuário autenticado de outro tenant não ganha acesso indevido.

5.4 Teste de segurança da função de relatório
- Tentar gerar relatório com `campaign_id` de outro tenant:
  - deve falhar com erro de autorização.

6) Resultado esperado
- Empresa nova (tenant novo) passa a enxergar ambiente “limpo” (apenas seu usuário master e dados criados por ela).
- Sem dados de governança, campanhas, relatórios ou analytics de outras empresas.
- Fluxo público da pesquisa permanece funcional sem abrir leitura indevida para usuários autenticados internos.

Se você aprovar, eu implemento exatamente nessa ordem: (1) migration de políticas, (2) hardening da função de relatório, (3) filtros frontend, (4) limpeza de cache de sessão, (5) validação end-to-end.
