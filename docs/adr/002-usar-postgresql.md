# ADR 002: Adoção do PostgreSQL como Banco de Dados Relacional

## Status
Aceito (Para Produção). (SQLite aceito unicamente para desenvolvimento tático e prototipação inicial).

## Contexto
O sistema lida com dados transacionais críticos (agendamentos de horários concorrentes, financeiro) e documentos flexíveis (anamneses, observações médicas em JSON).

## Decisão
Adotaremos o **PostgreSQL** para os ambientes de Staging e Produção.

## Consequências
**Positivas:**
- Suporte nativo e otimizado via Django aos campos `JSONField` e `ArrayField`.
- Excelente controle de concorrência e transações ACID estritas.
- Capacidade robusta para extensões de auditoria.
- Suporte nativo para buscas textuais parciais otimizadas (Full Text Search).

**Negativas:**
- Setup local mais complexo na máquina dos desenvolvedores comparado ao SQLite (mitigado pelo uso contínuo de Docker para o banco).
- Necessidade de manutenções com índices (Vacuum) em altíssima volumetria.
