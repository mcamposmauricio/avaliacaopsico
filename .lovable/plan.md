
# Diagnóstico Completo do Sistema — Críticas e Melhorias

## Avaliação Geral

O sistema tem uma base técnica sólida e uma arquitetura bem organizada. A identidade visual é coerente, o fluxo de dados está bem modelado, e as regras de anonimato LGPD estão corretamente implementadas. Porém, há diversas oportunidades de melhoria em três frentes: **Estética**, **Usabilidade** e **Regras de Negócio**.

---

## 1. ESTÉTICA — Pontos de Melhoria

### 1.1 Survey Runtime (formulário do colaborador)
- O stepper de dimensões no topo usa botões com texto completo ("1. Demandas de Trabalho"), o que em mobile fica totalmente ilegível e requer scroll horizontal
- As opções Likert ficam apertadas em mobile: 5 colunas com texto de 10px são praticamente ilegíveis
- Não há animação de transição entre dimensões — a troca é abrupta
- A barra de progresso muda de cor (azul → amarelo → verde) conforme avança, o que cria inconsistência visual e pode confundir
- O cabeçalho com logo da empresa aparece muito pequeno e perde impacto

### 1.2 Dashboard
- O Gauge (velocímetro IGP) é renderizado via SVG manual e tem limitações: o texto interno fica muito pequeno em telas menores, e o ponteiro não tem animação de entrada
- Os 4 cards de métricas não têm estado de loading para "Taxa de Adesão" e "IGP", causando salto de layout
- "Top 3 Maiores Riscos" e "Dimensões Psicossociais" estão lado a lado em 2 colunas, mas o conteúdo de cada um é diferente em densidade — visualmente desequilibrado

### 1.3 Relatórios
- O ícone dos cards de relatório usa `text-destructive` (vermelho) para o ícone de arquivo — semanticamente errado, passa sensação de erro/perigo
- Não há distinção visual clara entre "Laudo Técnico" e "Relatório Executivo" nos cards

### 1.4 Governança
- O `ConsentTextExpander` abre o texto inline, mas o texto aparece truncado porque está dentro de uma célula de tabela estreita — o conteúdo transborda ou fica ilegível
- A aba "Auditoria" com dados todos de teste não tem destaque suficiente — o aviso "todos dados de teste" só aparece no card, não na tabela

### 1.5 Sidebar
- O disclaimer legal no rodapé ("Este instrumento avalia fatores...") está com fonte de 9px em itálico cinza claro — praticamente invisível e desnecessário ali
- O número de versão ("FPI v1.0 • © 2026") aparece junto com o nome do tenant, criando confusão sobre o que é produto e o que é cliente

---

## 2. USABILIDADE — Pontos de Melhoria

### 2.1 Ausência de confirmação em ações destrutivas
**Crítico**: O botão "Excluir colaborador" (`Trash2`) na tela de Colaboradores executa a exclusão imediatamente, sem nenhuma confirmação. Isso é um risco grave de perda de dados.

Mesma situação em Estrutura Organizacional: excluir unidade, departamento ou cargo — sem confirmação.

### 2.2 Fluxo de Campanhas — ausência de validação
- É possível ativar uma campanha sem gerar convites primeiro (campo `hasInvites` verifica mas não bloqueia a ativação)
- É possível clicar em "Encerrar" mesmo com 0 respostas completas — o erro só aparece depois da chamada à Edge Function (`process-scoring`), podendo confundir o usuário
- Não há validação de datas: é possível criar campanhas com `ends_at < starts_at`

### 2.3 Colaboradores — sem edição
A tabela de colaboradores permite apenas criar, ativar/desativar e excluir. Não é possível **editar** nome, email, departamento ou cargo de um colaborador já cadastrado. O usuário precisa excluir e recadastrar.

### 2.4 Plano de Ação — sem edição e sem exclusão
Da mesma forma, os planos de ação não têm botão de editar nem de excluir. Um plano criado errado não pode ser corrigido.

