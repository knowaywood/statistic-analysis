import os
import glob
import shutil

ROOT = os.path.dirname(os.path.abspath(__file__))
BUILD = os.path.join(ROOT, 'build')


def read_file(path):
    with open(path, encoding='utf-8') as f:
        return f.read()


def build_python_blocks():
    parts = []
    pattern = os.path.join(ROOT, 'python', '*.py')
    for fpath in sorted(glob.glob(pattern)):
        name = os.path.splitext(os.path.basename(fpath))[0]
        content = read_file(fpath)
        tag = f'  <script type="text/python-src" data-module="{name}">\n{content}\n  </script>'
        parts.append(tag)
    return '\n\n'.join(parts)


def build_html_modules():
    entries = []
    pattern = os.path.join(ROOT, 'html', 'modules', '*.html')
    for fpath in sorted(glob.glob(pattern)):
        name = os.path.splitext(os.path.basename(fpath))[0]
        content = read_file(fpath)
        escaped = content.replace('\\', '\\\\').replace('`', '\\`').replace('${', '\\${')
        entries.append(f'  "{name}": `{escaped}`')
    body = ',\n'.join(entries)
    return f'<script>\nwindow.MODULE_HTML = {{\n{body}\n}}\n</script>'


def copy_static():
    for name in ('css', 'js'):
        src = os.path.join(ROOT, name)
        dst = os.path.join(BUILD, name)
        if os.path.exists(dst):
            shutil.rmtree(dst)
        shutil.copytree(src, dst)
        count = len(os.listdir(src))
        print(f'  {name}/: {count} file(s) copied')


def main():
    if os.path.exists(BUILD):
        shutil.rmtree(BUILD)
    os.makedirs(BUILD)

    template = os.path.join(ROOT, 'html', 'index.html')
    output = os.path.join(BUILD, 'index.html')

    html = read_file(template)

    py_block = build_python_blocks()
    html = html.replace('<!--BUILD_PYTHON-->', py_block)

    mod_block = build_html_modules()
    html = html.replace('<!--BUILD_MODULES-->', mod_block)

    with open(output, 'w', encoding='utf-8') as f:
        f.write(html)

    print(f'[build.py] Generated {output}')
    print(f'  Python modules: {len(glob.glob(os.path.join(ROOT, "python", "*.py")))} files')
    print(f'  HTML modules:   {len(glob.glob(os.path.join(ROOT, "html", "modules", "*.html")))} files')

    copy_static()


if __name__ == '__main__':
    main()
