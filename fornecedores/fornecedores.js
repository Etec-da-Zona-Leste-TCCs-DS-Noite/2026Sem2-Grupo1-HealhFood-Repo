// Base exclusiva deste protótipo do restaurante parceiro.
const STORAGE_KEY = "freefood_restaurante_parceiro_v1";
const elemento = id => document.getElementById(id);

const moeda = valor =>
  Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });

const escapar = valor =>
  String(valor ?? "").replace(/[&<>"']/g, c => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[c]));

const identificador = () =>
  globalThis.crypto?.randomUUID?.() ||
  `${Date.now()}-${Math.random().toString(36).slice(2)}`;

let banco = {
  restaurante: null,
  produtos: [],
  pedidos: []
};

let produtoEmEdicao = null;
let pedidoSelecionado = null;
let avisoTimer;

// Recupera os dados deste restaurante.
try {
  const salvo = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");

  if (salvo && typeof salvo === "object") {
    banco.restaurante =
      salvo.restaurante && typeof salvo.restaurante === "object"
        ? salvo.restaurante
        : null;

    banco.produtos = Array.isArray(salvo.produtos) ? salvo.produtos : [];
    banco.pedidos = Array.isArray(salvo.pedidos) ? salvo.pedidos : [];
  }
} catch (erro) {
  console.error(erro);
  alert("Não foi possível ler os dados salvos. Verifique o armazenamento deste navegador.");
}

function avisar(texto) {
  elemento("toast").textContent = texto;
  elemento("toast").classList.add("show");

  clearTimeout(avisoTimer);

  avisoTimer = setTimeout(() => {
    elemento("toast").classList.remove("show");
  }, 3500);
}

// A memória e a interface só são atualizadas após a gravação funcionar.
function salvar(proximo) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(proximo));
  } catch (erro) {
    console.error(erro);
    alert("Não foi possível salvar. Os campos foram mantidos para você tentar novamente.");
    return false;
  }

  banco = proximo;
  atualizarTudo();
  return true;
}

function navegar(pagina) {
  document.querySelectorAll(".page").forEach(p => {
    p.classList.toggle("active", p.id === pagina);
  });

  document.querySelectorAll(".nav-link").forEach(b => {
    b.classList.toggle("active", b.dataset.page === pagina);
  });

  const botao = document.querySelector(
    `.nav-link[data-page="${pagina}"]`
  );

  elemento("page-title").textContent =
    botao.querySelector("span").textContent;

  window.scrollTo({ top: 0, behavior: "smooth" });
}

document.querySelectorAll("[data-page], [data-go]").forEach(b => {
  b.addEventListener("click", () => {
    navegar(b.dataset.page || b.dataset.go);
  });
});

function campos(form) {
  return Object.fromEntries(
    [...new FormData(form)].map(([chave, valor]) => [
      chave,
      String(valor).trim()
    ])
  );
}

function exigirRestaurante() {
  if (banco.restaurante) return true;

  navegar("restaurante");
  avisar("Cadastre seu restaurante antes de continuar.");
  return false;
}

function preencherRestaurante() {
  const form = elemento("restaurante-form");

  if (!banco.restaurante) return;

  Object.entries(banco.restaurante).forEach(([chave, valor]) => {
    const campo = form.elements.namedItem(chave);
    if (campo) campo.value = valor;
  });
}

elemento("restaurante-form").addEventListener("submit", evento => {
  evento.preventDefault();

  const restaurante = campos(evento.currentTarget);
  const digitos = restaurante.cnpj.replace(/\D/g, "");

  if (restaurante.cnpj && digitos.length !== 14) {
    return avisar("Informe o CNPJ com 14 dígitos ou deixe o campo vazio.");
  }

  restaurante.uf = restaurante.uf.toUpperCase();

  if (salvar({ ...banco, restaurante })) {
    avisar("Dados do seu restaurante salvos!");
  }
});

// Cadastro e edição do cardápio.
function limparProduto() {
  produtoEmEdicao = null;

  elemento("produto-form").reset();

  elemento("produto-titulo").textContent = "Cadastrar comida ou bebida";
  elemento("salvar-produto").textContent = "Salvar produto";
}

elemento("cancelar-produto").addEventListener("click", limparProduto);

