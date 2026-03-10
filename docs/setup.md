# Guia de Configuração (Setup)

Este documento detalha o processo de inicialização do projeto e configuração do ambiente, agora focado em **Docker** para garantir paridade entre desenvolvimento e homologação.

## Pré-requisitos
- **Docker** e **Docker Compose** instalados e rodando.
- **Git** instalado.

## Modo Rápido (Docker - Recomendado)

1. **Clone o repositório:**
   ```bash
   git clone https://github.com/IvanReisJr/app-clinica.git
   cd app-clinica
   ```

2. **Configure as variáveis (.env):**
   Crie um arquivo `.env` na raiz:
   ```env
   DB_NAME=clinica_db
   DB_USER=clinica_user
   DB_PASSWORD=clinica_pass
   DB_HOST_PORT=5440
   DJANGO_DEBUG=False
   DJANGO_SECRET_KEY=sua_chave_secreta
   ```

3. **Suba o ambiente completo:**
   ```bash
   docker-compose up -d --build
   ```

4. **Prepare o Banco de Dados:**
   ```bash
   docker-compose exec backend python manage.py migrate
   docker-compose exec backend python manage.py createsuperuser
   ```

5. **Acesse o Sistema:**
   - Web: `http://localhost:8044`
   - API Docs: `http://localhost:8001/api/docs/swagger/`

---

## Desenvolvimento Local (Sem Docker)
Se precisar rodar apenas o backend localmente para debug:

1. **Crie o venv e instale:**
   ```bash
   python -m venv venv
   .\venv\Scripts\activate
   pip install -r requirements.txt
   ```

2. **Rode o servidor:**
   ```bash
   python manage.py runserver 8001
   ```
   *(Nota: O banco de dados PostgreSQL deve estar rodando via Docker na porta 5440).*

## Testes Automatizados
```bash
docker-compose exec backend pytest
```
