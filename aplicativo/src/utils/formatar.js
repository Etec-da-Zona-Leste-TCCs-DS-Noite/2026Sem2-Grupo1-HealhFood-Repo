export function formatarPreco(valor) {
  return `R$ ${Number(valor || 0).toFixed(2).replace('.', ',')}`;
}

export function formatarData(iso) {
  const data = new Date(iso);
  return Number.isNaN(data.getTime()) ? '' : data.toLocaleString('pt-BR');
}

export function primeiroNome(nome) {
  return String(nome || '').trim().split(' ')[0] || 'Visitante';
}

export function gerarId() {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}
