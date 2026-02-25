

# Popular Tenant "Teste Psico" com Dados de Exemplo

## Objetivo
Popular o tenant da usuario `marciadorh@testepsico.com.br` (tenant_id: `babf34c7-9548-4442-a5a4-7bb67bbee7bd`) com dados completos de exemplo, permitindo demonstrar todas as funcionalidades do sistema.

## O que sera criado

### 1. Estrutura Organizacional
- **3 Unidades** (Matriz SP, Filial RJ, Filial BH)
- **8 Departamentos** distribuidos pelas unidades (RH, Financeiro, TI, Comercial, Operacoes, Marketing, Juridico, Engenharia)
- **12 Cargos** (Analista, Coordenador, Gerente, Diretor, Estagiario, Assistente, Supervisor, Especialista, Consultor, Tecnico, Auxiliar, Trainee)

### 2. Colaboradores
- **45 colaboradores** distribuidos entre departamentos e cargos, com emails ficticios

### 3. Template FPI (Questionario)
- **1 Survey Template** FPI v1.0 com as 8 dimensoes padrao Flew
- **30 itens** (perguntas) distribuidos nas dimensoes, incluindo itens invertidos

### 4. Campanhas e Respostas

**Campanha 1 — "Avaliacao Anual 2025" (status: closed)**
- Campanha encerrada com todas as respostas simuladas (45 respondentes)
- Scoring processado (campaign_scores, group_scores, response_scores)
- Alertas de risco gerados
- Dados para gerar relatorios tecnicos e executivos

**Campanha 2 — "Avaliacao Semestral 2026" (status: active)**
- Campanha ativa com ~30 respostas de 45 convites
- ~15 convites ainda pendentes com tokens acessiveis (links de pesquisa funcionais)
- Permite demonstrar o painel de adesao em tempo real

**Campanha 3 — "Piloto Q1 2025" (status: draft)**
- Campanha rascunho sem convites, para demonstrar o fluxo de criacao

### 5. Planos de Acao
- **5 planos de acao** em diferentes status (pendente, em andamento, concluido), vinculados a dimensoes de risco

### 6. Registros de Auditoria
- **10+ logs de auditoria** simulando acoes do usuario (criacao de campanha, ativacao, geracao de relatorio, etc.)

### 7. Registros de Consentimento
- Consentimentos para todas as respostas simuladas

## Implementacao Tecnica

### Novo Edge Function: `supabase/functions/seed-demo-tenant/index.ts`
Uma edge function dedicada que:
1. Recebe o `tenant_id` como parametro
2. Insere toda a estrutura organizacional (org_units, departments, job_roles)
3. Cria 45 colaboradores com dados ficticios brasileiros
4. Cria o template FPI com 8 dimensoes e 30 itens
5. Cria 3 campanhas em diferentes status
6. Simula respostas com distribuicao Likert realista (nao puramente aleatorio — usa pesos por dimensao para criar padroes interessantes de risco)
7. Chama a edge function `process-scoring` para a campanha encerrada
8. Cria convites pendentes na campanha ativa (links de pesquisa funcionais)
9. Insere planos de acao e logs de auditoria
10. Retorna um resumo do que foi criado

### Execucao
A function sera chamada uma unica vez via curl/invoke para popular o tenant. Nao sera necessario alterar nenhum componente frontend — os dados aparecerao automaticamente em todas as telas.

### Sequencia de insercao
```text
org_units -> departments -> job_roles -> employees
-> survey_template -> survey_dimensions -> survey_items
-> campaign_closed -> invitations -> responses -> answers -> consent
-> process-scoring (via fetch)
-> campaign_active -> invitations (parcialmente usados) -> responses parciais
-> campaign_draft
-> action_plans
-> audit_logs
```

### Dados realistas
- Scores simulados com vies por dimensao: "Demandas de Trabalho" tera scores mais altos (risco), "Relacoes Sociais" tera scores mais baixos (saudavel), criando um cenario realista para analises e relatorios
- Nomes brasileiros ficticios para colaboradores
- Datas coerentes (campanha encerrada no passado, ativa no presente)
