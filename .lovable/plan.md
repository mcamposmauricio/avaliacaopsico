

# Plano: Registrar metadados do colaborador e filtrar dados por gestor

## Problemas identificados

### 1. Respostas sem department_id, job_role_id, org_unit_id
O `SurveyRuntime.tsx` já tenta carregar os dados do colaborador via join na query de invitation (linha 56). Porém, a tabela `employees` tem RLS que exige `authenticated`. Quando o respondente acessa o link anonimamente (sem login), o join retorna `null` silenciosamente — resultando em resposta sem metadados.

### 2. Gestor vê dados de toda a empresa
As páginas de Dashboard, Análises e Relatórios não filtram dados pelo departamento do gestor. O RLS de `group_scores` já filtra para gestores, mas `campaign_scores` e `risk_alerts` mostram dados globais.

---

## Solução

### Parte 1 — Corrigir captura de metadados na resposta

**Criar uma função `SECURITY DEFINER`** no banco que busca os dados do colaborador a partir do token do convite, bypassando RLS:

```sql
CREATE FUNCTION public.get_employee_metadata_by_token(_token text)
RETURNS TABLE(department_id uuid, org_unit_id uuid, job_role_id uuid)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT e.department_id, d.org_unit_id, e.job_role_id
  FROM survey_invitations si
  JOIN employees e ON e.id = si.employee_id
  LEFT JOIN departments d ON d.id = e.department_id
  WHERE si.token = _token
  LIMIT 1
$$;
```

**Atualizar `SurveyRuntime.tsx`**: Após carregar o convite, chamar `supabase.rpc('get_employee_metadata_by_token', { _token: token })` para obter department_id, org_unit_id e job_role_id de forma confiável (funciona para anon e authenticated).

### Parte 2 — Filtrar visão do gestor por departamento

**Dashboard (`Dashboard.tsx`)**:
- Quando o usuário for gestor, filtrar `campaign_scores` e `risk_alerts` pelos group_scores do departamento dele (ou exibir apenas scores do departamento em vez dos globais)

**Análises (`Analises.tsx`)**:
- Quando gestor, filtrar `campaign_scores` para mostrar apenas os scores do departamento via `group_scores` filtrado
- O RLS de `group_scores` já restringe, então os dados já vêm filtrados — basta ajustar a UI para não exibir dados globais

**Relatórios (`Relatorios.tsx`)**:
- Aplicar o mesmo filtro de departamento

**Implementação**: Usar `usePermissions()` para detectar `isGestor` e `departmentFilter`, e condicionar as queries.

### Parte 3 — Corrigir a resposta existente (dados nulos)

Atualizar a resposta `233f838e` com os metadados corretos da Ingrid Castro:
```sql
UPDATE survey_responses 
SET department_id = '2c088d7e-...', org_unit_id = '72f03dc6-...', job_role_id = '4eb60387-...'
WHERE id = '233f838e-ac13-4ecb-a2fc-925bc6bea77b';
```

---

## Arquivos modificados

| Arquivo | Mudança |
|---|---|
| Migration SQL | Criar função `get_employee_metadata_by_token` |
| `src/pages/SurveyRuntime.tsx` | Usar RPC para buscar metadados do colaborador |
| `src/pages/Dashboard.tsx` | Filtrar dados por departamento quando gestor |
| `src/pages/Analises.tsx` | Filtrar scores por departamento quando gestor |
| `src/pages/Relatorios.tsx` | Filtrar por departamento quando gestor |
| Data fix (INSERT tool) | Corrigir resposta existente com metadados |

