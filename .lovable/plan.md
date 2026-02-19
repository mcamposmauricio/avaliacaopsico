
# Correções: Disclaimer no Rodapé e Edição de Colaboradores

## Problema 1 — Disclaimer removido do rodapé da sidebar

O `FLEW_DISCLAIMER` foi removido do `AppSidebar.tsx` durante a última refatoração. Ele estava em `src/lib/flew.ts` como constante exportada e precisa voltar ao `SidebarFooter`.

**Arquivo:** `src/components/layout/AppSidebar.tsx`

Restaurar no `SidebarFooter`:
```tsx
import { FLEW_DISCLAIMER } from "@/lib/flew";

<SidebarFooter className="p-4 pt-2">
  <Separator className="bg-sidebar-border/50 mb-3" />
  <p className="text-[9px] text-sidebar-foreground/35 italic leading-relaxed">
    {FLEW_DISCLAIMER}
  </p>
  <div className="text-[10px] text-sidebar-foreground/35 tracking-wide mt-1">
    FPI v1.0 • © 2026
  </div>
</SidebarFooter>
```

---

## Problema 2 — Edição de colaboradores quebra ao clicar

**Causa raiz:** O componente `SelectItem` do Radix UI não aceita `value=""` (string vazia) — isso é uma limitação conhecida do Radix Select. Quando o colaborador não tem `department_id` ou `job_role_id`, o estado de edição recebe `""` como valor, e os `<SelectItem value="">` nos options de "sem departamento/cargo" causam o crash.

**Arquivo:** `src/pages/Colaboradores.tsx`

**Correção em 3 pontos:**

1. **Substituir `""` por um valor sentinel** como `"__none__"` no estado `editForm`:
   ```tsx
   department_id: emp.department_id || "__none__",
   job_role_id: emp.job_role_id || "__none__",
   ```

2. **Atualizar os `SelectItem` "sem departamento/cargo"** para usar `value="__none__"`:
   ```tsx
   <SelectItem value="__none__">— Sem departamento —</SelectItem>
   <SelectItem value="__none__">— Sem cargo —</SelectItem>
   ```

3. **Normalizar o valor ao salvar** — converter `"__none__"` de volta para `null` no `editMutation`:
   ```tsx
   department_id: editForm.department_id === "__none__" ? null : editForm.department_id || null,
   job_role_id: editForm.job_role_id === "__none__" ? null : editForm.job_role_id || null,
   ```

---

## Arquivos modificados

| Arquivo | Mudança |
|---------|---------|
| `src/components/layout/AppSidebar.tsx` | Restaurar `FLEW_DISCLAIMER` + import no rodapé |
| `src/pages/Colaboradores.tsx` | Substituir `value=""` por `"__none__"` nos Selects do Dialog de edição |

Nenhuma migration de banco necessária.
