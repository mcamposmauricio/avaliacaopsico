
# Incorporacao do Padrao Metodologico Flew — Plano de Implementacao

## Contexto

O sistema atual possui toda a infraestrutura tecnica necessaria (multi-tenant, campanhas, scoring, relatorios, RBAC), mas utiliza dimensoes genericas e formulas de scoring diferentes do padrao Flew. Este plano alinha o sistema integralmente com o Flew Psychosocial Index (FPI).

## Mudancas Criticas Identificadas

| # | Item | Estado Atual | Flew Requerido |
|---|------|-------------|----------------|
| 1 | Formula de scoring | (media-1)/4 x 100 (0-100) | media x 20 (20-100) |
| 2 | Direcao do score | Maior = melhor | Maior = maior risco |
| 3 | Classificacao de risco | 75/60 (invertido) | 0-33 / 34-66 / 67-100 |
| 4 | Labels Likert | Discordo...Concordo | Nunca...Sempre |
| 5 | Dimensoes | 6 genericas | 8 Flew especificas (30 itens) |
| 6 | Missing data | Sem tratamento | >=90% valido, regra por dimensao |
| 7 | Alertas automaticos | Inexistente | Score >= 67 em dimensoes criticas |
| 8 | Disclaimer | Inexistente | Texto obrigatorio no sistema e laudos |
| 9 | Laudo NR-1 | Basico (6 secoes) | Completo (17 secoes) |
| 10 | Dashboard Visao Geral | KPIs simples | Gauge IGP + Top 3 criticas + adesao |

---

## Fase 1 — Dados Flew (Banco de Dados)

### 1.1 Seed do Questionario FPI

Inserir via migration/insert um template "Flew Psychosocial Index (FPI) v1.0" com:

- 8 dimensoes com nomes exatos:
  1. Demandas de Trabalho (4 itens)
  2. Autonomia e Controle (4 itens)
  3. Clareza e Organizacao do Trabalho (4 itens)
  4. Lideranca e Justica Organizacional (4 itens)
  5. Relacoes Sociais no Trabalho (4 itens)
  6. Reconhecimento, Sentido e Satisfacao (4 itens)
  7. Trabalho e Vida Pessoal (3 itens)
  8. Sinais de Desgaste Relacionados ao Trabalho (3 itens)

- 30 itens com texto exato do documento, flags de inversao corretos

Os 30 itens e seus flags de inversao conforme o documento:

```
Dim 1 - Demandas de Trabalho:
  1. Minha carga de trabalho e adequada para o tempo disponivel. (invertida)
  2. Preciso trabalhar muito rapido para conseguir cumprir minhas tarefas.
  3. Meu trabalho exige atencao constante durante a maior parte do tempo.
  4. Meu trabalho exige lidar com demandas emocionais com frequencia.

Dim 2 - Autonomia e Controle:
  5. Tenho autonomia para organizar a forma como realizo meu trabalho. (invertida)
  6. Posso influenciar decisoes que afetam diretamente meu trabalho. (invertida)
  7. Tenho liberdade para tomar iniciativas no meu dia a dia. (invertida)
  8. Sinto que tenho pouco controle sobre o ritmo e a forma do meu trabalho.

Dim 3 - Clareza e Organizacao do Trabalho:
  9. Sei exatamente quais sao minhas responsabilidades no trabalho. (invertida)
  10. Recebo informacoes suficientes para realizar bem meu trabalho. (invertida)
  11. Sou informado com antecedencia sobre mudancas importantes que afetam meu trabalho. (invertida)
  12. As metas e prioridades do meu trabalho sao claras. (invertida - deduzido pelo padrao da dimensao)

Dim 4 - Lideranca e Justica Organizacional:
  13. Meu trabalho e reconhecido e valorizado pela lideranca. (invertida)
  14. Sou tratado de forma justa no ambiente de trabalho. (invertida)
  15. Posso contar com apoio do meu gestor imediato quando necessario. (invertida)
  16. Os conflitos no ambiente de trabalho sao tratados de forma adequada. (invertida - deduzido)

Dim 5 - Relacoes Sociais no Trabalho:
  17. Existe cooperacao entre as pessoas da minha equipe. (invertida)
  18. O clima de respeito entre colegas e positivo. (invertida)
  19. Sinto-me a vontade para expressar opinioes no trabalho. (invertida)
  20. Relacoes interpessoais dificultam meu desempenho no trabalho.

Dim 6 - Reconhecimento, Sentido e Satisfacao:
  21. Sinto que meu trabalho tem significado para mim. (invertida)
  22. Acredito que meu trabalho e importante para a empresa. (invertida)
  23. Estou satisfeito com meu trabalho de forma geral. (invertida)
  24. Sinto falta de reconhecimento pelo trabalho que realizo.

Dim 7 - Trabalho e Vida Pessoal:
  25. Meu trabalho exige tanta energia que impacta negativamente minha vida pessoal.
  26. Meu trabalho exige tanto tempo que afeta negativamente minha vida pessoal.
  27. Consigo equilibrar bem meu trabalho e minha vida pessoal. (invertida)

Dim 8 - Sinais de Desgaste Relacionados ao Trabalho:
  28. Sinto-me frequentemente esgotado ao final do dia de trabalho.
  29. Tenho dificuldade de me desligar do trabalho fora do horario.
  30. Sinto-me emocionalmente sobrecarregado pelo trabalho.
```

