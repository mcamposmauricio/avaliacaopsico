

# Campanha Operacional Completa -- Plano de Implementacao

## Estado Atual

O sistema ja possui a maioria das funcionalidades solicitadas:

- Gestao de campanhas com estados (draft, active, closed, archived)
- Convites com tokens criptograficos e uso unico
- SurveyRuntime com consentimento LGPD, questionario Likert, submissao anonima
- Motor de scoring Flew (process-scoring)
- Isolamento PII (dados pessoais separados das respostas)
- Validacao de completude minima (90%)
- Metricas de adesao no Dashboard (campanha ativa)
- Configuracao white label (logo, cores) em Configuracoes

## O Que Falta Implementar

### 1. Estado `scheduled` na campanha

Adicionar o valor `scheduled` ao enum `campaign_status` no banco de dados. Atualizar o `statusConfig` em `Campanhas.tsx` para incluir o novo estado com label "Agendada" e cor apropriada.

### 2. Validacao de periodo e status no SurveyRuntime

Atualmente, o SurveyRuntime nao verifica se a campanha esta ativa ou dentro do periodo de coleta. Adicionar validacoes:
- Verificar se `campaign.status === 'active'`
- Verificar se a data atual esta entre `starts_at` e `ends_at` (quando definidos)
- Exibir mensagem de erro especifica se a campanha estiver encerrada ou fora do periodo

### 3. Metricas de adesao por campanha (painel expandido)

Adicionar em cada card de campanha (em `Campanhas.tsx`) um painel expansivel mostrando:
- Total de elegiveis (convites gerados)
- Respostas recebidas
- Taxa de adesao (%)
- Convites pendentes
- Barra de progresso visual

Isso requer uma query adicional para buscar estatisticas de convites por campanha.

### 4. Exportacao e copia de links de convite

Adicionar funcionalidades no card da campanha (status `active` ou `draft` com convites):
- Botao "Copiar Links" -- copia todos os links individuais para a area de transferencia
- Botao "Exportar CSV" -- exporta uma planilha com nome do colaborador e link unico
- Cada link no formato: `{origin}/survey?token={token}`

### 5. Importacao CSV de colaboradores

Adicionar em `Colaboradores.tsx`:
- Botao "Importar CSV"
- Dialog com instrucoes e area de upload
- Parser CSV que aceita colunas: nome, email, departamento, cargo
- Validacao de campos obrigatorios (nome, email)
- Match automatico de departamento/cargo existentes por nome
- Preview dos dados antes de confirmar importacao
- Insercao em batch

### 6. White label no SurveyRuntime

O SurveyRuntime atualmente nao aplica a identidade visual do tenant. Adicionar:
- Buscar dados do tenant (logo, nome, cores) via a campanha vinculada
- Exibir logo do cliente no topo da tela de consentimento e agradecimento
- Aplicar cor primaria do tenant nos botoes e elementos de destaque
- Exibir nome da empresa no header

### 7. Mensagem de convite personalizada

O campo `invite_message` ja existe na campanha mas nao e exibido. Mostrar a mensagem de convite na tela de consentimento do SurveyRuntime, quando disponivel.

---

## Detalhes Tecnicos

### Migration SQL

```sql
ALTER TYPE campaign_status ADD VALUE 'scheduled';
```

### Arquivos Modificados

| Arquivo | Mudanca |
|---------|---------|
| `src/pages/Campanhas.tsx` | Adicionar `scheduled` ao statusConfig, painel de adesao expansivel, botoes de exportar/copiar links |
| `src/pages/SurveyRuntime.tsx` | Validacao de periodo/status, white label (logo, cores, nome empresa), exibir invite_message |
| `src/pages/Colaboradores.tsx` | Botao e dialog de importacao CSV com preview e validacao |

### Arquivos Novos

Nenhum arquivo novo necessario. Todas as mudancas sao em arquivos existentes.

### Sem Mudancas

- Edge functions (process-scoring, generate-report, seed-test-data)
- Tabelas do banco (exceto enum)
- RLS policies
- Autenticacao
- Dashboard (ja possui metricas de adesao)

