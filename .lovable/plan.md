## Plano para corrigir a exportação travada em 60%

### Diagnóstico
O travamento acontece na etapa de Storage, exatamente onde a função baixa arquivos, adiciona tudo ao ZIP e só depois faz upload. Isso acumula o pacote inteiro em memória dentro da função. Os logs já mostram `Memory limit exceeded`, então a exportação é interrompida antes de concluir.

### Correção proposta
1. **Reduzir uso de memória na função**
   - Remover a etapa mais pesada de empacotar todos os arquivos físicos do Storage dentro do ZIP.
   - Manter no pacote um inventário completo dos buckets e arquivos: caminho, bucket, metadados, tamanho quando disponível e instruções de restauração.
   - Isso evita que a função baixe arquivos grandes e trave em 60%.

2. **Melhorar exportação de dados das tabelas**
   - Exportar dados em páginas/lotes, em vez de buscar cada tabela inteira de uma vez.
   - Registrar contagem por tabela e erros parciais sem derrubar a exportação inteira.

3. **Melhorar logs e progresso**
   - Ajustar a etapa de 60% para não ficar aparentemente parada.
   - Emitir logs por bucket/tabela e finalizar com erro claro se algo falhar.

4. **Garantir pacote restaurável**
   - Incluir `storage/inventory.json` com todos os arquivos encontrados.
   - Atualizar o `README.md` do ZIP explicando que os arquivos de Storage devem ser migrados a partir do inventário/ambiente original, enquanto banco, schema, funções, auth e configurações continuam no pacote.
   - Preservar `schema/introspection.json`, migrations, dados, funções, auth e secrets names.

5. **Validar acesso restrito**
   - Manter a validação frontend/backend exclusivamente para `mauricio@marqponto.com.br` e `mcampos.mauricio@gmail.com`.
   - Não ampliar permissões para nenhuma role.

### Resultado esperado
A exportação deve passar de 60%, concluir o upload do `.zip`, registrar status `completed` no histórico e liberar o botão/link de download sem estourar memória.