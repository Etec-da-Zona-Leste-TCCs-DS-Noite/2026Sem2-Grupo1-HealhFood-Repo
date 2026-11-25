const CHAVE = 'healthfood_admin_zero_v2'

export function carregarDados() {
  let salvo
  try {
    salvo = JSON.parse(localStorage.getItem(CHAVE) || 'null')
  } catch (erro) {
    console.error('Erro ao carregar informações:', erro)
  }

  return {
    restaurantes: Array.isArray(salvo?.restaurantes) ? salvo.restaurantes : [],
    pedidos: Array.isArray(salvo?.pedidos) ? salvo.pedidos : [],
    financeiro: Array.isArray(salvo?.financeiro) ? salvo.financeiro : [],
  }
}

export function salvarDados(dados) {
  localStorage.setItem(CHAVE, JSON.stringify(dados))
}

export function moeda(valor) {
  return Number(valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function dataAtual() {
  const agora = new Date()
  const mes = String(agora.getMonth() + 1).padStart(2, '0')
  const dia = String(agora.getDate()).padStart(2, '0')
  return `${agora.getFullYear()}-${mes}-${dia}`
}

export function totaisFinanceiros(registros) {
  const totalEmCentavos = (tipo) =>
    registros
      .filter((registro) => registro.tipo === tipo)
      .reduce((soma, registro) => soma + Math.round(Number(registro.valor) * 100), 0)
  const receitas = totalEmCentavos('Receita')
  const despesas = totalEmCentavos('Despesa')
  return {
    receitas: receitas / 100,
    despesas: despesas / 100,
    saldo: (receitas - despesas) / 100,
  }
}

export function exportarFinanceiro(registros) {
  const linhas = [
    ['Descrição', 'Tipo', 'Valor', 'Data'],
    ...registros.map(({ descricao, tipo, valor, data }) => [descricao, tipo, valor, data]),
  ]
  const csv = linhas
    .map((linha) =>
      linha
        .map((valor) => {
          // Impede que planilhas interpretem textos cadastrados como fórmulas.
          const texto = String(valor).replace(/^\s*[=+@-]/, "'$&")
          return `"${texto.replace(/"/g, '""')}"`
        })
        .join(';'),
    )
    .join('\r\n')

  const url = URL.createObjectURL(new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = url
  link.download = 'healthfood-financeiro.csv'
  document.body.append(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