elemento("produto-form").addEventListener("submit", evento => {
  evento.preventDefault();

  if (!exigirRestaurante()) return;

  const produto = campos(evento.currentTarget);

  produto.preco = Number(produto.preco);
  produto.tempo = Number(produto.tempo);

  if (
    !produto.nome ||
    !produto.ingredientes ||
    !produto.alergenicos ||
    !Number.isFinite(produto.preco) ||
    produto.preco <= 0
  ) {
    return avisar("Preencha as informações e informe um preço válido.");
  }

  produto.id = produtoEmEdicao || identificador();

  const produtos = produtoEmEdicao
    ? banco.produtos.map(p => p.id === produto.id ? produto : p)
    : [produto, ...banco.produtos];

  if (salvar({ ...banco, produtos })) {
    limparProduto();
    avisar("Produto salvo no seu cardápio!");
  }
});

function tag(texto) {
  const classe = ["Cancelado", "Indisponível"].includes(texto)
    ? "danger"
    : ["Recebido", "Em preparo"].includes(texto)
      ? "warning"
      : "";

  return `<span class="tag ${classe}">${escapar(texto)}</span>`;
}

function mostrarProdutos() {
  const busca = elemento("busca-produto")
    .value.toLocaleLowerCase("pt-BR").trim();

  const filtro = elemento("filtro-produto").value;

  const lista = banco.produtos.filter(p =>
    `${p.nome} ${p.ingredientes}`
      .toLocaleLowerCase("pt-BR")
      .includes(busca) &&
    (!filtro || p.disponibilidade === filtro)
  );

  elemento("produtos-tabela").innerHTML = lista.map(p => `
    <tr>
      <td>
        <strong class="cell-title">${escapar(p.nome)}</strong>
        <small class="cell-sub">${escapar(p.porcao)}</small>
      </td>
      <td>${moeda(p.preco)}</td>
      <td>${escapar(p.categoria)}</td>
      <td>${tag(p.disponibilidade)}</td>
      <td>
        <button class="row-button" data-action="produto-detalhes" data-id="${escapar(p.id)}">Detalhes</button>
        <button class="row-button" data-action="produto-editar" data-id="${escapar(p.id)}">Editar</button>
        <button class="row-button delete" data-action="produto-excluir" data-id="${escapar(p.id)}">Excluir</button>
      </td>
    </tr>
  `).join("") || `
    <tr>
      <td colspan="5" class="empty">
        Nenhum produto encontrado. Cadastre sua primeira comida ou bebida.
      </td>
    </tr>
  `;
}

elemento("busca-produto").addEventListener("input", mostrarProdutos);
elemento("filtro-produto").addEventListener("change", mostrarProdutos);

// O pedido guarda uma cópia dos itens e preços para preservar seu histórico.
function opcoesProdutos() {
  return '<option value="">Selecione uma comida ou bebida</option>' +
    banco.produtos
      .filter(p => p.disponibilidade === "Disponível")
      .map(p => `
        <option value="${escapar(p.id)}">
          ${escapar(p.nome)} — ${moeda(p.preco)}
        </option>
      `).join("");
}

function adicionarItem() {
  const linha = document.createElement("div");
  linha.className = "order-item";

  linha.innerHTML = `
    <label>
      Produto
      <select class="item-produto" required>
        ${opcoesProdutos()}
      </select>
    </label>
    <label>
      Quantidade
      <input class="item-quantidade" type="number"
        min="1" max="999" step="1" value="1" required>
    </label>
    <button type="button" class="row-button delete" data-remove-item>
      Remover
    </button>
  `;

  elemento("itens-pedido").appendChild(linha);
}

function atualizarOpcoes() {
  document.querySelectorAll(".item-produto").forEach(select => {
    const anterior = select.value;
    select.innerHTML = opcoesProdutos();

    if ([...select.options].some(o => o.value === anterior)) {
      select.value = anterior;
    }
  });

  atualizarTotal();
}

function itensDoFormulario() {
  return [...document.querySelectorAll(".order-item")].map(linha => {
    const produto = banco.produtos.find(p =>
      p.id === linha.querySelector(".item-produto").value &&
      p.disponibilidade === "Disponível"
    );

    const quantidade = Number(
      linha.querySelector(".item-quantidade").value
    );

    return produto
      ? {
          produtoId: produto.id,
          nome: produto.nome,
          preco: produto.preco,
          quantidade
        }
      : null;
  });
}

function atualizarTotal() {
  const total = itensDoFormulario().reduce((soma, item) => {
    const valido =
      item &&
      Number.isInteger(item.quantidade) &&
      item.quantidade > 0;

    return soma + (
      valido
        ? Math.round(item.preco * 100) * item.quantidade
        : 0
    );
  }, 0) / 100;

  elemento("pedido-total").textContent = moeda(total);
}

