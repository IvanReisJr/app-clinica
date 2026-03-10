# Roadmap de Produto: Sistema de Clínicas

Abaixo detalhamos a visão macro e os próximos passos no desenvolvimento da aplicação de Gestão de Clínicas Médicas.

## Fase 1: Fundação e Conectividade (Concluído ✅)
- [x] Definição de Arquitetura Base e ADRs.
- [x] Modelagem de Dados (`users`, `patients`, `appointments`).
- [x] Autenticação JWT e RBAC (Controles de permissões).
- [x] Migração de Supabase para Django API.

## Fase 2: Módulos Clínicos e White Label (Em progresso 🏗️)
- [x] Gestão de Estoque e Kardex.
- [x] Identidade Institucional Dinâmica (Logo/Nome).
- [x] Painel de Chamada para TV.
- [ ] Triagem Completa (Sinais Vitais).
- [ ] Prontuário eletrônico unificado com versionamento.

## Fase 3: Faturamento e Notificações (Próximo 📅)
- [ ] Lógica para faturamento (Convênios/Particulares).
- [ ] Notificações via WhatsApp/E-mail.
- [ ] Relatórios avançados de faturamento mensal.

## Fase 4: Deploy Cloud e Modelo SaaS (Próximo ☁️)
- [x] Containerização completa (Docker/Compose).
- [ ] Configuração de VPS (Hostinger/DigitalOcean) com Ubuntu Linux.
- [ ] Implementação de **Reverse Proxy (Nginx/Traefik)** para suporte a múltiplos subdomínios.
- [ ] Automação de certificados **SSL (HTTPS)** gratuitos via Let's Encrypt.
- [ ] Sistema de **Backup Automático** do banco de dados (Diário/Nuvem).
- [ ] Definição de estratégia de isolamento de dados para múltiplos clientes.

## Fase 5: IA e Escala
- [ ] Deploy em Cluster (Postgres Gerenciado + Docker Swarm/K8s).
- [ ] Monitoramento de logs e métricas de servidor (Grafana/Uptime).
