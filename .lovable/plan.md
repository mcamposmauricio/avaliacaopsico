
# Revisão Completa da Tela de Governança

## Diagnóstico atual

### Problemas identificados

1. **Consentimentos sem identificação útil**: A tabela mostra apenas Data, Campanha e Versão. Como o consentimento é anônimo por design (sem user_id), não é possível mostrar "quem" consentiu, mas podemos mostrar o IP, o texto completo do consentimento e enriquecer com dados estatísticos por campanha.

2. **Log de Auditoria: todos os registros são dados de teste**: Os 20 registros de auditoria têm `source: test_mode` e `user_id: null`. A tabela exibe campos genéricos sem contexto útil. Precisamos:
   - Exibir badge diferenciando dados de teste vs. reais
   - Melhorar exibição dos detalhes (JSON formatado ao invés de texto bruto)
   - Adicionar filtros por tipo de ação e por período

3. **Cards de resumo mostram contagem limitada (50)**: O query tem `.limit(50)` mas exibe como "52 consentimentos" — os cards mostram contagens parciais.

4. **Nenhum painel de participação**: Não há visão das taxas de resposta por campanha (convites usados vs. pendentes).

5. **Metodologia boa, mas estática**: A aba de Metodologia está bem feita mas poderia ter um expandable para ver o texto completo do consentimento padrão utilizado.

---

## Solução proposta

### 1. Cards de resumo melhorados

Buscar contagem real sem limite para os cards:

| Card | Melhoria |
|------|----------|
| Política de Anonimato | Mantém |
| Consentimentos | Contagem real (sem limit 50), com subtítulo "X campanhas" |
| Respostas Completas | Substituir "Audit Log N registros" por total de respostas completas |
| Audit Log | Manter, mas com nota se todos são dados de teste |

### 2. Aba "Participação" — nova aba

Adicionar uma nova aba entre "Log de Auditoria" e "Consentimentos" mostrando uma tabela por campanha:

```
Campanha | Status | Convites | Respondidos | Pendentes | Taxa | Consentimentos
```

Dados disponíveis via JOIN entre `survey_invitations`, `survey_campaigns` e `consent_records`.

### 3. Aba "Consentimentos" — melhorada

**Problema**: `consent_records` não tem `user_id` nem `employee_id` — o consentimento é anonimizado por design LGPD (correto). Mas podemos melhorar:

- Agrupar por campanha com contagem
- Mostrar IP (quando disponível) e data
- Expandir para ver o texto completo do consentimento
- Adicionar filtro por campanha
- Badge de status da campanha

**Nova estrutura da tabela**:
```
Data/Hora | Campanha (com badge de status) | IP | Versão | [Expandir texto]
```

### 4. Aba "Log de Auditoria" — melhorada

- Badge colorido por tipo de ação:
  - `create` → azul
  - `update` → amarelo  
  - `delete` → vermelho
  - `login` → cinza
  - `activate_campaign` → verde
  - `close_campaign` → laranja
  - `generate_report` → roxo
  - `export` → ciano

- Mostrar user_id truncado ou "Sistema" quando null
- Exibir `details` em tooltip/popover formatado ao invés de JSON bruto truncado
- Badge "Dado de teste" quando `details.source === 'test_mode'`
- Filtros: por tipo de ação (dropdown), por período (últimas 24h / 7 dias / 30 dias)
- Aumentar limite de 50 para 100, com paginação simples

### 5. Melhorar contagens dos cards

Fazer queries separadas para contagens reais (sem limit):

```typescript
// Contagem real de consentimentos
SELECT COUNT(*) FROM consent_records
// Contagem real de respostas completas  
SELECT COUNT(*) FROM survey_responses WHERE is_complete = true
// Contagem real de audit logs
SELECT COUNT(*) FROM audit_logs
```

---

## Arquivos a editar

| Arquivo | Alteração |
|---------|-----------|
| `src/pages/Governanca.tsx` | Refatoração completa da página |

### Nenhuma migration de banco necessária

Os dados já existem. A melhoria é puramente de interface e queries.

---

## Estrutura final da página

```text
[Governança e Compliance]

[Cards: Política Anonimato | Consentimentos | Respostas Completas | Audit Log]

[Tabs: Metodologia | Participação | Auditoria | Consentimentos]

Tab Participação:
  Tabela: Campanha | Status | Convidados | Respondidos | Taxa | Consentimentos

Tab Auditoria:
  Filtros: [Tipo de ação ▾] [Período ▾]
  Tabela: Data | Usuário | Ação (badge colorido) | Entidade | Detalhes (popover)
  Nota: badge "teste" para registros de seed

Tab Consentimentos:
  Filtro: [Campanha ▾]
  Tabela: Data/Hora | Campanha (badge status) | IP | Versão | Texto (expandir)
  Nota contextual: "Consentimentos são anônimos por design (LGPD)"
```
