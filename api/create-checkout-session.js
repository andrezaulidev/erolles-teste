// Função serverless (Vercel) — cria uma sessão de pagamento no Stripe.
// Roda no servidor: a STRIPE_SECRET_KEY nunca é exposta ao navegador.
//
// Variável de ambiente necessária (configurar no painel da Vercel):
//   STRIPE_SECRET_KEY = sk_test_... (ou sk_live_... em produção)

const Stripe = require("stripe");
const fs = require("fs");
const path = require("path");

// Carrega o catálogo real de produtos do servidor — nunca confiamos
// no preço que vem do navegador, pra evitar alguém manipular o valor
// pago só editando o carrinho no client-side.
function loadCatalog() {
  const file = path.join(process.cwd(), "products.json");
  const raw = fs.readFileSync(file, "utf8");
  return JSON.parse(raw);
}

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Método não permitido" });
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return res.status(500).json({
      error: "STRIPE_SECRET_KEY não configurada nas variáveis de ambiente do projeto."
    });
  }

  try {
    const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const cartItems = Array.isArray(body?.items) ? body.items : [];

    if (!cartItems.length) {
      return res.status(400).json({ error: "Carrinho vazio." });
    }

    const catalog = loadCatalog();

    const line_items = cartItems.map((cartItem) => {
      const product = catalog.find((p) => p.id === cartItem.id);
      if (!product) {
        throw new Error(`Produto inválido: ${cartItem.id}`);
      }
      const qty = Math.max(1, Math.min(50, parseInt(cartItem.qty, 10) || 1));
      const size = ["P", "M", "G", "GG"].includes(cartItem.size) ? cartItem.size : "M";

      return {
        price_data: {
          currency: "brl",
          product_data: {
            name: `${product.name} — Tam. ${size}`,
            images: product.images?.length
              ? [`${getOrigin(req)}/${product.images[0]}`]
              : undefined
          },
          unit_amount: Math.round(product.price * 100) // preço em centavos, vindo do servidor
        },
        quantity: qty
      };
    });

    const origin = getOrigin(req);

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items,
      locale: "pt-BR",
      shipping_address_collection: { allowed_countries: ["BR"] },
      success_url: `${origin}/sucesso.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/carrinho.html`
    });

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error("Erro ao criar sessão Stripe:", err);
    return res.status(500).json({ error: "Não foi possível iniciar o pagamento. Tente novamente." });
  }
};

function getOrigin(req) {
  const proto = req.headers["x-forwarded-proto"] || "https";
  const host = req.headers.host;
  return `${proto}://${host}`;
}
