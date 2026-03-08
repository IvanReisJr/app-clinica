# Contribuindo para o Sistema de Clínicas

Agradecemos o seu interesse em contribuir para o Sistema de Clínicas! Este documento define as diretrizes para garantir contribuições de alta qualidade.

## Como Contribuir

1. Faça um *fork* do repositório.
2. Crie uma *branch* para a sua funcionalidade (`git checkout -b feature/MinhaNovaFuncionalidade`).
3. Adote as melhores práticas: **Clean Code**, **SOLID**, **DRY** (Don't Repeat Yourself) e **YAGNI** (You Aren't Gonna Need It).
4. Escreva testes unitários para a sua nova funcionalidade usando *pytest*. A cobertura de testes não pode diminuir.
5. Siga o padrão *PEP-8* rigorosamente no código Python.
6. Atualize o `CHANGELOG.md` na seção `[Unreleased]` com as mudanças relevantes.
7. Faça o *commit* das suas alterações (`git commit -m 'feat: Adiciona nova funcionalidade XYZ'`).
8. Faça o *push* para a branch (`git push origin feature/MinhaNovaFuncionalidade`).
9. Abra um *Pull Request* detalhando o contexto e as mudanças.

## Padrões de Qualidade
- Todo código deve passar pelo linter (`flake8` ou `black`).
- Revise o Contexto de Segurança e Permissões (Roles) antes de expor novos endpoints na API.
