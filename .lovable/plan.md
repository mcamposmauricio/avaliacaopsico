

# Plano de Implementação — 2 Melhorias

## 1. Auto-login após Criar Conta

**Problema**: Após signup, o usuário precisa fazer login manualmente.

**Solução**: Verificar se a sessão foi criada no retorno do `signUp`. Se sim, redirecionar ao dashboard. Se não (email não confirmado), manter mensagem atual.

### Arquivo

| Arquivo | Ação |
|---|---|
| `src/pages/Auth.tsx` | Editar — após `signUp`, checar `data.session`; se existir, navegar para `/dashboard` |

### Mudança (~5 linhas)
```text
Após signUp:
  se data.session existe → navigate("/dashboard")
  senão → toast("Verifique seu email")
```

---

## 2. Onboarding Tour Contextual para Tenant Vazio

**Problema**: O tour atual apenas mostra os menus. Para um tenant novo sem estrutura, seria mais útil guiar o usuário na criação de unidade → departamento → cargo → colaborador.

**Solução**: Adicionar steps condicionais ao tour quando o tenant estiver vazio (sem org_units).

### Arquivos

| Arquivo | Ação |
|---|---|
| `src/hooks/useOnboardingTour.ts` | Editar — aceitar flag `isEmpty` e usar steps alternativos |
| `src/components/layout/AppLayout.tsx` | Editar — passar contagem de estrutura para o hook |

### Comportamento
- Se tenant tem dados: tour padrão (menu overview)
- Se tenant está vazio: tour com mensagens direcionadas tipo "Comece criando sua primeira unidade organizacional aqui"
- O hook consulta contagem de `org_units` do tenant para determinar estado vazio

---

## Ordem de Execução

1. **Auto-login** (mudança pequena, melhora UX imediata)
2. **Onboarding contextual** (refinamento de UX)

