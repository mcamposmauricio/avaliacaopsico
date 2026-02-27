

# Refatorar Gerenciamento de Roles: 1 Role por Usuario + Descricoes

## Objetivo

Mudar o componente `UserRolesManager` para que cada usuario tenha **exatamente 1 role** (em vez de multiplas), e adicionar descricoes resumidas do que cada role pode fazer.

## Mudancas

### 1. Simplificar UI para role unica por usuario

Substituir a logica atual (badges multiplos + botao adicionar) por um **Select direto na linha** mostrando a role atual. Ao trocar o valor no Select, o sistema:
1. Remove a role anterior (DELETE)
2. Insere a nova role (INSERT)

Colunas da tabela: **Nome | Email | Papel | Acao**

- Se o usuario ja tem uma role, o Select mostra essa role selecionada
- Se nao tem role, mostra placeholder "Selecione um papel"
- Protecao: admin nao pode rebaixar a si mesmo se for o unico admin_rh do tenant

### 2. Adicionar descricoes das roles

Acima da tabela, incluir um bloco informativo (usando Alert ou cards simples) com resumo de cada papel:

| Papel | Descricao |
|---|---|
| Admin RH | Acesso total: estrutura, colaboradores, campanhas, relatorios, planos de acao, configuracoes e governanca |
| Gestor | Acesso ao dashboard, analises e planos de acao filtrados pelo seu departamento |
| Diretoria | Visao consolidada somente-leitura: dashboard, analises e relatorios |
| Auditoria | Somente-leitura em governanca e relatorios |

### 3. Logica de troca de role (mutation)

Nova mutation `changeRole` que:
1. Deleta todas as roles existentes do usuario no tenant
2. Insere a nova role
3. Invalida queries relevantes

Para o usuario logado com admin_rh: antes de permitir a troca, verificar se existe pelo menos outro admin_rh no tenant.

## Arquivo alterado

`src/components/settings/UserRolesManager.tsx` -- reescrever para:
- Trocar de multi-role para single-role Select por usuario
- Adicionar bloco de descricoes acima da tabela
- Mutation `changeRole` que faz delete + insert em sequencia
- Manter protecao contra remocao do ultimo admin_rh

