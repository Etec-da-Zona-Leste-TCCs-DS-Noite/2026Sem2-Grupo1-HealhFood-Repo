// O carrinho pode continuar só no aparelho. Se o backend quiser guardá-lo, troque aqui.
import { CHAVES, gravar, ler } from './storage';

const chaveDo = (usuarioId) => `${CHAVES.carrinho}:${usuarioId}`;

export async function obterCarrinho(usuarioId) {
  return ler(chaveDo(usuarioId), []);
}

export async function salvarCarrinho(usuarioId, itens) {
  await gravar(chaveDo(usuarioId), itens);
}
