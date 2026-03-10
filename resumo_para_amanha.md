# Resumo de Atividades - Medtrace 🩺

## Status do Projeto (10/03/2026)

### ✅ Concluído Hoje
1. **Infraestrutura Docker**: Implementação de containers para Banco, Backend e Frontend.
2. **Sistema White Label**: Nome e Logo da clínica agora são dinâmicos em todo o sistema.
3. **Relatórios PDF**: Branding automático injetado nos templates de PDF.
4. **Painel de Chamada**: Tela de TV com alerta sonoro integrada à fila.
5. **Correção de Permissões**: Superusuário agora possui cargo de `admin` por padrão via shell script.
6. **API Dinâmica**: Frontend detecta automaticamente o IP do servidor para conexão.

### 🚀 Sprint Atual (1.3) - Próximos Passos
- [ ] **Módulo de Triagem**: Iniciar formulário de Sinais Vitais (PA, Temperatura, SatO2).
- [ ] **Integração Farmácia**: Baixa automática no Kardex ao realizar atendimento.
- [ ] **IA de Consumo**: Analisar dados de estoque para prever reposição.

### 💡 Notas Técnicas
- **Acesso Externo**: Utilizar `http://192.168.100.70:8044` para acessar de outros dispositivos na rede.
- **Portas**: API (8001), Frontend (8044), Postgres (5440).
- **Ambiente**: Produção simulada em QA via Docker Compose.
