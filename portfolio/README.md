# Portafolio

Sitio estático para GitHub Pages. Al abrirlo, lee el perfil y los repositorios públicos de [rodoac89](https://github.com/rodoac89) desde la API de GitHub. No hay paso de build.

## Ver en local

La API no responde si abres el HTML como archivo (`file://`). Levanta un servidor:

```powershell
python -m http.server 8765
```

Abre http://127.0.0.1:8765

## Publicar

El sitio está pensado como **proyecto** de GitHub Pages, no como reemplazo de `rodoac89.github.io` (ese repositorio hoy redirige a [rodoaravena.cl](https://rodoaravena.cl)).

1. Crea un repositorio público, por ejemplo `portfolio`, y sube esta carpeta a la rama por defecto.
2. En el repositorio: Settings → Pages → Build and deployment → Deploy from a branch.
3. Branch: la rama por defecto. Folder: `/ (root)`.
4. El sitio queda en `https://rodoac89.github.io/portfolio/`.

Los enlaces a CSS y JavaScript son relativos, así que también funciona en la raíz si algún día lo publicas como sitio de usuario.

Para mostrar otra cuenta, cambia la constante `USER` al inicio de `main.js`.

## Destacar un repositorio

El listado usa el mismo esquema que una página de topics de GitHub. Un repositorio entra en **Destacados** cuando le agregas el tema `destacado`:

1. Abre el repositorio en GitHub.
2. En **About**, pulsa el engranaje.
3. En **Topics**, escribe `destacado` y guárdalo.

Al recargar el portafolio (o pulsar **Actualizar**) el repo aparece solo. No hace falta editar este sitio.