### 2.5 Survey — navegação e retomada
- Se o usuário sai do survey acidentalmente (fecha o browser, perde conexão), perde tudo — não há persistência local (localStorage) das respostas já preenchidas
- Avançar de dimensão sem responder todas as perguntas da dimensão atual é permitido silenciosamente — o usuário pode deixar itens em branco sem perceber
- O botão "Enviar Avaliação" só aparece na última dimensão e está desabilitado se `completionPct < 0.9` sem aviso claro de quais perguntas ainda faltam

### 2.6 Dashboard — estado vazio pouco informativo
Quando não há campanhas encerradas (estado comum para novos clientes), o Dashboard exibe apenas o card "Campanha Ativa" e todos os outros conteúdos ficam com mensagens de "sem dados". Não há guia de "próximos passos" para orientar o admin novo.

### 2.7 Relatorios — sem gestão de relatórios antigos
Não é possível excluir um relatório gerado. Com o tempo, a lista vai crescer sem controle.

### 2.8 Configurações — cores salvas não aplicadas em tempo real
O usuário pode mudar a cor primária e salvar, mas o sistema não aplica essa cor dinâmica ao tema — o campo existe no banco mas não é utilizado no CSS do sistema (apenas no Survey Runtime via `--brand-primary`, que não está conectado às variáveis do Tailwind).

### 2.9 Estrutura Organizacional — sem visão hierárquica
A tela mostra Unidades, Departamentos e Cargos em 3 abas separadas, mas não exibe a hierarquia (Unidade → Departamento) visualmente. Um admin não consegue ver "quais departamentos pertencem a qual unidade" sem alternar abas mentalmente.

### 2.10 Ausência de indicadores de loading em diversas telas
Campanhas, Colaboradores e Estrutura não mostram skeleton/spinner enquanto os dados carregam — aparece vazio e depois "preenche", causando salto de layout.

---

## 3. REGRAS DE NEGÓCIO — Pontos de Melhoria

### 3.1 Geração de convites duplicados (Bug)
Na tela de Campanhas, o botão "Gerar Convites" não verifica se já existem convites para aquela campanha. Se clicado duas vezes, gera duplicatas na tabela `survey_invitations` — dois tokens para o mesmo colaborador na mesma campanha. Isso pode inflacionar as estatísticas de participação.

**Correção**: Verificar se já existem convites antes de gerar, ou usar `INSERT ... ON CONFLICT DO NOTHING` com unique constraint em (`campaign_id`, `employee_id`).

### 3.2 Consentimento registrado APÓS as respostas
No `SurveyRuntime`, o fluxo atual é:
1. Inserir `survey_responses` ✓
2. Inserir `survey_answers` ✓
3. Marcar convite como usado ✓
4. Inserir `consent_records` ← **este é o último passo**

Se a etapa 4 falhar (erro de rede), temos respostas sem registro de consentimento — violação LGPD. O consentimento deveria ser registrado **antes** das respostas, ou em uma transação atômica.

### 3.3 Sem controle de tenant no cadastro de novos usuários
A tela de Auth permite criar conta com `supabase.auth.signUp()` sem vínculo de tenant. O trigger `handle_new_user` associa automaticamente ao "primeiro tenant" no banco (`SELECT id FROM tenants LIMIT 1`) — o que é inseguro em ambiente multi-tenant real. Qualquer pessoa pode criar uma conta e entrar no sistema.

### 3.4 Encerramento de campanha sem mínimo de respostas configurável
O scoring verifica se há pelo menos 1 resposta completa para processar. Mas não há configuração de mínimo de adesão antes de encerrar — uma campanha com 1 resposta em 200 convidados pode ser encerrada e gerar resultados estatisticamente inválidos.

