const STORAGE_KEY = 'freefood_restaurante_parceiro_v1'

export function lerBanco() {
  const salvo = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null')
  return {
    restaurante:
      salvo?.restaurante && typeof salvo.restaurante === 'object' ? salvo.restaurante : null,
    produtos: Array.isArray(salvo?.produtos) ? salvo.produtos : [],
    pedidos: Array.isArray(salvo?.pedidos) ? salvo.pedidos : [],
  }
}

export function gravarBanco(banco) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(banco))
}

export function campos(formulario) {
  return Object.fromEntries(
    Array.from(new FormData(formulario), ([chave, valor]) => [chave, valor.trim()]),
  )
}

export function identificador() {
  return globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

export function moeda(valor) {
  return Number(valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export const etapasEntrega = ['Recebido', 'Em preparo', 'Pronto', 'Saiu para entrega', 'Concluído']

export function etapas(pedido) {
  return pedido.modalidade === 'Retirada'
    ? etapasEntrega.filter((etapa) => etapa !== 'Saiu para entrega')
    : [...etapasEntrega]
}

export function proximaEtapa(pedido) {
  if (['Concluído', 'Cancelado'].includes(pedido.status)) return null
  const fluxo = etapas(pedido)
  return fluxo[fluxo.indexOf(pedido.status) + 1] || null
}

export function totalDosItens(itens) {
  return (
    itens.reduce((soma, item) => {
      if (!item || !Number.isInteger(item.quantidade) || item.quantidade < 1) return soma
      return soma + Math.round(item.preco * 100) * item.quantidade
    }, 0) / 100
  )
}

export function resumoPedidos(pedidos) {
  const concluidos = pedidos.filter((pedido) => pedido.status === 'Concluído')
  const cancelados = pedidos.filter((pedido) => pedido.status === 'Cancelado').length
  return {
    concluidos: concluidos.length,
    cancelados,
    andamento: pedidos.length - concluidos.length - cancelados,
    vendas: concluidos.reduce((soma, pedido) => soma + Math.round(pedido.total * 100), 0) / 100,
  }
}

export function exportarPedidos(pedidos) {
  const linhas = [
    ['Pedido', 'Cliente', 'Itens', 'Total', 'Modalidade', 'Etapa', 'Data'],
    ...pedidos.map((pedido) => [
      pedido.numero,
      pedido.cliente,
      pedido.itens.map((item) => `${item.quantidade} x ${item.nome}`).join(' | '),
      pedido.total.toFixed(2).replace('.', ','),
      pedido.modalidade,
      pedido.status,
      new Date(pedido.criadoEm).toLocaleString('pt-BR'),
    ]),
  ]

  const csv = linhas
    .map((linha) =>
      linha
        .map((valor) => {
          const texto = String(valor).replace(/^\s*[=+@-]/, "'$&")
          return `"${texto.replace(/"/g, '""')}"`
        })
        .join(';'),
    )
    .join('\r\n')

  const url = URL.createObjectURL(new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = url
  link.download = 'healthfood-meus-pedidos.csv'
  document.body.append(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