elemento("adicionar-item").addEventListener("click", adicionarItem);
elemento("itens-pedido").addEventListener("input", atualizarTotal);
elemento("itens-pedido").addEventListener("change", atualizarTotal);

elemento("itens-pedido").addEventListener("click", evento => {
  if (!evento.target.closest("[data-remove-item]")) return;

  const linhas = elemento("itens-pedido").children;

  if (linhas.length === 1) {
    return avisar("Mantenha pelo menos um item no pedido.");
  }

  evento.target.closest(".order-item").remove();
  atualizarTotal();
});

function ajustarEndereco() {
  const entrega = elemento("pedido-modalidade").value === "Entrega";

  elemento("pedido-endereco").required = entrega;
  elemento("pedido-endereco").disabled = !entrega;
}

elemento("pedido-modalidade").addEventListener("change", ajustarEndereco);

elemento("pedido-form").addEventListener("submit", evento => {
  evento.preventDefault();

  if (!exigirRestaurante()) return;

  if (banco.restaurante.atendimento !== "Aberto para pedidos") {
    return avisar(
      "Seu restaurante está fechado para novos pedidos. Atualize o atendimento em Meu restaurante."
    );
  }

  const pedido = campos(evento.currentTarget);

  const modalidadeIncompativel =
    (
      pedido.modalidade === "Entrega" &&
      banco.restaurante.modalidade === "Somente retirada"
    ) ||
    (
      pedido.modalidade === "Retirada" &&
      banco.restaurante.modalidade === "Somente entrega"
    );

  if (modalidadeIncompativel) {
    return avisar("Essa modalidade não é oferecida pelo seu restaurante.");
  }

  const itens = itensDoFormulario();

  if (
    !pedido.cliente ||
    !pedido.telefone ||
    (pedido.modalidade === "Entrega" && !pedido.endereco) ||
    !itens.length ||
    itens.some(i =>
      !i ||
      !Number.isInteger(i.quantidade) ||
      i.quantidade < 1 ||
      i.quantidade > 999
    )
  ) {
    return avisar(
      "Informe os dados do cliente e selecione produtos disponíveis com quantidades válidas."
    );
  }

  const agora = new Date().toISOString();

  pedido.id = identificador();

  pedido.numero =
    Math.max(0, ...banco.pedidos.map(p => Number(p.numero) || 0)) + 1;

  pedido.itens = itens;

  pedido.total = itens.reduce(
    (soma, i) => soma + Math.round(i.preco * 100) * i.quantidade,
    0
  ) / 100;

  pedido.status = "Recebido";
  pedido.criadoEm = agora;
  pedido.historico = [{ status: "Recebido", data: agora }];

  if (salvar({ ...banco, pedidos: [pedido, ...banco.pedidos] })) {
    evento.currentTarget.reset();
    elemento("itens-pedido").replaceChildren();

    adicionarItem();
    ajustarEndereco();
    atualizarTotal();

    pedidoSelecionado = pedido.id;
    mostrarCaminho();

    avisar(`Pedido #${pedido.numero} registrado!`);
  }
});

// Fluxo do pedido: a retirada não passa pela etapa de entrega.
function etapas(pedido) {
  return pedido.modalidade === "Retirada"
    ? ["Recebido", "Em preparo", "Pronto", "Concluído"]
    : ["Recebido", "Em preparo", "Pronto", "Saiu para entrega", "Concluído"];
}

function proximaEtapa(pedido) {
  if (["Cancelado", "Concluído"].includes(pedido.status)) return null;

  const fluxo = etapas(pedido);
  return fluxo[fluxo.indexOf(pedido.status) + 1] || null;
}

function mudarEtapa(id, cancelar = false) {
  const pedido = banco.pedidos.find(p => p.id === id);

  if (!pedido || ["Cancelado", "Concluído"].includes(pedido.status)) {
    return;
  }

  if (cancelar && !confirm(`Cancelar o pedido #${pedido.numero}?`)) {
    return;
  }

  const status = cancelar ? "Cancelado" : proximaEtapa(pedido);

  if (!status) return;

  const atualizado = {
    ...pedido,
    status,
    historico: [
      ...pedido.historico,
      { status, data: new Date().toISOString() }
    ]
  };

  if (
    salvar({
      ...banco,
      pedidos: banco.pedidos.map(p => p.id === id ? atualizado : p)
    })
  ) {
    avisar(`Pedido #${pedido.numero}: ${status}.`);
  }
}

