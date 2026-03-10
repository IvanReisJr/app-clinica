import os
import django
import sys

sys.path.append('c:\\IvanReis\\Projetos\Pessoal\\Clinica\\app_clinica')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.urls import get_resolver

def list_urls(resolver, prefix=''):
    for pattern in resolver.url_patterns:
        if hasattr(pattern, 'url_patterns'):
            list_urls(pattern, prefix + str(pattern.pattern))
        else:
            print(f"{prefix}{str(pattern.pattern)} -> {pattern.name}")

if __name__ == "__main__":
    list_urls(get_resolver())
