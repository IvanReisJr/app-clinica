# Roadmap de Produto: Sistema de Clínicas

Abaixo detalhamos a visão macro e os próximos passos no desenvolvimento da aplicação de Gestão de Clínicas Médicas.

## Fase 1: MVP do Backend (Mês 1)
- [x] Definição de Arquitetura Base, Setup inicial e ADRs do projeto.
- [ ] Modelagem de Dados Base (`users`, `patients`, `appointments`).
- [ ] CRUD via endpoints DRF.
- [ ] Configuração de Autenticação com JWT.
- [ ] Conexão e sincronização inicial de Front e Backend (CORS check).

## Fase 2: Módulos Clínicos Auxiliares (Mês 2)
- [ ] Prontuário eletrônico unificado com versionamento.
- [ ] Emissão de Receituário e Solicitações de Exames.
- [ ] Dashboards de métricas principais para a gerência da Clínica.
- [ ] Auditoria de registros de segurança aplicados no Django (django-auditlog).

## Fase 3: Faturamento e Notificações (Mês 3)
- [ ] Lógica para faturamento (Consultas Populares, Convênios, Particulares).
- [ ] Integração de Notificações via Email ou SMS via Background Tasks (Celery / Redis).
- [ ] Tunning de banco de dados via PostgreSQL (Índices GIN, JSONB fields).

## Fase 4: Escalabilidade para Múltiplas Clínicas e Produção 
- [ ] Suporte a Multi-Tenant Base (Múltiplas sub-clínicas independentes no mesmo sistema).
- [ ] Empacotamento Docker e Gunicorn via NGINX em ambiente Cloud seguro (AWS/GCP).
