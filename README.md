# Erolles Club — Site

Estrutura:
- `index.html` — marcação da página
- `styles.css` — todo o estilo
- `script.js` — carrega `products.json`, controla filtros, carrinho (com localStorage) e menu mobile
- `products.json` — catálogo de produtos (editar aqui para adicionar/remover peças, sem mexer no HTML)

## Rodar localmente

O `script.js` usa `fetch("products.json")`, que não funciona abrindo o `index.html` direto no navegador (protocolo `file://`). Suba um servidor local na pasta:

```bash
python3 -m http.server 8000
# ou
npx serve .
```

Depois acesse `http://localhost:8000`.

## Publicar

Funciona direto em GitHub Pages, Vercel, Netlify ou qualquer hospedagem estática — basta subir os 4 arquivos na raiz do repositório.

## Editar produtos

Adicione/edite itens em `products.json` seguindo o formato:

```json
{
  "id": "p09",
  "name": "Nome da peça",
  "category": "Tees",
  "price": 199,
  "tag": "Novo",
  "mark": "09"
}
```

`tag` pode ser `null` se não houver selo. O filtro de categorias na página é gerado automaticamente a partir das categorias presentes no JSON.
