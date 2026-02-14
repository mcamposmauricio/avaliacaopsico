
# Plano de Implementacao — Lacunas Identificadas

## Resumo das Lacunas

Com base no documento tecnico e no codigo atual, as seguintes lacunas precisam ser preenchidas:

| # | Lacuna | Criticidade |
|---|--------|-------------|
| 1 | Scoring Engine (Edge Function) | Alta |
| 2 | Geracao de PDF (Edge Function) | Alta |
| 3 | Dashboards conectados a dados reais | Alta |
| 4 | Seed data de demonstracao | Alta |
| 5 | Upload de logo do tenant | Media |
| 6 | Diferenciacao RBAC na UI | Media |
| 7 | Indices de performance no banco | Media |
| 8 | Storage bucket para PDFs e logos | Media |
| 9 | Header dinamico com nome do tenant | Baixa |
| 10 | Trigger de scoring ao encerrar campanha | Alta |

---

## Parte 1 — Banco de Dados

### 1.1 Storage bucket
- Criar bucket `reports` (privado) para PDFs
- Criar bucket `logos` (publico) para logos de tenant
- RLS: leitura por tenant, upload restrito a admin_rh

### 1.2 Indices compostos de performance
```text
CREATE INDEX idx_survey_responses_campaign ON survey_responses(campaign_id);
CREATE INDEX idx_survey_answers_response ON survey_answers(response_id);
CREATE INDEX idx_campaign_scores_campaign ON campaign_scores(campaign_id);
CREATE INDEX idx_group_scores_campaign ON group_scores(campaign_id, group_type);
CREATE INDEX idx_employees_tenant ON employees(tenant_id, is_active);
CREATE INDEX idx_survey_invitations_token ON survey_invitations(token);
```

### 1.3 Politica UPDATE para survey_invitations
- Atualmente o respondente anonimo nao consegue marcar `is_used = true` ao submeter.
- Criar policy de UPDATE anonimo restrita a marcar convite como usado.

---

## Parte 2 — Edge Function: Scoring Engine

### Funcao `process-scoring`
Chamada ao encerrar uma campanha (botao "Encerrar" em Campanhas.tsx).

Algoritmo:
1. Buscar template da campanha (dimensoes + itens + is_inverted)
2. Buscar todas as respostas completas da campanha
3. Para cada resposta:
   - Aplicar inversao nos itens invertidos: `score = 6 - value`
   - Calcular media por dimensao
   - Converter para escala 0-100: `((media - 1) / 4) * 100`
   - Inserir em `response_scores`
4. Agregar por campanha:
   - Media, min, max, desvio padrao por dimensao
   - Inserir em `campaign_scores`
5. Agregar por grupo (departamento, unidade, cargo):
   - Calcular media por dimensao por grupo
   - Marcar `is_suppressed = true` se N < min_group_size do tenant
   - Inserir em `group_scores`

Usa service role key para acesso total as tabelas.

---

## Parte 3 — Edge Function: Geracao de PDF

### Funcao `generate-report`
Chamada ao clicar "Gerar Laudo" ou "Gerar Relatorio Executivo" em Relatorios.tsx.

Fluxo:
1. Receber `campaign_id`, `report_type`, `tenant_id`
2. Buscar dados de `campaign_scores` e `group_scores`
3. Buscar branding do tenant (nome, cores)
4. Montar HTML com template do relatorio
5. Usar modelo de IA (Gemini Flash) para gerar sumario executivo baseado nos dados
6. Converter HTML para PDF (usando a lib jsPDF no Deno)
7. Salvar no bucket `reports`
8. Atualizar `file_url` no registro da tabela `reports`

Tipos de relatorio:
- **Laudo Tecnico**: Todas as dimensoes, scores por grupo, metodologia, graficos
- **Relatorio Executivo**: Resumo, top 3 riscos, recomendacoes, indice geral

---

## Parte 4 — Dashboards com Dados Reais

### 4.1 Dashboard.tsx
Substituir dados hardcoded por queries reais:
- KPI "Campanhas Ativas": `count` de `survey_campaigns` com status = active
- KPI "Taxa de Adesao": convites usados / total convites da campanha ativa
- KPI "Colaboradores": `count` de `employees` ativos
- KPI "Indice Geral": media dos `campaign_scores.avg_score` da ultima campanha encerrada
- Dimensoes psicossociais: dados de `campaign_scores` da ultima campanha
- Campanha ativa: progresso real de convites/respostas

