import os
import re

def fix_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original = content

    # Fix TooltipTrigger render={(p) => <Element {...p} ...> ... </Element>}
    # Ex: <TooltipTrigger render={(p) => <div {...p} className="cursor-help"><Badge variant="destructive">Sem Estoque</Badge></div>} />
    content = re.sub(
        r'<TooltipTrigger\s+render=\{\s*\([^)]*\)\s*=>\s*<([a-zA-Z0-9_]+)\s*\{[^}]+\}\s*([^>]*)>(.*?)<\/\1>\s*\}\s*\/>',
        r'<TooltipTrigger asChild>\n<\1 \2>\3</\1>\n</TooltipTrigger>',
        content, flags=re.DOTALL
    )

    # Multi line
    content = re.sub(
        r'<TooltipTrigger\s+render=\{\([^)]*\)\s*=>\s*\(\s*<([a-zA-Z0-9_]+)\s*\{[^}]+\}\s*([^>]*)>(.*?)<\/\1>\s*\)\s*\}\s*\/>',
        r'<TooltipTrigger asChild>\n<\1 \2>\3</\1>\n</TooltipTrigger>',
        content, flags=re.DOTALL
    )

    # Specific fix Button render={<Link to='x' />}
    def repl_button(m):
        before = m.group(1)
        url = m.group(2)
        after = m.group(3)
        children = m.group(4)
        return '<Button ' + before + ' ' + after + ' asChild><Link to=\"' + url + '\">' + children + '</Link></Button>'

    content = re.sub(
        r'<Button([^>]*?)render=\{<Link\s+to=[\"\']([^\"\']+)[\"\']\s*\/>\}([^>]*)>(.*?)<\/Button>',
        repl_button,
        content, flags=re.DOTALL | re.IGNORECASE
    )

    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print('Fixed:', filepath)

for root, _, files in os.walk('c:/IvanReis/Projetos/Pessoal/Clinica/app_clinica/frontend/src'):
    for file in files:
        if file.endswith('.tsx') or file.endswith('.ts'):
            fix_file(os.path.join(root, file))
