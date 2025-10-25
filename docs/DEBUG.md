# Debug Environment Guide

Este guia explica como usar o sistema de debug implementado no SaaS Scaffolding.

## 🚀 Configuração Rápida

### 1. Variáveis de Ambiente

Adicione estas variáveis ao seu `.env.local`:

```bash
# Debug Configuration
DEBUG_LEVEL=DEBUG
DEBUG_AUTH=true
DEBUG_EMAIL=true
DEBUG_DATABASE=true
DEBUG_API=true
```

### 2. Níveis de Log

- `ERROR` (0): Apenas erros críticos
- `WARN` (1): Avisos e erros
- `INFO` (2): Informações gerais
- `DEBUG` (3): Logs detalhados de debug
- `TRACE` (4): Logs mais detalhados (desenvolvimento)

## 🔧 Comandos Disponíveis

### Executar com Debug
```bash
# Nível DEBUG (padrão em desenvolvimento)
npm run dev

# Nível TRACE (máximo detalhamento)
npm run debug:level

# Testar sistema de debug
npm run debug:test
```

## 📊 Tipos de Logs

### 1. Logs de Autenticação (`[AUTH]`)
- Criação de usuários
- Verificação de email
- Tentativas de login
- Reset de senha

### 2. Logs de Email (`[EMAIL]`)
- Envio de emails de verificação
- Emails de reset de senha
- Códigos 2FA
- Erros de envio

### 3. Logs de Banco de Dados (`[DATABASE]`)
- Queries executadas
- Erros de conexão
- Operações CRUD

### 4. Logs de API (`[API]`)
- Requisições recebidas
- Validações
- Respostas enviadas
- Tempo de processamento

### 5. Logs de Segurança (`[SECURITY]`)
- Tentativas de login falhadas
- Tokens inválidos
- Ataques suspeitos

### 6. Logs de Performance (`[PERFORMANCE]`)
- Tempo de execução de operações
- Métricas de performance

## 🎯 Exemplos de Uso

### Testar Cadastro com Debug
```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"#Test123"}'
```

### Verificar Logs de Email
Os logs mostrarão:
- Token gerado (parcialmente mascarado)
- URL de verificação
- ID do email enviado
- Status do envio

### Monitorar Performance
Os logs incluem:
- Tempo de execução de cada operação
- Métricas de banco de dados
- Tempo de processamento de emails

## 🔍 Debugging Específico

### Problemas de Email
1. Verifique se `RESEND_API_KEY` está configurada
2. Monitore logs `[EMAIL]` para erros de envio
3. Verifique se `EMAIL_FROM` está configurado

### Problemas de Autenticação
1. Monitore logs `[AUTH]` para falhas de validação
2. Verifique logs `[SECURITY]` para tentativas suspeitas
3. Analise logs `[DATABASE]` para erros de query

### Problemas de Performance
1. Use `DEBUG_LEVEL=TRACE` para logs detalhados
2. Monitore logs `[PERFORMANCE]` para gargalos
3. Analise tempo de execução de operações

## 📝 Estrutura dos Logs

```
[2024-01-15T10:30:45.123Z] [DEBUG] [AUTH] Creating new user {
  "email": "user@example.com",
  "name": "Test User",
  "hasPassword": true,
  "tokenLength": 36,
  "expiresAt": "2024-01-16T10:30:45.123Z"
}
```

## 🛠️ Personalização

### Adicionar Novos Logs
```typescript
import { debugApi, debugAuth } from '@/lib/debug';

// Em qualquer arquivo
debugApi('Custom message', { data: 'value' });
debugAuth('Auth operation', { userId: '123' });
```

### Configurar Níveis por Módulo
```typescript
// Em lib/debug.ts
if (process.env.DEBUG_AUTH === 'false') {
  // Desabilitar logs de auth
}
```

## 🚨 Troubleshooting

### Logs não aparecem
1. Verifique se `DEBUG_LEVEL` está configurado
2. Confirme que está em modo desenvolvimento
3. Verifique se o servidor está rodando

### Muitos logs
1. Reduza `DEBUG_LEVEL` para `INFO` ou `WARN`
2. Desabilite módulos específicos no `.env.local`

### Performance impactada
1. Use `DEBUG_LEVEL=ERROR` em produção
2. Desabilite logs desnecessários
3. Configure logs assíncronos se necessário

## 📚 Recursos Adicionais

- [Next.js Debugging](https://nextjs.org/docs/advanced-features/debugging)
- [Supabase Logs](https://supabase.com/docs/guides/platform/logs)
- [Resend Debugging](https://resend.com/docs/api-reference/errors)
