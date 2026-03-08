# Arquitetura do Sistema

## Visão Geral
A arquitetura do Sistema de Clínicas foi desenhada para separar claramente as responsabilidades de backend e frontend. Adotamos o modelo de **Clean Architecture** em camadas para facilitar manutenção, teste e escalabilidade.

## Diagrama Funcional
- **Frontend (Apresentação):** Aplicação Single Page Application (SPA) em React, consumindo a API.
- **Backend (API e Regras de Negócio):** Django REST Framework operando como provedor de dados, responsável pela lógica, validação, segurança e persistência.
- **Banco de Dados (Persistência):** PostgreSQL como fonte de verdade dos dados da clínica.

## Sugestão de Estrutura de Apps (Django)
Para promover modularidade, dividiremos os domínios do sistema nos seguintes apps:
1. `core`: Modelos comuns, autenticação customizada, permissões base e utilitários.
2. `patients`: Gestão de pacientes, prontuários, anamnese e LGPD consentimentos.
3. `appointments`: Módulo de agendamentos, controle de agendas de médicos, horários disponíveis e integrações com o sistema de notificação.
4. `billing`: Faturamento, integração com planos de saúde e gateway de pagamentos.
5. `dashboards`: Relatórios e dados consolidados analíticos (indicadores de gestão).
6. `audit`: Registros de auditoria, históricos de alteração (Quem alterou, quando alterou, de qual IP).

## Práticas e Princípios
- **SOLID / Clean Code:** Desacoplamento entre serializers (camada de transporte) e as regras de negócio em services ou use-cases.
- **DRY e YAGNI:** Reutilização rigorosa de componentes. Implementação estritamente focada nas histórias e requisitos aprovados (MVP primeiro).
