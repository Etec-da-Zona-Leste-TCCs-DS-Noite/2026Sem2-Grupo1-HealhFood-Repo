
// Define uma chave exclusiva para armazenar os fornecedores.
const STORAGE_KEY = "healthfood_fornecedores_v1";

// Recupera os fornecedores salvos no navegador.
function carregarFornecedores() {
  try { // Inicia a leitura protegida contra erros.
    const conteudo = localStorage.getItem(STORAGE_KEY); // Lê o armazenamento do navegador.
    const registros = conteudo ? JSON.parse(conteudo) : []; // Transforma o texto salvo em uma lista.
    return Array.isArray(registros) ? registros : []; // Garante que o resultado seja uma lista.
  } catch (erro) { // Trata erros de leitura.
    console.error("Falha ao carregar fornecedores:", erro); // Mostra o problema no console.
    return []; // Retorna uma lista vazia quando necessário.
  } // Finaliza o tratamento de erros.
} // Finaliza a função de carregamento.

// Guarda os fornecedores na memória do programa.
let fornecedores = carregarFornecedores();

// Identifica o fornecedor que está sendo editado.
let idEmEdicao = null;

// Armazena o identificador de um aviso temporário.
let avisoTimer = null;

// Obtém um elemento do HTML por seu identificador.
const elemento = id => document.getElementById(id);

