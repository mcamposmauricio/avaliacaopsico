

# Isolamento de Tenant para marciadorh@testepsico.com.br

## Problema

Existe apenas 1 tenant no banco ("Empresa Demo") e todos os usuarios estao nele. O trigger `handle_new_user` tem um fallback que atribui qualquer novo usuario ao primeiro tenant existente:

```sql
COALESCE(
  (NEW.raw_user_meta_data->>'tenant_id')::UUID,
  (SELECT id FROM public.tenants LIMIT 1)  -- PROBLEMA: fallback perigoso
)
```

Isso significa que `marciadorh@testepsico.com.br` foi automaticamente colocada no tenant "Empresa Demo", vendo todos os 52 colaboradores, 8 departamentos, 8 campanhas etc. que pertencem a outro cliente.

## Solucao

### 1. Criar novo tenant via migration

Criar um tenant dedicado para esta empresa:

```sql
INSERT INTO tenants (name, slug) VALUES ('Teste Psico', 'teste-psico');
```

### 2. Mover usuario para o novo tenant (via insert tool)

Atualizar o `profiles` e `user_roles` de `marciadorh@testepsico.com.br` para apontar ao novo `tenant_id`.

```sql
-- Atualizar profile
UPDATE profiles SET tenant_id = '<novo_tenant_id>'
WHERE email = 'marciadorh@testepsico.com.br';

-- Atualizar role
UPDATE user_roles SET tenant_id = '<novo_tenant_id>'
WHERE user_id = (SELECT user_id FROM profiles WHERE email = 'marciadorh@testepsico.com.br');
```

Apos isso, o RLS via `get_user_tenant_id()` vai filtrar corretamente e ela vera apenas dados do seu proprio tenant (que estara vazio, como esperado).

### 3. Corrigir o trigger handle_new_user

Remover o fallback `SELECT id FROM tenants LIMIT 1` para que novos signups sem `tenant_id` nos metadados nao sejam atribuidos a um tenant alheio. Em vez disso, o trigger criara automaticamente um novo tenant para o usuario:

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _tenant_id UUID;
BEGIN
  -- Se tenant_id veio nos metadados, usar ele
  _tenant_id := (NEW.raw_user_meta_data->>'tenant_id')::UUID;

  -- Se nao, criar novo tenant automaticamente
  IF _tenant_id IS NULL THEN
    INSERT INTO public.tenants (name, slug)
    VALUES (
      COALESCE(NEW.raw_user_meta_data->>'company_name', 'Minha Empresa'),
      COALESCE(NEW.raw_user_meta_data->>'company_slug', 'tenant-' || substr(NEW.id::text, 1, 8))
    )
    RETURNING id INTO _tenant_id;
  END IF;

  INSERT INTO public.profiles (user_id, tenant_id, email, full_name)
  VALUES (NEW.id, _tenant_id, NEW.email,
          COALESCE(NEW.raw_user_meta_data->>'full_name', ''));

  INSERT INTO public.user_roles (user_id, tenant_id, role)
  VALUES (NEW.id, _tenant_id, 'admin_rh');

  RETURN NEW;
END;
$$;
```

### 4. Atualizar tela de Auth para coletar nome da empresa

No formulario de signup em `src/pages/Auth.tsx`, adicionar campo "Nome da Empresa" e enviar como `company_name` nos metadados do signup:

```typescript
await supabase.auth.signUp({
  email,
  password,
  options: {
    data: {
      full_name: name,
      company_name: companyName,
      company_slug: companyName.toLowerCase().replace(/\s+/g, '-'),
    }
  }
});
```

## Resumo dos arquivos

| Arquivo / Recurso | Mudanca |
|---|---|
| Banco (insert tool) | Criar tenant "Teste Psico", mover profile e role de marciadorh |
| Banco (migration) | Recriar trigger `handle_new_user` com auto-criacao de tenant |
| `src/pages/Auth.tsx` | Adicionar campo "Nome da Empresa" no signup |

## Resultado esperado

- `marciadorh@testepsico.com.br` vera dashboard vazio (seu proprio tenant sem dados)
- Novos signups criarao automaticamente um tenant isolado
- Dados de "Empresa Demo" continuarao visiveis apenas para os usuarios daquele tenant
