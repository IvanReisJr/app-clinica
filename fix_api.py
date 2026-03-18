import os
import re

def fix_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original = content

    # Replace old api imports with apiClient
    content = re.sub(r'import api from [\'"]\.\./api[\'"];?', 'import { apiClient } from "@/lib/api";', content)
    content = re.sub(r'import api from [\'"]@/lib/api[\'"];?', 'import { apiClient } from "@/lib/api";', content)

    # Some files use `api.` instead of `apiClient.`, let's fix that if any exist
    content = re.sub(r'\bapi\.(get|post|put|patch|delete|request)\b', r'apiClient.\1', content)

    # Specific unused vars
    if 'ConveniosPage.tsx' in filepath:
        content = content.replace('import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";', 'import { Card, CardContent, CardHeader } from "@/components/ui/card";')
    
    if 'FaturamentoPage.tsx' in filepath:
        content = content.replace('import React, { useState, useMemo, useEffect } from \'react\';', 'import { useState, useMemo, useEffect } from \'react\';')

    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print('Fixed APIs:', filepath)

for root, _, files in os.walk('c:/IvanReis/Projetos/Pessoal/Clinica/app_clinica/frontend/src'):
    for file in files:
        if file.endswith('.tsx') or file.endswith('.ts'):
            fix_file(os.path.join(root, file))