// Protege os textos exibidos nas tabelas.
function escapar(valor) {
  const mapa = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }; // Define caracteres especiais.
  return String(valor ?? "").replace(/[&<>"']/g, caracter => mapa[caracter]); // Substitui caracteres perigosos.
} // Finaliza a proteção dos textos.

// Mostra uma mensagem de confirmação na tela.
function avisar(mensagem) {
  const aviso = elemento("toast"); // Localiza o aviso visual.
  aviso.textContent = mensagem; // Insere a mensagem como texto seguro.
  aviso.classList.add("show"); // Exibe a mensagem.
  clearTimeout(avisoTimer); // Cancela o fechamento anterior.
  avisoTimer = setTimeout(() => aviso.classList.remove("show"), 3000); // Esconde após três segundos.
} // Finaliza a função de avisos.

// Salva os fornecedores no localStorage.
function salvar() {
  try { // Tenta salvar a lista.
    localStorage.setItem(STORAGE_KEY, JSON.stringify(fornecedores)); // Converte e grava os registros.
    atualizarTudo(); // Atualiza os indicadores e tabelas.
    return true; // Confirma que o salvamento funcionou.
  } catch (erro) { // Trata erros de armazenamento.
    console.error("Falha ao salvar fornecedores:", erro); // Registra o problema.
    alert("Não foi possível salvar os dados neste navegador."); // Informa o usuário.
    return false; // Indica falha no salvamento.
  } // Finaliza o tratamento.
} // Finaliza a função de salvamento.

// Altera a página mostrada no sistema.
function navegar(pagina) {
  document.querySelectorAll(".page").forEach(item => item.classList.remove("active")); // Oculta as páginas.
  document.querySelectorAll(".nav-link").forEach(item => item.classList.remove("active")); // Remove o destaque dos botões.
  elemento(pagina).classList.add("active"); // Mostra a página escolhida.
  const botao = document.querySelector(`.nav-link[data-page="${pagina}"]`); // Encontra o botão correspondente.
  botao.classList.add("active"); // Destaca a opção selecionada.
  elemento("page-title").textContent = botao.querySelector("span").textContent; // Atualiza o título superior.
  window.scrollTo({ top: 0, behavior: "smooth" }); // Retorna ao começo da página.
} // Finaliza a navegação.

// Configura os botões do menu.
document.querySelectorAll(".nav-link").forEach(botao => {
  botao.addEventListener("click", () => navegar(botao.dataset.page)); // Abre a página solicitada.
}); // Finaliza os eventos do menu.

// Configura os atalhos para outras páginas.
document.querySelectorAll("[data-go]").forEach(botao => {
  botao.addEventListener("click", () => navegar(botao.dataset.go)); // Abre a página indicada pelo botão.
}); // Finaliza a configuração dos atalhos.

// Define o botão que inicia um cadastro.
elemento("novo-fornecedor").addEventListener("click", () => {
  navegar("fornecedores"); // Garante que a página de fornecedores esteja aberta.
  limparFormulario(); // Limpa qualquer edição anterior.
  elemento("form-area").scrollIntoView({ behavior: "smooth", block: "start" }); // Leva o usuário até o cadastro.
  document.querySelector('#supplier-form [name="nome"]').focus(); // Posiciona o cursor no primeiro campo.
}); // Finaliza o evento de novo fornecedor.

// Remove o modo de edição e limpa os campos.
function limparFormulario() {
  elemento("supplier-form").reset(); // Limpa o formulário.
  idEmEdicao = null; // Remove a identificação do registro editado.
  elemento("form-title").textContent = "Cadastrar fornecedor"; // Restaura o título original.
  elemento("submit-supplier").textContent = "Salvar fornecedor"; // Restaura o botão de salvamento.
} // Finaliza a limpeza do formulário.

// Configura o botão que limpa o formulário.
elemento("cancelar-form").addEventListener("click", limparFormulario); // Limpa os dados digitados.

// Configura o botão que cancela uma edição.
elemento("cancelar-edicao").addEventListener("click", limparFormulario); // Cancela e limpa o formulário.

// Verifica se um CNPJ informado possui 14 dígitos.
function formatoCnpjValido(cnpj) {
  const digitos = cnpj.replace(/\D/g, ""); // Remove pontos, barras e hífens.
  return digitos.length === 0 || digitos.length === 14; // Aceita campo vazio ou 14 dígitos.
} // Finaliza a verificação do formato.

// Verifica se o CNPJ já está cadastrado.
function cnpjDuplicado(cnpj) {
  const digitos = cnpj.replace(/\D/g, ""); // Obtém apenas os números.
  if (!digitos) return false; // Ignora campos vazios.
  return fornecedores.some(item => item.id !== idEmEdicao && (item.cnpj || "").replace(/\D/g, "") === digitos); // Procura outra empresa com o mesmo CNPJ.
} // Finaliza a verificação de duplicidade.

// Escuta o envio do formulário de fornecedores.
elemento("supplier-form").addEventListener("submit", evento => {
  evento.preventDefault(); // Evita o recarregamento do site.
  const formulario = evento.currentTarget; // Recupera o formulário utilizado.
  const campos = Object.fromEntries(new FormData(formulario).entries()); // Lê todos os campos.
  Object.keys(campos).forEach(chave => campos[chave] = campos[chave].trim()); // Remove espaços extras dos textos.

  if (!formatoCnpjValido(campos.cnpj)) { // Verifica o formato do documento.
    alert("O CNPJ deve conter 14 dígitos, ou pode ficar vazio."); // Explica o problema.
    return; // Impede o salvamento incorreto.
  } // Finaliza a primeira verificação.

  if (cnpjDuplicado(campos.cnpj)) { // Verifica a existência de outro cadastro com o documento.
    alert("Já existe um fornecedor cadastrado com esse CNPJ."); // Informa a duplicidade.
    return; // Interrompe o cadastro duplicado.
  } // Finaliza a verificação de duplicidade.

  if (idEmEdicao !== null) { // Verifica se o usuário está editando.
    const indice = fornecedores.findIndex(item => item.id === idEmEdicao); // Procura o registro original.
    if (indice === -1) return; // Impede a edição de um registro inexistente.
    fornecedores[indice] = { ...fornecedores[indice], ...campos }; // Atualiza os dados do fornecedor.
  } else { // Executa quando o usuário está criando um registro.
    const id = crypto.randomUUID(); // Gera um identificador exclusivo.
    fornecedores.unshift({ id, ...campos, criadoEm: new Date().toISOString() }); // Adiciona o novo fornecedor no início da lista.
  } // Finaliza a decisão entre cadastro e edição.

  if (salvar()) { // Verifica se os dados foram gravados.
    limparFormulario(); // Limpa o formulário após salvar.
    avisar("Fornecedor salvo com sucesso!"); // Exibe a confirmação.
  } // Finaliza o processamento bem-sucedido.
}); // Finaliza o evento do formulário.

// Devolve a classe visual correspondente ao status.
function classeStatus(status) {
  if (status === "Inativo") return "danger"; // Vermelho para inativos.
  if (status === "Em análise") return "warning"; // Amarelo para análise.
  return ""; // Verde para ativos.
} // Finaliza a classificação visual.

// Cria uma etiqueta colorida de status.
function criarStatus(status) {
  return `<span class="tag ${classeStatus(status)}">${escapar(status)}</span>`; // Retorna uma etiqueta segura.
} // Finaliza a etiqueta.

// Recupera os fornecedores conforme pesquisa e filtros.
function fornecedoresFiltrados() {
  const pesquisa = elemento("search-supplier").value.toLocaleLowerCase("pt-BR").trim(); // Obtém o termo de pesquisa.
  const categoria = elemento("filter-category").value; // Obtém a categoria selecionada.
  const status = elemento("filter-status").value; // Obtém o status selecionado.
  return fornecedores.filter(item => { // Percorre os fornecedores cadastrados.
    const texto = [item.nome, item.fantasia, item.cnpj, item.cidade, item.produtos].join(" ").toLocaleLowerCase("pt-BR"); // Reúne os campos pesquisáveis.
    const correspondePesquisa = texto.includes(pesquisa); // Verifica se o texto contém a pesquisa.
    const correspondeCategoria = !categoria || item.categoria === categoria; // Verifica a categoria.
    const correspondeStatus = !status || item.status === status; // Verifica a situação.
    return correspondePesquisa && correspondeCategoria && correspondeStatus; // Retorna os registros compatíveis.
  }); // Finaliza a filtragem.
} // Finaliza a função de pesquisa.

// Atualiza a tabela dos fornecedores.
function mostrarFornecedores() {
  const registros = fornecedoresFiltrados(); // Recupera os fornecedores após aplicar os filtros.
  elemento("list-count").textContent = `${registros.length} registro(s) encontrado(s)`; // Atualiza a contagem da tabela.
  if (registros.length === 0) { // Verifica se a lista está vazia.
    elemento("supplier-table").innerHTML = '<tr><td colspan="6" class="empty">Nenhum fornecedor encontrado.</td></tr>'; // Apresenta uma mensagem.
    return; // Encerra a função.
  } // Finaliza a verificação de lista vazia.

  elemento("supplier-table").innerHTML = registros.map(item => { // Gera uma linha para cada fornecedor.
    const nome = `<strong class="cell-title">${escapar(item.nome)}</strong><small class="cell-sub">${escapar(item.fantasia || item.cnpj || "Fornecedor cadastrado")}</small>`; // Monta a identificação da empresa.
    const contato = `${escapar(item.telefone)}<small class="cell-sub">${escapar(item.email)}</small>`; // Monta o contato.
    const local = `${escapar(item.cidade)} - ${escapar(item.uf)}`; // Monta a localização.
    const acoes = `<button class="row-button" data-action="view" data-id="${item.id}">Detalhes</button><button class="row-button" data-action="edit" data-id="${item.id}">Editar</button><button class="row-button delete" data-action="delete" data-id="${item.id}">Excluir</button>`; // Cria os botões de cada registro.
    return `<tr><td>${nome}</td><td>${escapar(item.categoria)}</td><td>${contato}</td><td>${local}</td><td>${criarStatus(item.status)}</td><td>${acoes}</td></tr>`; // Retorna a linha completa.
  }).join(""); // Insere todas as linhas na tabela.
} // Finaliza a apresentação dos fornecedores.

// Atualiza os resultados quando o usuário pesquisa.
elemento("search-supplier").addEventListener("input", mostrarFornecedores); // Atualiza a tabela durante a digitação.

// Atualiza os resultados ao escolher uma categoria.
elemento("filter-category").addEventListener("change", mostrarFornecedores); // Aplica o filtro de categoria.

// Atualiza os resultados ao escolher um status.
elemento("filter-status").addEventListener("change", mostrarFornecedores); // Aplica o filtro de situação.

// Calcula a quantidade de dias até determinada data.
function diasAte(dataTexto) {
  if (!dataTexto) return null; // Ignora datas não preenchidas.
  const partes = dataTexto.split("-").map(Number); // Divide ano, mês e dia.
  const destino = Date.UTC(partes[0], partes[1] - 1, partes[2]); // Converte a data de destino para UTC.
  const hoje = new Date(); // Obtém a data atual.
  const atual = Date.UTC(hoje.getFullYear(), hoje.getMonth(), hoje.getDate()); // Converte somente o dia atual para UTC.
  return Math.round((destino - atual) / 86400000); // Calcula a diferença em dias.
} // Finaliza o cálculo de datas.

// Formata datas para o padrão brasileiro.
function dataBrasileira(valor) {
  if (!valor) return "Não informado"; // Trata datas vazias.
  const partes = valor.split("-"); // Divide a data em partes.
  return `${partes[2]}/${partes[1]}/${partes[0]}`; // Retorna dia, mês e ano.
} // Finaliza a formatação.

// Informa a situação de vencimento de um contrato.
function situacaoContrato(data) {
  const dias = diasAte(data); // Calcula os dias restantes.
  if (dias === null) return { texto: "Sem vencimento", classe: "" }; // Identifica contratos sem data.
  if (dias < 0) return { texto: "Vencido", classe: "danger" }; // Identifica datas vencidas.
  if (dias === 0) return { texto: "Vence hoje", classe: "warning" }; // Identifica vencimento no dia.
  if (dias <= 30) return { texto: `Vence em ${dias} dia(s)`, classe: "warning" }; // Identifica vencimentos próximos.
  return { texto: "Dentro do prazo", classe: "" }; // Identifica contratos dentro do prazo.
} // Finaliza a classificação do contrato.

// Apresenta os contratos em uma tabela.
function mostrarContratos() {
  const corpo = elemento("contracts-table"); // Localiza a tabela.
  if (fornecedores.length === 0) { // Verifica se há registros.
    corpo.innerHTML = '<tr><td colspan="5" class="empty">Cadastre fornecedores para acompanhar os contratos.</td></tr>'; // Mostra uma orientação.
    return; // Encerra a função.
  } // Finaliza a verificação.
  corpo.innerHTML = fornecedores.map(item => { // Percorre os fornecedores.
    const situacao = situacaoContrato(item.vencimento); // Calcula a situação do contrato.
    const etiqueta = `<span class="tag ${situacao.classe}">${situacao.texto}</span>`; // Gera o indicador de prazo.
    return `<tr><td>${escapar(item.nome)}</td><td>${dataBrasileira(item.inicio)}</td><td>${dataBrasileira(item.vencimento)}</td><td>${etiqueta}</td><td><button class="row-button" data-action="edit" data-id="${item.id}">Editar contrato</button></td></tr>`; // Cria uma linha da tabela.
  }).join(""); // Insere todas as linhas.
} // Finaliza a lista dos contratos.

// Gera as quantidades de fornecedores por categoria.
function contarCategorias() {
  const contagem = {}; // Cria um objeto de contagens.
  fornecedores.forEach(item => { // Percorre as empresas cadastradas.
    const categoria = item.categoria || "Outros"; // Identifica a categoria.
    contagem[categoria] = (contagem[categoria] || 0) + 1; // Acrescenta uma unidade na contagem.
  }); // Finaliza o agrupamento.
  return Object.entries(contagem).sort((a, b) => b[1] - a[1]); // Retorna categorias da maior para a menor.
} // Finaliza a contagem por categoria.

// Cria um gráfico horizontal utilizando HTML e CSS.
function criarGrafico(destino) {
  const categorias = contarCategorias(); // Obtém as categorias cadastradas.
  if (categorias.length === 0) { // Verifica se o gráfico está vazio.
    elemento(destino).innerHTML = '<p class="empty">Os gráficos aparecerão após o primeiro cadastro.</p>'; // Exibe uma mensagem.
    return; // Encerra a função.
  } // Finaliza a verificação.
  const maior = categorias[0][1]; // Obtém a maior quantidade para calcular as proporções.
  elemento(destino).innerHTML = categorias.map(([nome, quantidade]) => { // Percorre as categorias.
    const largura = (quantidade / maior) * 100; // Calcula a largura proporcional da barra.
    return `<div class="category-item"><div class="category-top"><span>${escapar(nome)}</span><strong>${quantidade}</strong></div><div class="category-track"><div class="category-fill" style="width:${largura}%"></div></div></div>`; // Monta o gráfico.
  }).join(""); // Insere as barras na interface.
} // Finaliza a criação do gráfico.

// Mostra os fornecedores cadastrados mais recentemente.
function mostrarRecentes() {
  const recentes = fornecedores.slice(0, 5); // Seleciona até cinco registros recentes.
  if (recentes.length === 0) { // Verifica se ainda não há cadastros.
    elemento("recentes").innerHTML = '<p class="empty">Nenhum fornecedor cadastrado.</p>'; // Mostra o estado inicial.
    return; // Finaliza a função.
  } // Encerra a verificação.
  elemento("recentes").innerHTML = recentes.map(item => { // Percorre os registros recentes.
    return `<div class="recent-item"><div><strong>${escapar(item.nome)}</strong><small>${escapar(item.categoria)}</small></div>${criarStatus(item.status)}</div>`; // Monta cada resumo.
  }).join(""); // Insere a lista na página inicial.
} // Finaliza os fornecedores recentes.

// Atualiza todos os indicadores do sistema.
function atualizarIndicadores() {
  const ativos = fornecedores.filter(item => item.status === "Ativo").length; // Conta os ativos.
  const analise = fornecedores.filter(item => item.status === "Em análise").length; // Conta os pendentes de análise.
  const inativos = fornecedores.filter(item => item.status === "Inativo").length; // Conta os inativos.
  const vencimentos = fornecedores.filter(item => { // Percorre os fornecedores para encontrar vencimentos.
    const dias = diasAte(item.vencimento); // Calcula o prazo restante.
    return dias !== null && dias >= 0 && dias <= 30; // Conta vencimentos nos próximos 30 dias.
  }).length; // Finaliza a contagem.
  elemento("stat-total").textContent = fornecedores.length; // Atualiza o total geral.
  elemento("stat-ativos").textContent = ativos; // Atualiza os parceiros ativos.
  elemento("stat-analise").textContent = analise; // Atualiza os fornecedores em análise.
  elemento("stat-vencimentos").textContent = vencimentos; // Atualiza os contratos próximos do vencimento.
  elemento("report-total").textContent = fornecedores.length; // Atualiza o relatório geral.
  elemento("report-active").textContent = ativos; // Atualiza o relatório de ativos.
  elemento("report-inactive").textContent = inativos; // Atualiza o relatório de inativos.
  elemento("report-review").textContent = analise; // Atualiza o relatório de análises.
} // Finaliza os indicadores.

// Preenche o formulário para editar um fornecedor existente.
function editarFornecedor(id) {
  const fornecedor = fornecedores.find(item => item.id === id); // Localiza o registro.
  if (!fornecedor) return; // Encerra caso não exista.
  navegar("fornecedores"); // Abre a página de fornecedores.
  const formulario = elemento("supplier-form"); // Recupera o formulário.
  formulario.reset(); // Limpa valores de uma edição anterior.
  Object.keys(fornecedor).forEach(campo => { // Percorre as propriedades do fornecedor.
    const entrada = formulario.elements.namedItem(campo); // Encontra o campo correspondente.
    if (entrada) entrada.value = fornecedor[campo] || ""; // Insere o valor anterior.
  }); // Finaliza o preenchimento.
  idEmEdicao = id; // Guarda o fornecedor em edição.
  elemento("form-title").textContent = "Editar fornecedor"; // Atualiza o título do formulário.
  elemento("submit-supplier").textContent = "Salvar alterações"; // Altera o botão de envio.
  elemento("form-area").scrollIntoView({ behavior: "smooth", block: "start" }); // Mostra o formulário na tela.
} // Finaliza a edição de fornecedores.

// Mostra informações detalhadas de um fornecedor.
function verDetalhes(id) {
  const fornecedor = fornecedores.find(item => item.id === id); // Encontra o fornecedor.
  if (!fornecedor) return; // Encerra se não existir.
  const detalhes = [ // Cria uma lista de informações para consulta.
    `Empresa: ${fornecedor.nome}`, // Exibe o nome empresarial.
    `Nome fantasia: ${fornecedor.fantasia || "Não informado"}`, // Exibe o nome comercial.
    `CNPJ: ${fornecedor.cnpj || "Não informado"}`, // Exibe o documento cadastrado.
    `Categoria: ${fornecedor.categoria}`, // Exibe o segmento.
    `Telefone: ${fornecedor.telefone}`, // Exibe o telefone.
    `E-mail: ${fornecedor.email}`, // Exibe o e-mail.
    `Localização: ${fornecedor.cidade}/${fornecedor.uf}`, // Exibe cidade e estado.
    `Endereço: ${fornecedor.endereco || "Não informado"}`, // Exibe o endereço.
    `Produtos: ${fornecedor.produtos || "Não informado"}`, // Exibe os produtos.
    `Status: ${fornecedor.status}`, // Exibe a situação.
    `Início: ${dataBrasileira(fornecedor.inicio)}`, // Exibe o início da parceria.
    `Vencimento: ${dataBrasileira(fornecedor.vencimento)}`, // Exibe o vencimento.
    `Observações: ${fornecedor.observacoes || "Nenhuma"}` // Exibe as observações.
  ].join("\n"); // Junta as informações em linhas.
  alert(detalhes); // Abre a consulta de detalhes.
} // Finaliza a visualização dos detalhes.

// Exclui um fornecedor após confirmação.
function excluirFornecedor(id) {
  const fornecedor = fornecedores.find(item => item.id === id); // Localiza o registro.
  if (!fornecedor) return; // Encerra se não existir.
  if (!confirm(`Excluir o fornecedor "${fornecedor.nome}"?`)) return; // Solicita confirmação.
  const anteriores = fornecedores; // Guarda temporariamente a lista antiga.
  fornecedores = fornecedores.filter(item => item.id !== id); // Remove o fornecedor selecionado.
  if (!salvar()) { fornecedores = anteriores; return; } // Restaura a lista se o salvamento falhar.
  if (idEmEdicao === id) limparFormulario(); // Limpa o formulário se o registro estava em edição.
  avisar("Fornecedor excluído."); // Confirma a exclusão.
} // Finaliza a função de exclusão.

// Detecta cliques nos botões das tabelas.
document.addEventListener("click", evento => {
  const botao = evento.target.closest("[data-action]"); // Identifica um botão de ação.
  if (!botao) return; // Ignora os outros cliques.
  const acao = botao.dataset.action; // Obtém a ação solicitada.
  const id = botao.dataset.id; // Obtém o identificador do registro.
  if (acao === "view") verDetalhes(id); // Abre os detalhes do fornecedor.
  if (acao === "edit") editarFornecedor(id); // Abre a edição.
  if (acao === "delete") excluirFornecedor(id); // Executa a exclusão.
}); // Finaliza os eventos das tabelas.

// Prepara o conteúdo de um arquivo CSV.
function gerarCSV() {
  const colunas = ["nome", "fantasia", "cnpj", "categoria", "telefone", "email", "cidade", "uf", "endereco", "produtos", "status", "inicio", "vencimento", "observacoes"]; // Define os campos exportados.
  const linhas = [colunas, ...fornecedores.map(item => colunas.map(campo => item[campo] || ""))]; // Reúne cabeçalho e registros.
  return linhas.map(linha => linha.map(valor => { // Formata cada célula do arquivo.
    const texto = String(valor).replace(/^[\s]*[=+\-@]/, "'$&"); // Evita interpretar conteúdo cadastrado como fórmula de planilha.
    return `"${texto.replace(/"/g, '""')}"`; // Escapa aspas e envolve o texto entre aspas.
  }).join(";")).join("\r\n"); // Junta colunas e linhas no formato CSV.
} // Finaliza a geração do conteúdo.

// Inicia o download de um arquivo CSV.
function exportarCSV() {
  const conteudo = gerarCSV(); // Obtém os dados formatados.
  const arquivo = new Blob(["\uFEFF", conteudo], { type: "text/csv;charset=utf-8" }); // Cria o arquivo com codificação UTF-8.
  const endereco = URL.createObjectURL(arquivo); // Gera um endereço temporário.
  const link = document.createElement("a"); // Cria um link temporário.
  link.href = endereco; // Associa o arquivo ao link.
  link.download = "healthfood-fornecedores.csv"; // Define o nome do download.
  document.body.appendChild(link); // Insere o link na página.
  link.click(); // Inicia o download.
  link.remove(); // Remove o link temporário.
  setTimeout(() => URL.revokeObjectURL(endereco), 1000); // Libera os recursos utilizados.
  avisar("Relatório CSV gerado."); // Confirma a exportação.
} // Finaliza a exportação.

// Configura o botão de exportação da lista.
elemento("export-fornecedores").addEventListener("click", exportarCSV); // Exporta os fornecedores.

// Configura o botão de exportação dos relatórios.
elemento("export-report").addEventListener("click", exportarCSV); // Exporta a mesma base de dados.

// Atualiza todas as partes do painel.
function atualizarTudo() {
  mostrarFornecedores(); // Atualiza a tabela de fornecedores.
  mostrarContratos(); // Atualiza o acompanhamento de contratos.
  mostrarRecentes(); // Atualiza os fornecedores recentes.
  criarGrafico("categorias-grafico"); // Atualiza as barras na visão geral.
  criarGrafico("report-categories"); // Atualiza o gráfico dos relatórios.
  atualizarIndicadores(); // Recalcula todos os totais.
} // Finaliza a atualização geral.

// Inicia o painel ao abrir o site.
atualizarTudo(); // Exibe os dados armazenados ou o estado inicial vazio.
