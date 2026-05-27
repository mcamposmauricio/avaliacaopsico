# Consolidar templates de questionário

Atualmente o dropdown da tela de Campanhas mostra 4 templates porque a consulta não filtra por tenant. O objetivo é que cada tenant veja **apenas o template mais atualizado** (FPI v1.0 com 8 dimensões × 30 itens).

## Diferenças entre os templates existentes

| Template | Dimensões | Status |
|---|---|---|
| Avaliação Psicossocial v1 | 6 | Obsoleto (estrutura antiga) |
| Flew Psychosocial Index (FPI) v1.0 | 8 | Obsoleto (renomeação intermediária) |
| FPI — Fatores Psicossociais Integrados v1.0 | 8 | **Atual** |

Os três últimos têm a mesma estrutura (8 × 30); a diferença é apenas nome e tenant onde foram semeados.

## Mudanças

### 1. Migração de dados (UPDATE em `survey_templates`)
Marcar como `is_active = false` os templates obsoletos:
- `Avaliação Psicossocial v1` (id `d0000001-...`)
- `Flew Psychosocial Index (FPI) v1.0` (id `a1b2c3d4-...`)

Os dois registros chamados `FPI — Fatores Psicossociais Integrados v1.0` permanecem ativos (um por tenant).

Campanhas já criadas com templates antigos continuam funcionando — o `is_active=false` apenas oculta do dropdown de criação, não quebra histórico.

### 2. Frontend (`src/pages/Campanhas.tsx`, linha 74)
Adicionar filtro por tenant na query:

```ts
const { data, error } = await supabase
  .from("survey_templates")
  .select("id, name")
  .eq("is_active", true)
  .eq("tenant_id", tenantId);
```

Isso garante que mesmo que outros tenants tenham templates ativos no banco, o dropdown só mostre o(s) do tenant logado (defesa em profundidade — RLS é permissiva para metadados de templates).

## Resultado

Cada tenant verá apenas **1 opção** no dropdown: `FPI — Fatores Psicossociais Integrados v1.0`.
