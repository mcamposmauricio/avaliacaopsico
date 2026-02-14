

# Sistema de Avaliação Psicossocial — Plano de Implementação

## Visão Geral
Sistema SaaS corporativo multi-tenant para avaliação psicossocial organizacional, com coleta anônima, scoring automático, dashboards analíticos e geração de relatórios. Design clean e corporativo (azul/cinza).

---

## Fase 1 — Fundação e Autenticação

### 1.1 Design System & Layout Base
- Tema corporativo (paleta azul escuro, cinza, branco)
- Layout com sidebar de navegação colapsável
- Header com logo, nome do tenant e menu do usuário
- Suporte a white label (logo, cores, nome configuráveis por tenant)

### 1.2 Autenticação e Multi-Tenant
- Login/registro com email via Lovable Cloud
- Tabela de tenants com branding (logo, cores, nome)
- Tabela de user_roles (admin_rh, gestor, diretoria, auditoria)
- Isolamento por tenant_id em todas as tabelas (RLS)
- Tela de configurações do tenant (política de anonimato, min_group_size, retenção)

---

## Fase 2 — Estrutura Organizacional

### 2.1 Gestão de Unidades e Áreas
- CRUD de unidades organizacionais
- CRUD de departamentos/áreas com hierarquia simples
- CRUD de cargos/funções
- Visualização em árvore da estrutura

### 2.2 Gestão de Colaboradores Elegíveis
- Cadastro de colaboradores (dados mínimos para convite)
- Separação clara: dados pessoais (PII) isolados das respostas
- Associação a unidade, área e cargo

---

## Fase 3 — Campanhas e Questionários

### 3.1 Templates de Questionário
- Templates versionados com dimensões psicossociais
- Itens com escala Likert (1-5)
- Marcação de itens invertidos
- Template padrão pré-carregado para demo

### 3.2 Gestão de Campanhas
- CRUD de campanhas com estados (rascunho → ativa → encerrada → arquivada)
- Definição de período, público elegível, questionário
- Envio de convites (geração de tokens únicos)
- Dashboard de adesão em tempo real

### 3.3 Survey Runtime (Respondente)
- Landing page pública com termo de consentimento LGPD
- Autenticação por token de convite (sem login)
- Formulário responsivo com progresso visual
- Validação de completude (mínimo 90%)
- Submissão única, sem vínculo com identidade

---

## Fase 4 — Processamento e Scoring

### 4.1 Motor de Scoring
- Edge function para processamento assíncrono
- Conversão de itens invertidos (6 − resposta)
- Cálculo de score por dimensão (0-100)
- Índice geral ponderado
- Agregação por grupo organizacional
- Regra de anonimato: resultados apenas se N ≥ min_group_size

### 4.2 Pré-cálculo de Agregados
- Tabelas de scores por campanha e por grupo
- Atualização automática ao encerrar campanha

---

## Fase 5 — Dashboards e Análises

### 5.1 Dashboard Geral
- KPIs principais: taxa de adesão, índice geral, dimensões críticas
- Gráfico radar das dimensões psicossociais
- Barra de progresso da campanha ativa

### 5.2 Análises Detalhadas
- Heatmap por área/unidade (cores verde → amarelo → vermelho)
- Comparativo entre áreas (gráfico de barras)
- Detalhamento por dimensão psicossocial
- Evolução temporal entre campanhas (gráfico de linha)
- Filtros respeitando regra de anonimato (um critério por vez)

---

## Fase 6 — Relatórios e Plano de Ação

### 6.1 Geração de Relatórios
- Laudo técnico em PDF (gerado via edge function)
- Relatório executivo resumido em PDF
- Templates com branding do tenant
- Inclusão de gráficos e indicadores
- Armazenamento no Lovable Cloud Storage
- Histórico e versionamento de relatórios

### 6.2 Plano de Ação
- Registro de ações corretivas/preventivas
- Associação a dimensões e áreas identificadas
- Status (pendente, em andamento, concluído)
- Visualização por área ou geral
- Acompanhamento de progresso

---

## Fase 7 — Governança e Compliance

### 7.1 LGPD e Segurança
- Termo de consentimento versionado
- Separação total PII vs respostas analíticas
- Política de retenção configurável por tenant
- Exclusão de PII sem afetar agregados
- Audit log de acessos a dados sensíveis

### 7.2 Histórico e Acompanhamento
- Histórico completo de campanhas anteriores
- Comparação entre períodos/ciclos
- Preservação de integridade dos dados históricos
- Dashboard de evolução organizacional ao longo do tempo

---

## Dados de Demo
- Tenant de exemplo com branding configurado
- Estrutura organizacional com 3 unidades, 8 áreas, 12 cargos
- 2 campanhas (uma encerrada com dados, uma ativa)
- ~200 respostas simuladas para dashboards ricos
- Scores e agregados pré-calculados
- Relatório PDF de exemplo

---

## Resumo Técnico
- **Frontend**: React + TypeScript + Tailwind + shadcn/ui + Recharts
- **Backend**: Lovable Cloud (Supabase) — banco, auth, edge functions, storage
- **Segurança**: RLS por tenant_id, RBAC via tabela user_roles, separação PII
- **Processamento**: Edge functions para scoring e geração de PDFs

