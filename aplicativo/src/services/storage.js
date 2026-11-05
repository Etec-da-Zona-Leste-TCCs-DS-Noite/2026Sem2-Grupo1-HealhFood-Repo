import AsyncStorage from '@react-native-async-storage/async-storage';

// Chaves do armazenamento do aparelho. Servem só para a versão sem backend.
export const CHAVES = {
  usuarios: '@healthfood:usuarios',
  sessao: '@healthfood:sessao',
  perfis: '@healthfood:perfis',
  carrinho: '@healthfood:carrinho',
  pedidos: '@healthfood:pedidos',
};

export async function ler(chave, padrao) {
  try {
    const texto = await AsyncStorage.getItem(chave);
    return texto ? JSON.parse(texto) : padrao;
  } catch {
    return padrao;
  }
}

export async function gravar(chave, valor) {
  await AsyncStorage.setItem(chave, JSON.stringify(valor));
}

export async function remover(chave) {
  await AsyncStorage.removeItem(chave);
}