Nota sobre item 12: O documento PDF nao marca explicitamente como invertido, mas "As metas e prioridades do meu trabalho sao claras" segue o mesmo padrao positivo da dimensao. Sera marcado como invertido para consistencia.

Nota sobre item 16: Idem - "Os conflitos sao tratados de forma adequada" e positivo, portanto invertido.

### 1.2 Tabela de alertas (nova)

Criar tabela `risk_alerts`:
- id, tenant_id, campaign_id, dimension_id, dimension_name, score, alert_type ('elevated_risk'), created_at, resolved_at, resolved_by
- RLS: tenant isolation

---

## Fase 2 — Motor de Scoring Flew

### 2.1 Edge Function `process-scoring`

Alterar a formula de normalizacao:

**Antes:** `score = ((avg - 1) / 4) * 100` (range 0-100)
**Depois:** `score = avg * 20` (range 20-100)

Onde `avg` ja considera itens invertidos (6 - resposta).

### 2.2 Regras de missing data

Adicionar no `process-scoring`:

1. Se respondente completou < 90% dos 30 itens: descartar resposta inteira (nao marcar is_complete ou filtrar)
2. Dentro de uma dimensao:
   - 1 item sem resposta: calcular media dos demais
   - 2+ itens sem resposta: excluir a dimensao daquele respondente

### 2.3 Alertas automaticos

Apos calcular campaign_scores, verificar se alguma dimensao tem score >= 67. Se sim, e especialmente nas dimensoes criticas (Lideranca, Demandas, Trabalho-Vida Pessoal), inserir registro na tabela `risk_alerts`.

---

## Fase 3 — Classificacao de Risco Flew

### Nova funcao de classificacao (usada em todo o frontend)

```
0-33  -> "Baixo risco"   (verde)  -> "Condicoes adequadas"
34-66 -> "Atencao"        (amarelo) -> "Necessita monitoramento"
67-100 -> "Risco elevado" (vermelho) -> "Requer acao prioritaria"
```

**Importante**: A direcao muda. No sistema atual, score alto = bom. No Flew, score alto = risco. Todos os componentes de UI (badges, barras de progresso, cores) serao atualizados.

Arquivos afetados:
- `Dashboard.tsx` — funcoes getBarColor, getScoreBadge
- `Analises.tsx` — funcao getScoreColor
- `PlanoAcao.tsx` — lista de dimensoes

---

## Fase 4 — Frontend: Dashboards Flew

### 4.1 Dashboard.tsx — Visao Geral (C-Level)

Adicionar:
- Gauge/velocimetro visual para o IGP (componente SVG semicircular com agulha)
- Classificacao geral com texto interpretativo ("Condicoes adequadas" / "Necessita monitoramento" / "Requer acao prioritaria")
- Top 3 dimensoes criticas (maiores scores = maiores riscos)
- Taxa de adesao ja existente
- Disclaimer Flew no rodape

Inverter a logica de cores:
- Score baixo (0-33) = verde = bom
- Score medio (34-66) = amarelo = atencao
- Score alto (67-100) = vermelho = risco

### 4.2 Analises.tsx — Dimensoes Psicossociais

Aba "Dimensoes":
- Grafico de barras horizontais com as 8 dimensoes
- Linha de corte visual em 67 (ReferenceLine)
- Tooltip com interpretacao automatica da dimensao

Aba "Heatmap":
- Manter estrutura atual, atualizar cores para nova classificacao

Aba "Comparativo":
- Adicionar media da empresa como referencia
- Radar ou barras agrupadas: Area A vs Area B vs Media

Aba "Evolucao":
- Linha do tempo do IGP por campanha (ja existe)
- Adicionar linha de referencia em 67

### 4.3 Alertas no Dashboard

Adicionar card de alertas quando existem dimensoes com score >= 67:
- Icone de alerta
- Nome da dimensao
- Score
- Sugestao de acao (link para Plano de Acao)

---

## Fase 5 — SurveyRuntime Flew

### 5.1 Labels Likert

Alterar de:
```
"Discordo totalmente", "Discordo", "Neutro", "Concordo", "Concordo totalmente"
```
Para:
```
"Nunca / Quase nunca", "Raramente", "As vezes", "Frequentemente", "Sempre"
```

