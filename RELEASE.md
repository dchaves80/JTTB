# Release Process - JTTB

Pasos para subir una nueva versión de JTTB.

---

## 1. Actualizar versiones en package.json

Editar la versión en ambos archivos:

```
jttb-front/package.json  →  "version": "X.Y.Z"
jttb-back/package.json   →  "version": "X.Y.Z"
```

---

## 2. Actualizar versión en el welcome message

Editar el archivo:
```
jttb-front/src/app/components/terminal/terminal.component.html
```

Buscar y actualizar:
```html
<p>JTTB - Terminal Toolbox vX.Y</p>
```

---

## 3. Build y Push a Docker Hub

Usar el script `build.sh` que hace build y push automáticamente:

```bash
./build.sh X.Y
```

El script:
1. Build de la imagen con tags `X.Y` y `latest`
2. Push de ambos tags a Docker Hub

---

## 4. Actualizar dockerhub-readme.md

Agregar la nueva versión en la sección Tags:

```markdown
# 🏷️ Tags

- `latest` - Latest stable release
- `X.Y` - Version X.Y (descripción de features)
- `1.5` - Version 1.5 (Search, Favorites, CRT effects)
...
```

Luego actualizar manualmente en Docker Hub:
1. Ir a https://hub.docker.com/r/edering/jttb
2. Editar el README
3. Copiar contenido de `dockerhub-readme.md`
4. Guardar

---

## 5. Commit y push a GitHub

```bash
git add -A
git commit -m "Release vX.Y - descripción"
git push
```

---

## 6. (Opcional) Crear tag en Git

```bash
git tag vX.Y
git push origin vX.Y
```