function mostrarPedidos() {
  const busca = elemento("busca-pedido")
    .value.toLocaleLowerCase("pt-BR").trim();

  const filtro = elemento("filtro-pedido").value;

  const lista = banco.pedidos.filter(p =>
    `${p.cliente} #${p.numero}`
      .toLocaleLowerCase("pt-BR")
      .includes(busca) &&
    (!filtro || p.status === filtro)
  );

  elemento("pedidos-tabela").innerHTML = lista.map(p => {
    const proxima = proximaEtapa(p);

    const acoes = `
      <button class="row-button" data-action="pedido-ver" data-id="${escapar(p.id)}">
        Ver caminho
      </button>
    ` + (
      proxima
        ? `
          <button class="row-button" data-action="pedido-avancar" data-id="${escapar(p.id)}">
            ${escapar(proxima)}
          </button>
          <button class="row-button delete" data-action="pedido-cancelar" data-id="${escapar(p.id)}">
            Cancelar
          </button>
        `
        : ""
    );

    return `
      <tr>
        <td>#${p.numero}</td>
        <td>${escapar(p.cliente)}</td>
        <td>${moeda(p.total)}</td>
        <td>${escapar(p.modalidade)}</td>
        <td>${tag(p.status)}</td>
        <td>${acoes}</td>
      </tr>
    `;
  }).join("") || `
    <tr>
      <td colspan="6" class="empty">Nenhum pedido encontrado.</td>
    </tr>
  `;
}

elemento("busca-pedido").addEventListener("input", mostrarPedidos);
elemento("filtro-pedido").addEventListener("change", mostrarPedidos);

function mostrarCaminho() {
  const painel = elemento("caminho-pedido");
  const pedido = banco.pedidos.find(p => p.id === pedidoSelecionado);

  painel.hidden = !pedido;

  if (!pedido) return;

  const fluxo = pedido.status === "Cancelado"
    ? [...etapas(pedido), "Cancelado"]
    : etapas(pedido);

  const itensTexto = pedido.itens.map(i =>
    `${i.quantidade} × ${i.nome} (${moeda(i.preco)} cada)`
  ).join("\n");

  const detalhes = [
    `${pedido.cliente} • ${pedido.telefone}`,
    `${pedido.modalidade}: ${pedido.endereco || "Retirada no restaurante"}`,
    itensTexto,
    `Total: ${moeda(pedido.total)}`,
    `Observações: ${pedido.observacoes || "Nenhuma"}`
  ].join("\n");

  painel.innerHTML = `
    <div class="panel-heading">
      <h3>Caminho do pedido #${pedido.numero}</h3>
      ${tag(pedido.status)}
    </div>
    <p class="details-copy">${escapar(detalhes)}</p>
    <ol class="order-steps">
      ${fluxo.map(etapa => {
        const marco = pedido.historico.find(h => h.status === etapa);

        const descricao = marco
          ? new Date(marco.data).toLocaleString("pt-BR")
          : pedido.status === "Cancelado"
            ? "Não realizada"
            : "Aguardando";

        return `
          <li class="${marco ? "done" : ""} ${pedido.status === etapa ? "current" : ""}">
            ${escapar(etapa)} — ${escapar(descricao)}
          </li>
        `;
      }).join("")}
    </ol>
  `;
}

// Ações dos produtos e pedidos.
document.addEventListener("click", evento => {
  const botao = evento.target.closest("[data-action]");

  if (!botao) return;

  const { action, id } = botao.dataset;

  if (action === "pedido-ver") {
    pedidoSelecionado = id;
    mostrarCaminho();

    elemento("caminho-pedido").scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }

  if (action === "pedido-avancar") mudarEtapa(id);
  if (action === "pedido-cancelar") mudarEtapa(id, true);

  const produto = banco.produtos.find(p => p.id === id);

  if (!produto) return;

  if (action === "produto-detalhes") {
    alert([
      produto.nome,
      produto.descricao,
      `Preço: ${moeda(produto.preco)}`,
      `Porção: ${produto.porcao}`,
      `Ingredientes: ${produto.ingredientes}`,
      `Alergênicos e contato cruzado: ${produto.alergenicos}`,
      `Característica declarada: ${produto.perfil}`,
      `Preparo: ${produto.tempo} minutos`,
      `Informação nutricional: ${produto.nutricao || "Não informada"}`
    ].join("\n"));
  }

  if (action === "produto-editar") {
    produtoEmEdicao = id;

    Object.entries(produto).forEach(([chave, valor]) => {
      const campo = elemento("produto-form").elements.namedItem(chave);
      if (campo) campo.value = valor;
    });

    elemento("produto-titulo").textContent = "Editar comida ou bebida";
    elemento("salvar-produto").textContent = "Salvar alterações";

    elemento("produto-area").scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }

  if (
    action === "produto-excluir" &&
    confirm(`Excluir "${produto.nome}" do cardápio? Os pedidos anteriores manterão seus itens.`)
  ) {
    if (
      salvar({
        ...banco,
        produtos: banco.produtos.filter(p => p.id !== id)
      })
    ) {
      if (produtoEmEdicao === id) limparProduto();
      avisar("Produto excluído do cardápio.");
    }
  }
});

