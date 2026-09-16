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

## Pagamento real com Stripe (Vercel Functions)

O checkout usa uma função serverless (`api/create-checkout-session.js`) que roda no servidor da Vercel — a chave secreta do Stripe nunca fica exposta no navegador, e o preço de cada produto é conferido no servidor (a partir do `products.json`), não confiando no valor que vem do carrinho no navegador.

### Passo a passo

1. **Crie uma conta Stripe**: https://dashboard.stripe.com/register
2. No painel, vá em **Developers → API keys** e copie a **Secret key** (`sk_test_...` pra testar, `sk_live_...` quando for vender de verdade).
3. No painel da Vercel, no projeto: **Settings → Environment Variables** → adicione:
   - `STRIPE_SECRET_KEY` = a chave que você copiou
4. Faça o deploy (ou redeploy) do projeto.
5. Teste uma compra usando um [cartão de teste do Stripe](https://docs.stripe.com/testing#cards), ex: `4242 4242 4242 4242`, qualquer validade futura e CVC.
6. Quando estiver pronto pra vender de verdade, ative sua conta Stripe (dados bancários, CNPJ/CPF) e troque a variável pela chave `sk_live_...`.

**Isso não funciona rodando localmente com `python3 -m http.server`** — o botão de checkout depende da função serverless, que só roda depois do deploy na Vercel (ou com `vercel dev` localmente, se você instalar a CLI da Vercel).

### Webhook (recomendado, não incluso ainda)

Pra confirmar pedidos de forma 100% confiável (o navegador do cliente pode fechar antes de voltar pro site), o ideal é configurar um **webhook do Stripe** (`checkout.session.completed`) que registre o pedido no seu banco de dados. Isso ainda não está implementado — hoje o pedido só é considerado concluído pela página `sucesso.html`, sem nenhum registro no seu lado.

## Deploy na Vercel

1. Crie uma conta em https://vercel.com (dá pra entrar direto com GitHub).
2. **Add New → Project** → importe o repositório `andrezaulidev/erolles-teste`.
3. A Vercel detecta sozinha que é um projeto estático com uma pasta `api/` — não precisa mudar nenhuma configuração de build.
4. Antes de finalizar (ou depois, em Settings → Environment Variables), adicione a `STRIPE_SECRET_KEY` como no passo acima.
5. Clique em **Deploy**. A partir daí, todo `git push` na branch `main` gera um deploy novo automaticamente.

## Segurança — pontos já revisados

- O preço de cada item é definido pelo servidor (`api/create-checkout-session.js` lê o `products.json` no backend), nunca pelo valor que vem do carrinho no navegador — evita que alguém manipule o preço editando o JavaScript do cliente antes de pagar.
- Todo acesso ao `localStorage` passa por um helper (`safeStorage`) com try/catch, então o site não quebra em navegadores/preview que bloqueiam essa API (ex: alguns webviews sandboxed).
- O nome digitado no cadastro é renderizado com `textContent`/`createElement`, nunca `innerHTML`, evitando XSS armazenado.
- O parâmetro `?redirect=` da tela de senha só aceita uma whitelist fixa de páginas do próprio site, evitando open redirect e injeção via `javascript:`/`data:`.
- A senha de acesso ao site e as senhas de usuário continuam em texto puro no código/`localStorage` — é uma limitação inerente a qualquer proteção feita só no front-end. Para segurança real, ambas precisam ser validadas por um backend.
