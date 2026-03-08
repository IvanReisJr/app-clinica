# Guia de Configuração (Setup)

Este documento detalha o processo de inicialização do projeto e configuração do ambiente de desenvolvimento, agora com suporte total a **PostgreSQL via Docker** isolado.

## Pré-requisitos
- Python 3.10+
- Node.js 18+ (para integração frontend)
- Docker e Docker Compose instalados e rodando.

## Backend (Django + PostgreSQL Isolado)

1. **Clone o repositório e navegue até a pasta base.**
   ```bash
   cd f:\_Projetos\Joao\Clinica_1\app_clinica
   ```

2. **Copie o arquivo de variáveis de ambiente.**
   Se não existir um `.env`, copie do modelo (caso criado no Git repo):
   *(Nota: O `.env` atual já configura a porta do BD para `5440` para evitar conflito com outros projetos).*
   ```bash
   cp .env.example .env
   ```

3. **Suba o Banco de Dados (PostgreSQL) Isolado**
   Garanta que seu Docker Desktop esteja rodando, em seguida:
   ```bash
   docker-compose up -d
   ```

4. **Gerencie o Ambiente Virtual.**
   ```bash
   python -m venv venv
   .\venv\Scripts\activate
   ```

5. **Instale as dependências:**
   ```bash
   pip install -r requirements.txt
   ```

6. **Migrações e Banco de Dados:**
   Como o `settings.py` agora lê as variáveis do `.env` nativamente (via `django-environ`), ele se conectará automaticamente na porta `5440` do Docker:
   ```bash
   python manage.py migrate
   ```

7. **Adicione um Superusuário (Console Admin):**
   ```bash
   python manage.py createsuperuser
   ```

8. **Rode o Servidor:**
   ```bash
   python manage.py runserver
   ```
   Acesse via `http://127.0.0.1:8000/`.

## Rodando os Testes Automatizados
```bash
pytest
```
O `pytest.ini` garante que não toquemos no banco de produção ao rodar os testes unitários.