function atualizarTudo() {
  elemento("nome-perfil").textContent =
    banco.restaurante?.nome || "Meu restaurante";

  const concluidos = banco.pedidos.filter(p => p.status === "Concluído");

  const vendas = concluidos.reduce(
    (s, p) => s + Math.round(p.total * 100),
    0
  ) / 100;

  elemento("stat-produtos").textContent = banco.produtos.length;

  elemento("stat-andamento").textContent = banco.pedidos.filter(
    p => !["Concluído", "Cancelado"].includes(p.status)
  ).length;

  elemento("stat-concluidos").textContent = concluidos.length;
  elemento("stat-vendas").textContent = moeda(vendas);
  elemento("report-total").textContent = banco.pedidos.length;
  elemento("report-concluidos").textContent = concluidos.length;

  elemento("report-cancelados").textContent = banco.pedidos.filter(
    p => p.status === "Cancelado"
  ).length;

  elemento("report-ticket").textContent = moeda(
    concluidos.length ? vendas / concluidos.length : 0
  );

  elemento("recentes").innerHTML = banco.pedidos.slice(0, 5).map(p => `
    <div class="recent-item">
      <div>
        <strong>#${p.numero} • ${escapar(p.cliente)}</strong>
        <small>${moeda(p.total)} • ${escapar(p.modalidade)}</small>
      </div>
      ${tag(p.status)}
    </div>
  `).join("") || '<p class="empty">Seus pedidos recentes aparecerão aqui.</p>';

  const contagem = [
    "Recebido",
    "Em preparo",
    "Pronto",
    "Saiu para entrega",
    "Concluído",
    "Cancelado"
  ].map(status => [
    status,
    banco.pedidos.filter(p => p.status === status).length
  ]);

  const maior = Math.max(1, ...contagem.map(([, n]) => n));

  elemento("categorias-grafico").innerHTML = contagem.map(([status, n]) => `
    <div class="category-item">
      <div class="category-top">
        <span>${status}</span>
        <strong>${n}</strong>
      </div>
      <div class="category-track">
        <div class="category-fill" style="width:${n / maior * 100}%"></div>
      </div>
    </div>
  `).join("");

  mostrarProdutos();
  mostrarPedidos();
  mostrarCaminho();
  atualizarOpcoes();
}

// Exporta apenas os pedidos deste restaurante.
elemento("exportar-pedidos").addEventListener("click", () => {
  const linhas = [
    ["Pedido", "Cliente", "Itens", "Total", "Modalidade", "Etapa", "Data"],
    ...banco.pedidos.map(p => [
      p.numero,
      p.cliente,
      p.itens.map(i => `${i.quantidade} x ${i.nome}`).join(" | "),
      p.total.toFixed(2).replace(".", ","),
      p.modalidade,
      p.status,
      new Date(p.criadoEm).toLocaleString("pt-BR")
    ])
  ];

  const csv = linhas.map(linha =>
    linha.map(valor => {
      const texto = String(valor).replace(/^\s*[=+@-]/, "'$&");
      return `"${texto.replace(/"/g, '""')}"`;
    }).join(";")
  ).join("\r\n");

  const url = URL.createObjectURL(
    new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" })
  );

  const link = document.createElement("a");
  link.href = url;
  link.download = "freefood-meus-pedidos.csv";

  document.body.appendChild(link);
  link.click();
  link.remove();

  setTimeout(() => URL.revokeObjectURL(url), 1000);

  avisar("Relatório dos seus pedidos exportado.");
});

// Inicializa a interface.
preencherRestaurante();
adicionarItem();
ajustarEndereco();
atualizarTudo();