### 5.2 Disclaimer no consentimento

Adicionar no termo de consentimento:
> "Este instrumento avalia fatores organizacionais de risco psicossocial relacionados ao trabalho. Os resultados nao constituem diagnostico clinico individual, nem substituem avaliacao medica ou psicologica."

### 5.3 Validacao de 90%

Manter a regra existente (completionPct < 0.9) que ja esta implementada.

---

## Fase 6 — Laudo Flew NR-1/GRO

### 6.1 Edge Function `generate-report`

Reestruturar o HTML do laudo tecnico para incluir as 17 secoes do modelo Flew:

1. Capa com dados da empresa e periodo
2. Identificacao das partes (empresa contratante + executora)
3. Objetivo do laudo
4. Fundamentacao legal (NR-1 / GRO)
5. Fundamentacao metodologica (FPI)
6. Procedimentos de coleta
7. Caracterizacao da amostra
8. Criterios de analise e classificacao
9. Resultados consolidados (IGP)
10. Resultados por dimensao
11. Analise por areas/unidades
12. Fatores criticos identificados (score >= 67)
13. Recomendacoes tecnicas
14. Plano de acao sugerido
15. Limitacoes do estudo
16. Conclusao tecnica
17. Disclaimers e assinatura

Usar IA (Gemini Flash) para gerar:
- Analise interpretativa por dimensao
- Recomendacoes tecnicas baseadas nos scores
- Conclusao tecnica

Incluir disclaimer obrigatorio no laudo.

### 6.2 Formula no laudo

Documentar no laudo:
- Score = Media x 20
- Classificacao: 0-33 / 34-66 / 67-100
- Tratamento de itens invertidos: 6 - resposta

---

## Fase 7 — Plano de Acao Flew

### 7.1 Dimensoes atualizadas

Atualizar a lista hardcoded em `PlanoAcao.tsx` de:
```
"Demanda de Trabalho", "Controle sobre o Trabalho", "Suporte Social",
"Reconhecimento", "Equilibrio Vida-Trabalho", "Seguranca Psicologica"
```
Para as 8 dimensoes Flew:
```
"Demandas de Trabalho", "Autonomia e Controle",
"Clareza e Organizacao do Trabalho", "Lideranca e Justica Organizacional",
"Relacoes Sociais no Trabalho", "Reconhecimento, Sentido e Satisfacao",
"Trabalho e Vida Pessoal", "Sinais de Desgaste Relacionados ao Trabalho"
```

### 7.2 Sugestoes automaticas de acao

Quando alertas existem (score >= 67), sugerir acoes pre-definidas por dimensao.

---

## Fase 8 — Governanca e Disclaimer

### 8.1 Disclaimer global

Adicionar texto no rodape do sidebar ou em area visivel:
> "Este instrumento avalia fatores organizacionais de risco psicossocial. Nao constitui diagnostico clinico individual."

### 8.2 Governanca.tsx

Adicionar secao de "Metodologia Flew" mostrando:
- Versao do instrumento (FPI v1.0)
- Total de dimensoes e itens
- Regras de anonimato
- Classificacao de risco utilizada

---

## Secao Tecnica — Resumo de Arquivos

### Banco de dados (migrations)
1. Inserir template FPI v1.0 com 8 dimensoes e 30 itens (INSERT)
2. Criar tabela `risk_alerts`

### Edge Functions
3. `process-scoring/index.ts` — Nova formula (media x 20), missing data rules, geracao de alertas
4. `generate-report/index.ts` — Laudo completo 17 secoes NR-1/GRO

### Frontend
5. `Dashboard.tsx` — Gauge IGP, classificacao Flew, Top 3 criticas, alertas, cores invertidas
6. `Analises.tsx` — Linha de corte 67, cores Flew, comparativo com media empresa
7. `Campanhas.tsx` — Sem mudancas estruturais (apenas cores de classificacao se referenciadas)
8. `Colaboradores.tsx` — Sem mudancas
9. `Estrutura.tsx` — Sem mudancas
10. `Configuracoes.tsx` — Sem mudancas
11. `Relatorios.tsx` — Sem mudancas estruturais
12. `PlanoAcao.tsx` — Lista de 8 dimensoes Flew, sugestoes automaticas
13. `Governanca.tsx` — Secao de metodologia Flew
14. `SurveyRuntime.tsx` — Labels Likert Flew, disclaimer no consentimento
15. `AppSidebar.tsx` — Disclaimer no footer

### Sem mudancas em
- Roteamento (App.tsx)
- Autenticacao (Auth.tsx, useAuth.tsx)
- RBAC (RoleGate.tsx, useTenant.tsx)
- Design system (index.css, tailwind.config.ts)
- Componentes UI base
