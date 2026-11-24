"""Run Django 6.1.3 slugify and python-slugify 9.2.0 on titles from stdin (JSON array)."""
import json
import sys
import django
from django.utils.text import slugify as django_slugify
from slugify import slugify as python_slugify

titles = json.load(sys.stdin)
print(json.dumps({
    "django_version": django.get_version(),
    "python_slugify_version": __import__("slugify").__version__,
    "django": [django_slugify(title) for title in titles],
    "python_slugify": [python_slugify(title) for title in titles],
}, ensure_ascii=False))
