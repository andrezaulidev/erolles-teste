# Erolles Club — Site

Site multi-página da marca de roupas Erolles Club, com fotos reais das peças, carrinho persistente, página de produto e login/cadastro simulado.

## Estrutura

- `index.html` — página inicial (hero, coleção com filtro por categoria, manifesto, newsletter)
- `produto.html` — página de detalhe de produto (galeria, tamanho, quantidade, relacionados). Recebe `?id=` na URL, ex: `produto.html?id=p01`
- `carrinho.html` — página completa do carrinho, com resumo do pedido
- `login.html` — login e criação de conta (client-side, ver limitações abaixo)
- `styles.css` — todo o estilo
- `script.js` — toda a lógica: carrega `products.json`, filtros, carrinho, galeria de produto, login/cadastro
- `products.json` — catálogo de produtos (editar aqui para adicionar/remover peças)
- `assets/` — fotos reais das camisetas usadas no catálogo

## Rodar localmente

O `script.js` usa `fetch("products.json")`, que não funciona abrindo o `index.html` direto no navegador (protocolo `file://`). Suba um servidor local na pasta:

```bash
python3 -m http.server 8000
# ou
npx serve .
```

Depois acesse `http://localhost:8000`.

## Publicar

Funciona direto em GitHub Pages, Vercel, Netlify ou qualquer hospedagem estática — basta subir a pasta inteira (incluindo `assets/`) na raiz do repositório.

## Editar produtos

Adicione/edite itens em `products.json`:

```json
{
  "id": "p09",
  "name": "Nome da peça",
  "category": "Estampadas",
  "price": 199,
  "tag": "Novo",
  "images": ["assets/minha-foto.jpg"],
  "description": "Descrição da peça."
}
```

`tag` pode ser `null`. `images` aceita mais de uma foto (galeria). O filtro de categorias é gerado automaticamente a partir das categorias presentes no JSON.

## Carrinho

Persistido em `localStorage` (`erolles_cart`), então sobrevive a reload da página e é compartilhado entre `index.html`, `produto.html` e `carrinho.html`.

## Login / cadastro — limitações importantes

O login é **100% simulado no navegador**: contas e senhas ficam salvas em `localStorage`, sem nenhum servidor ou banco de dados real por trás, e as senhas **não são criptografadas**. Serve para prototipar o fluxo de UI, mas **não deve ser usado em produção** como está. Para um login de verdade, é necessário um backend (ex: Node/Express, Firebase Auth, Supabase) que valide credenciais e nunca guarde senha em texto puro no cliente.

## Checkout

O botão "Finalizar compra" ainda não está conectado a um gateway de pagamento real (Stripe, Mercado Pago, PagSeguro etc.). Precisa integrar um desses para processar pagamentos de verdade.
