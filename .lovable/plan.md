

# Botoes de Teste + Campanha de Validacao Flew

## Objetivo

Adicionar botoes de teste visualmente destacados (vermelhos com texto amarelo) em todas as secoes testaveis do sistema, permitindo gerar dados de exemplo com um clique. Alem disso, criar uma edge function dedicada para gerar uma campanha completa de teste (com respostas simuladas e scoring processado).

## Dados Existentes

O banco ja possui:
- Template FPI v1.0 (`a1b2c3d4-e5f6-7890-abcd-ef1234567890`)
- 50 colaboradores ativos
- 3 campanhas (1 closed, 1 active, 1 active)

## Mudancas Planejadas

### 1. Edge Function `seed-test-data` (nova)

Criar uma edge function que executa o ciclo completo de teste:

1. Cria uma campanha "Campanha Teste Flew" com o template FPI v1.0
2. Gera convites para todos os colaboradores ativos
3. Simula respostas aleatorias (Likert 1-5) para cada convite, marcando como `is_complete = true`
4. Atribui `department_id`, `org_unit_id`, `job_role_id` dos colaboradores nas respostas
5. Marca convites como `is_used = true`
6. Insere registros de consentimento
7. Chama internamente o scoring (process-scoring) via HTTP
8. Atualiza status da campanha para "closed"

Parametros opcionais:
- `campaign_name`: nome customizado
- `skip_scoring`: pular o scoring (default: false)

### 2. Botoes de Teste nas Paginas

Adicionar em cada pagina testavel um botao grande vermelho com texto amarelo. Cada botao gera dados de exemplo para aquela secao especifica.

**Paginas e acoes:**

| Pagina | Botao | Acao |
|--------|-------|------|
| Campanhas | "Gerar Campanha de Teste" | Chama `seed-test-data` — cria campanha completa com respostas e scoring |
| Colaboradores | "Gerar Colaboradores de Teste" | Insere 10 colaboradores ficticios com departamentos e cargos aleatorios |
| Estrutura | "Gerar Estrutura de Teste" | Cria 2 unidades, 4 departamentos e 5 cargos de exemplo |
| Plano de Acao | "Gerar Planos de Teste" | Cria 5 planos de acao para dimensoes Flew com prazos variados |
| Relatorios | "Gerar Relatorio de Teste" | Dispara geracao de laudo tecnico para a campanha mais recente encerrada |
| Governanca | "Gerar Log de Auditoria" | Insere 10 registros de auditoria de exemplo |

**Paginas sem botao (nao testaveis diretamente):**
- Dashboard (exibe dados — depende de campanhas existentes)
- Analises (exibe dados — depende de campanhas encerradas)
- Configuracoes (edita configuracoes do tenant — ja funcional)
- SurveyRuntime (acessado via token — o botao na pagina de Campanhas gera os tokens)

### 3. Estilo dos Botoes

Todos os botoes de teste terao o mesmo estilo:
```
className="bg-red-600 hover:bg-red-700 text-yellow-300 font-bold text-lg px-6 py-4 rounded-xl shadow-lg border-2 border-red-500"
```

Com icone de `FlaskConical` (lucide) e texto descritivo da acao.

Serao posicionados no topo de cada pagina, abaixo do header, dentro de um card com fundo vermelho/10 e borda vermelha tracejada, com label "MODO DE TESTE" para diferenciar visualmente.

---

## Secao Tecnica

### Arquivos Novos
1. `supabase/functions/seed-test-data/index.ts` — Edge function para gerar campanha completa de teste

### Arquivos Modificados
2. `src/pages/Campanhas.tsx` — Botao "Gerar Campanha de Teste"
3. `src/pages/Colaboradores.tsx` — Botao "Gerar Colaboradores de Teste"
4. `src/pages/Estrutura.tsx` — Botao "Gerar Estrutura de Teste"
5. `src/pages/PlanoAcao.tsx` — Botao "Gerar Planos de Teste"
6. `src/pages/Relatorios.tsx` — Botao "Gerar Relatorio de Teste"
7. `src/pages/Governanca.tsx` — Botao "Gerar Log de Auditoria"

### Sem Mudancas
- Logica de negocio existente
- Banco de dados (sem migrations)
- Scoring, laudo, autenticacao
- Design system base