### 3.5 Ausência de auditoria real
O log de auditoria (`audit_logs`) é alimentado apenas pelos dados de seed (test_mode). Nenhuma ação real do sistema — criar campanha, ativar campanha, encerrar campanha, gerar relatório — escreve no log de auditoria. Isso invalida completamente o módulo de Governança para fins de compliance real.

### 3.6 Respostas sem grupo (department_id/org_unit_id) não são rastreadas
No `SurveyRuntime`, os campos `department_id`, `org_unit_id` e `job_role_id` da tabela `survey_responses` nunca são preenchidos — o insert não coleta essa informação do convite. Isso significa que o `group_scores` nunca terá dados por departamento/cargo via `process-scoring`.

### 3.7 `min_group_size` salvo no banco mas aplicado apenas no backend
A configuração `min_group_size` é salva na tabela `tenants`, mas o frontend na tela de Análises não a respeita — exibe todos os `group_scores` onde `is_suppressed = false`. A supressão só acontece no backend (`process-scoring`). Se o valor for alterado após o scoring, os dados antigos não são recalculados.

### 3.8 Relatório sem versionamento por tipo
A tabela `reports` tem coluna `version`, mas a lógica de geração sempre insere um novo registro sem verificar se já existe um relatório do mesmo tipo para aquela campanha. A mesma campanha pode ter N laudos técnicos gerados, sem indicação de qual é o mais recente além da data.

---

## Priorização das Melhorias

| Prioridade | Item | Impacto |
|------------|------|---------|
| CRÍTICO | 3.2 Consentimento antes das respostas | LGPD |
| CRÍTICO | 2.1 Confirmação de exclusão | Segurança de dados |
| CRÍTICO | 3.1 Convites duplicados | Integridade dos dados |
| ALTO | 3.3 Cadastro sem tenant | Segurança multi-tenant |
| ALTO | 3.6 Respostas sem grupo | Análise por departamento |
| ALTO | 3.5 Auditoria real | Compliance |
| MÉDIO | 2.3 Edição de colaboradores | UX |
| MÉDIO | 2.4 Edição de planos de ação | UX |
| MÉDIO | 2.5 Persistência do Survey | UX |
| MÉDIO | 2.2 Validações de campanha | UX |
| BAIXO | 1.1 Survey mobile | Estética |
| BAIXO | 1.2 Dashboard animações | Estética |
| BAIXO | 2.6 Onboarding estado vazio | UX |

---

## O Que Está Bem Feito

Para ser justo, os seguintes pontos estão bem implementados:

- Arquitetura multi-tenant com RLS robusta
- Anonimização real (nenhum user_id nas respostas)
- Proteção por N mínimo de grupo (`is_suppressed`)
- Edge Functions para scoring e geração de relatório
- Importação CSV com preview e validação
- Sistema de roles (`admin_rh`, `gestor`, `diretoria`, `auditoria`)
- White label com logo por tenant
- Disclaimer metodológico consistente
- Design system coerente com Tailwind + shadcn/ui
- Skeleton loaders no Dashboard

---

## Plano de Implementação — Próximas Melhorias

Se aprovado, as correções seriam implementadas na seguinte ordem:

**Fase 1 — Correções críticas de integridade:**
- Adicionar unique constraint em `survey_invitations(campaign_id, employee_id)`
- Reordenar o fluxo de submit do Survey: consentimento primeiro
- Adicionar confirmação (`AlertDialog`) nas exclusões de colaboradores, estrutura e planos

**Fase 2 — Completar dados de grupo no survey:**
- Coletar `department_id`, `org_unit_id`, `job_role_id` do colaborador via `employee_id` da invitation e inserir na `survey_responses`

**Fase 3 — Auditoria real:**
- Registrar no `audit_logs` nas ações: criar campanha, ativar, encerrar, gerar relatório

**Fase 4 — UX:**
- Edição de colaboradores (Dialog com formulário pré-preenchido)
- Edição e exclusão de planos de ação
- Validação de datas na criação de campanhas
- Bloqueio de ativação de campanha sem convites gerados

