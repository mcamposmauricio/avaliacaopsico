

# Remover Botoes de Teste e Popular Dados Reais

## 1. Remover TestModeButton de todas as paginas

Remover o componente `TestModeButton` e suas importacoes de 6 arquivos:

| Arquivo | Linhas a remover |
|---------|-----------------|
| `src/pages/Campanhas.tsx` | Import + bloco TestModeButton (linhas 17, 214-222) |
| `src/pages/Colaboradores.tsx` | Import + bloco TestModeButton (linhas 16, 179-197) |
| `src/pages/Estrutura.tsx` | Import + bloco TestModeButton (linhas 14, 52-77) |
| `src/pages/PlanoAcao.tsx` | Import + bloco TestModeButton (linhas 17, 111-129) |
| `src/pages/Governanca.tsx` | Import + bloco TestModeButton (linhas 11, 48-64) |
| `src/pages/Relatorios.tsx` | Import + bloco TestModeButton (linhas 10, 119-144) |

Deletar o arquivo `src/components/TestModeButton.tsx`.

## 2. Popular dados para validacao completa

O banco ja possui dados base (50 colaboradores, 1 campanha fechada com 100 respostas, 8 dimensoes com scores). Porem:
- Todos os scores estao na faixa 57-63 ("Atencao"), sem risk_alerts
- Faltam campanhas com variacao de risco para validar dashboards e alertas

### Dados a inserir via edge function `seed-test-data`

Chamar a edge function existente com parametros para criar uma segunda campanha de teste. Alem disso, inserir manualmente:

**Risk alerts** para a campanha existente (scores artificialmente elevados em dimensoes criticas):
- "Demandas de Trabalho" com score 72 (risco elevado, critico)
- "Trabalho e Vida Pessoal" com score 69 (risco elevado, critico)

**Planos de acao** vinculados a campanha fechada e as dimensoes de risco.

**Gerar relatórios** (laudo tecnico + relatorio executivo) para a campanha fechada, invocando a edge function `generate-report`.

### Sequencia de execucao

1. Remover todos os TestModeButton (6 arquivos + deletar componente)
2. Inserir risk_alerts para dimensoes criticas
3. Inserir planos de acao vinculados
4. Invocar `generate-report` para gerar laudo tecnico
5. Invocar `generate-report` para gerar relatorio executivo

## Detalhes Tecnicos

### Insercao de risk_alerts (SQL via insert tool)

```sql
INSERT INTO risk_alerts (tenant_id, campaign_id, dimension_id, dimension_name, score, alert_type)
VALUES
  ('<tenant_id>', 'fdf1cfb7-...', 'd1000001-...-000000000001', 'Demandas de Trabalho', 72.0, 'critical_risk'),
  ('<tenant_id>', 'fdf1cfb7-...', 'd1000001-...-000000000007', 'Trabalho e Vida Pessoal', 69.0, 'critical_risk');
```

### Geracao de relatorios

Invocar a edge function `generate-report` duas vezes:
1. `{ campaign_id, report_type: "technical", tenant_id, report_id }`
2. `{ campaign_id, report_type: "executive", tenant_id, report_id }`

Isso gera os HTMLs no storage e popula a tabela `reports` com URLs para preview e download PDF.

### Arquivos removidos
- `src/components/TestModeButton.tsx`

### Arquivos editados
- `src/pages/Campanhas.tsx`
- `src/pages/Colaboradores.tsx`
- `src/pages/Estrutura.tsx`
- `src/pages/PlanoAcao.tsx`
- `src/pages/Governanca.tsx`
- `src/pages/Relatorios.tsx`
