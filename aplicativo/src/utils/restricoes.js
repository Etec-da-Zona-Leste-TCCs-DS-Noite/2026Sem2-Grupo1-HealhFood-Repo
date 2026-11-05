// Opções mostradas no questionário.
export const RESTRICOES = [
  { id: 'diabetes', titulo: 'Diabetes', descricao: 'Necessidades relacionadas ao controle da glicose.', emoji: '🩸' },
  { id: 'hipertensao', titulo: 'Hipertensão', descricao: 'Atenção às informações sobre sódio.', emoji: '❤️' },
  { id: 'alergia', titulo: 'Alergia alimentar', descricao: 'Identifique os ingredientes que precisam ser evitados.', emoji: '⚠️' },
  { id: 'lactose', titulo: 'Intolerância à lactose', descricao: 'Atenção à presença de lactose e derivados.', emoji: '🥛' },
  { id: 'gluten', titulo: 'Necessidade de evitar glúten', descricao: 'Verifique ingredientes e informações relevantes.', emoji: '🌾' },
  { id: 'vegetariano', titulo: 'Preferência vegetariana', descricao: 'Preferência alimentar, não condição médica.', emoji: '🥦' },
  { id: 'vegano', titulo: 'Preferência vegana', descricao: 'Preferência por alimentos sem ingredientes de origem animal.', emoji: '🌱' },
  { id: 'nenhuma', titulo: 'Nenhuma dessas opções', descricao: 'Quero explorar os alimentos sem cadastrar restrições.', emoji: '🍽️' },
];

// Os alérgenos dos produtos usam exatamente estes nomes.
export const INGREDIENTES = [
  'Leite', 'Amendoim', 'Castanhas', 'Ovos', 'Soja',
  'Trigo', 'Peixes', 'Crustáceos', 'Gergelim', 'Outro',
];

export const TAGS_PRODUTO = {
  vegano: 'Vegano',
  vegetariano: 'Vegetariano',
  sem_gluten: 'Sem glúten',
  baixo_acucar: 'Baixo açúcar',
  baixo_sodio: 'Baixo sódio',
};

export function tituloDaRestricao(id) {
  return RESTRICOES.find((item) => item.id === id)?.titulo ?? id;
}

// Compara um produto com o perfil da pessoa.
// nivel: 'evitar' (contém algo que a pessoa evita), 'atencao' (falta confirmar) ou 'ok'.
// Importante: 'ok' significa "nada no cadastro contradiz o perfil", e não garante segurança.
export function avaliarProduto(produto, perfil) {
  const restricoes = (perfil?.restricoes ?? []).filter((id) => id !== 'nenhuma');
  const evitados = perfil?.ingredientesEvitados ?? [];

  if (restricoes.length === 0) {
    return { nivel: 'ok', evitar: [], atencao: [], ok: [], semPerfil: true };
  }

  const alergenos = produto.alergenos ?? null; // null = o cadastro não informou
  const tags = produto.tags ?? [];
  const evitar = [];
  const atencao = [];
  const ok = [];

  if (restricoes.includes('alergia')) {
    const conhecidos = evitados.filter((item) => item !== 'Outro');
    if (alergenos === null) {
      atencao.push('Alérgenos não informados no cadastro');
    } else {
      const presentes = conhecidos.filter((item) => alergenos.includes(item));
      if (presentes.length > 0) evitar.push(`Contém ${presentes.join(', ')}`);
      else if (conhecidos.length > 0) ok.push(`Sem ${conhecidos.join(', ')} no cadastro`);
    }
    if (evitados.includes('Outro')) {
      atencao.push('Você indicou outro ingrediente a evitar: confira a lista completa');
    }
  }

  if (restricoes.includes('lactose')) {
    if (alergenos === null) atencao.push('Confirme a presença de lactose');
    else if (alergenos.includes('Leite')) evitar.push('Contém leite');
    else ok.push('Sem leite no cadastro');
  }

  if (restricoes.includes('gluten')) {
    if (alergenos?.includes('Trigo')) evitar.push('Contém trigo (glúten)');
    else if (tags.includes('sem_gluten')) ok.push('Sem glúten');
    else atencao.push('Confirme a presença de glúten');
  }

  if (restricoes.includes('vegano')) {
    if (tags.includes('vegano')) ok.push('Vegano');
    else evitar.push('Não é vegano');
  } else if (restricoes.includes('vegetariano')) {
    if (tags.includes('vegano') || tags.includes('vegetariano')) ok.push('Vegetariano');
    else evitar.push('Contém ingredientes de origem animal');
  }

  if (restricoes.includes('diabetes')) {
    if (tags.includes('baixo_acucar')) ok.push('Baixo teor de açúcar');
    else atencao.push('Confira açúcares e carboidratos na rotulagem');
  }

  if (restricoes.includes('hipertensao')) {
    if (tags.includes('baixo_sodio')) ok.push('Baixo teor de sódio');
    else atencao.push('Confira o teor de sódio na rotulagem');
  }

  const nivel = evitar.length > 0 ? 'evitar' : atencao.length > 0 ? 'atencao' : 'ok';
  return { nivel, evitar, atencao, ok, semPerfil: false };
}

const ORDEM = { ok: 0, atencao: 1, evitar: 2 };
export function ordemDoNivel(nivel) {
  return ORDEM[nivel] ?? 1;
}
