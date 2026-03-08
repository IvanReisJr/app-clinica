# ADR 001: Adoção do Django como Framework Backend

## Status
Aceito

## Contexto
O Sistema de Clínicas necessita de um backend robusto, seguro, com rápida capacidade de desenvolvimento (Time to Market) e bibliotecas maduras para autenticação, regras de negócio e mapeamento de banco de dados (ORM). 

## Decisão
Adotaremos o framework **Django** em conjunto com **Django REST Framework (DRF)**.

## Consequências
**Positivas:**
- ORM poderoso, provendo proteção nativa contra *SQL Injection*.
- Painel Administrativo nativo out-of-the-box (`django-admin`) para operações rápidas de back-office.
- Sistema de controle de usuários embutido robusto e customizável.
- Extensa documentação e ecossistema (e.g., `drf-yasg` para Swagger, `django-auditlog`).

**Negativas:**
- Arquitetura monolítica inicial (embora dividida em 'apps', roda em um único serviço). Mudar para microserviços futuramente exigiria esforço.
- Curva de aprendizado moderada para as especificidades e "magias" do ORM e forms do Django.