### 4.2 Analises.tsx
Substituir dados hardcoded por queries reais:
- **Radar**: `campaign_scores` com join em `survey_dimensions`
- **Heatmap**: `group_scores` filtrado por `group_type = 'department'`, respeitando `is_suppressed`
- **Comparativo**: mesmos dados do heatmap em formato de barras
- **Evolucao**: `campaign_scores` de multiplas campanhas ordenadas por data
- Seletor de campanha para filtrar os dados
- Aplicar regra N >= min_group_size (respeitar flag `is_suppressed`)

---

## Parte 5 — Seed Data de Demonstracao

Inserir via SQL (usando insert tool):
- 1 tenant "Empresa Demo" com branding
- 3 org_units (Matriz SP, Filial RJ, Filial MG)
- 8 departments distribuidos nas unidades
- 12 job_roles
- ~50 employees distribuidos
- 1 survey_template "Avaliacao Psicossocial v1" com 6 dimensoes e ~30 itens
- 2 campanhas (Q4 2025 encerrada, Q1 2026 ativa)
- ~200 respostas simuladas na campanha encerrada
- Scores pre-calculados em response_scores, campaign_scores, group_scores
- Convites parcialmente usados na campanha ativa (para mostrar progresso)

---

## Parte 6 — Upload de Logo

### 6.1 Configuracoes.tsx
- Adicionar campo de upload de logo com preview
- Upload para bucket `logos` usando Supabase Storage
- Salvar URL em `tenants.logo_url`

### 6.2 AppLayout.tsx e AppSidebar.tsx
- Exibir logo do tenant no header e sidebar (se configurado)
- Fallback para iniciais "AP" se nao houver logo

---

## Parte 7 — Diferenciacao RBAC na UI

### 7.1 Hook useTenant
- Ja retorna `roles` — usar para controlar visibilidade

### 7.2 Regras de visibilidade
- **admin_rh**: acesso total (configuracoes, governanca, todos os modulos)
- **gestor**: ver dashboards e analises apenas da sua area, plano de acao
- **diretoria**: ver dashboards gerais e relatorios, sem editar configuracoes
- **auditoria**: somente leitura de governanca e relatorios

### 7.3 Implementacao
- Criar componente `RoleGate` que mostra/oculta conteudo por role
- Filtrar itens do sidebar conforme role do usuario
- Desabilitar botoes de edicao para roles somente leitura

---

## Parte 8 — Header Dinamico

### AppLayout.tsx
- Substituir "Empresa Demo" pelo `tenant.name` real
- Exibir nome do usuario logado (de `profile.full_name`)
- Aplicar cores do tenant no header (primary_color)

---

## Parte 9 — Integracao: Scoring ao Encerrar

### Campanhas.tsx
- Ao clicar "Encerrar", chamar a edge function `process-scoring` antes de mudar status
- Mostrar loading/feedback durante processamento
- Apos scoring concluido, mudar status para "closed"

### Relatorios.tsx
- Ao clicar "Gerar Laudo/Relatorio", chamar edge function `generate-report`
- Mostrar loading e atualizar lista quando PDF estiver pronto
- Habilitar botao de download com a `file_url`

---

## Ordem de Implementacao

1. Migracao SQL: indices, buckets, policy de update para invitations
2. Edge Function `process-scoring`
3. Edge Function `generate-report`
4. Seed data de demonstracao
5. Dashboard.tsx e Analises.tsx com dados reais
6. Upload de logo + header dinamico
7. Diferenciacao RBAC (RoleGate + sidebar filtrado)
8. Integracao dos botoes com as edge functions
9. Campanhas.tsx chamando scoring ao encerrar

---

## Detalhes Tecnicos

- **Edge Functions**: Deno runtime, usam `SUPABASE_SERVICE_ROLE_KEY` para bypass de RLS
- **PDF**: Uso de template HTML renderizado como string, convertido via jsPDF ou similar no Deno
- **Storage**: Buckets criados via SQL migration (`storage.buckets`)
- **RBAC UI**: Componente wrapper `RoleGate` que verifica `roles` do hook `useTenant`
- **Seed data**: SQL com UUIDs fixos para garantir referencia cruzada entre entidades
