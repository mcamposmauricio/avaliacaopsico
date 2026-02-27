

# Plano de Permissionamento: Tenant + Roles

## Arquitetura de Acesso (3 Camadas)

```text
Camada 1: TENANT (isolamento absoluto - RLS com get_user_tenant_id)
  └── Camada 2: ROLE (visibilidade e acoes dentro do tenant)
       └── Camada 3: DEPARTAMENTO (filtro para gestor via profiles.department_id)
```

---

## Camada 1 -- Tenant (ja implementada)

Todas as tabelas possuem `tenant_id` com RLS via `get_user_tenant_id()`. Nenhuma role ultrapassa o limite do tenant. Regra: toda nova tabela DEVE ter `tenant_id` + RLS.

---

## Camada 2 -- Roles

Os 4 perfis definidos nos documentos tecnicos (secao "Perfis de acesso - governanca"):

### Matriz de Acesso

```text
Pagina              | admin_rh       | gestor         | diretoria    | auditoria
--------------------|----------------|----------------|--------------|----------
Dashboard           | Total          | Propria area   | Leitura      | --
Estrutura           | Total          | --             | --           | --
Colaboradores       | Total          | --             | --           | --
Campanhas           | Total          | --             | --           | --
Analises            | Total          | Propria area   | Leitura      | --
Relatorios          | Total (CRUD)   | --             | Leitura      | Leitura
Plano de Acao       | Total          | Propria area   | --           | --
Configuracoes       | Total          | --             | --           | --
Governanca          | Total          | --             | --           | Leitura
```

### Regras Detalhadas por Role

**admin_rh**
- Acesso completo a todas as paginas dentro do seu tenant
- CRUD de estrutura organizacional, colaboradores, campanhas
- Criar/ativar/encerrar campanhas, gerar e excluir relatorios
- Gerenciar planos de acao, configuracoes do tenant, roles de usuarios
- Ver logs de auditoria, consentimentos, metodologia

**gestor**
- Dashboard: ve apenas indicadores filtrados pelo seu departamento (IGP da area, adesao da area, alertas da area)
- Analises: heatmap e scores filtrados pelo seu departamento; nao ve dados de outros departamentos
- Plano de Acao: ve e gerencia apenas planos vinculados ao seu departamento; pode criar novos para sua area
- Sem acesso a: Estrutura, Colaboradores, Campanhas, Relatorios, Configuracoes, Governanca
- Requisito: campo `department_id` no perfil do usuario

**diretoria**
- Dashboard: visao consolidada somente-leitura (IGP geral, adesao global, alertas)
- Analises: todas as abas em modo somente-leitura (sem poder editar/criar nada)
- Relatorios: visualizar e baixar relatorios gerados, mas NAO pode gerar novos nem excluir
- Sem acesso a: Estrutura, Colaboradores, Campanhas, Plano de Acao, Configuracoes, Governanca

**auditoria**
- Governanca: leitura completa (metodologia, participacao, logs de auditoria, consentimentos)
- Relatorios: visualizar e baixar relatorios gerados, mas NAO pode gerar novos nem excluir
- Sem acesso a: Dashboard, Estrutura, Colaboradores, Campanhas, Analises, Plano de Acao, Configuracoes

---

## Camada 3 -- Departamento (para gestor)

Novo campo `department_id` na tabela `profiles` permite vincular um gestor a sua area. Toda query para o gestor filtra automaticamente por esse departamento.

---

## Implementacao Tecnica

### Etapa 1 -- Migracao de Banco

- Adicionar coluna `department_id` (nullable, FK para departments) na tabela `profiles`
- Criar funcao `get_user_department_id(uuid)` SECURITY DEFINER
- Adicionar politica RLS condicional em `action_plans`: se role = gestor, filtrar por department_id do perfil
- Adicionar politica RLS condicional em `group_scores`: gestor so ve scores do seu departamento

### Etapa 2 -- Protecao de Rotas no Frontend

Criar mapa de roles permitidas por rota e verificar no componente `ProtectedRoute` ou wrapper dedicado. Redirecionar para primeira rota permitida quando o usuario nao tem acesso.

Arquivos alterados:
- `src/App.tsx` -- envolver rotas com verificacao de role
- `src/components/ProtectedRoute.tsx` -- aceitar parametro `allowedRoles`

### Etapa 3 -- Atualizar Sidebar

Ajustar o array de roles em `AppSidebar.tsx` para refletir a matriz acima:
- Dashboard: todas as roles exceto auditoria
- Analises: admin_rh, gestor, diretoria
- Relatorios: admin_rh, diretoria, auditoria
- Plano de Acao: admin_rh, gestor
- Governanca: admin_rh, auditoria

### Etapa 4 -- Hook usePermissions

Criar `src/hooks/usePermissions.ts` que expoe:
- `canCreate`, `canEdit`, `canDelete` -- false para roles somente-leitura
- `isReadOnly` -- true para diretoria/auditoria nas paginas que acessam
- `departmentFilter` -- department_id do perfil para gestor, null para outros

### Etapa 5 -- Modo Somente-Leitura nas Paginas

- `Relatorios.tsx`: esconder secao "Gerar Novo Relatorio" e botao de excluir para diretoria e auditoria
- `Governanca.tsx`: ja e somente-leitura (nenhum botao de acao)
- `Dashboard.tsx`: filtrar queries por department_id para gestor
- `Analises.tsx`: filtrar group_scores por department_id para gestor
- `PlanoAcao.tsx`: filtrar planos por department_id para gestor; esconder "Nova Acao" para roles sem permissao

### Etapa 6 -- Expor departmentId no useTenant

Atualizar `src/hooks/useTenant.tsx` para retornar `departmentId` do perfil do usuario.

### Resumo de Arquivos

| Arquivo | Mudanca |
|---|---|
| Migracao SQL | `department_id` em profiles, funcao helper, politicas RLS condicionais |
| `src/App.tsx` | Verificacao de role por rota |
| `src/components/ProtectedRoute.tsx` | Aceitar `allowedRoles` |
| `src/components/layout/AppSidebar.tsx` | Ajustar roles na navegacao |
| `src/hooks/useTenant.tsx` | Expor `departmentId` |
| `src/hooks/usePermissions.ts` | Novo hook de permissoes |
| `src/pages/Dashboard.tsx` | Filtrar por departamento para gestor |
| `src/pages/Analises.tsx` | Filtrar group_scores para gestor |
| `src/pages/Relatorios.tsx` | Esconder acoes para diretoria/auditoria |
| `src/pages/PlanoAcao.tsx` | Filtrar por departamento para gestor |
| `src/components/RoleGate.tsx` | Manter como esta (ja funcional) |

