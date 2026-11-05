// DADOS DEMONSTRATIVOS.
// Quando a API existir, estes produtos virão do cadastro do painel administrativo.
// Campos que o administrativo já tem: nome, preco, restaurante, categoria.
// Campos novos (o admin precisa passar a cadastrar): descricao, ingredientes, alergenos, tags.
// alergenos usa os nomes de INGREDIENTES em utils/restricoes.js.
// tags aceitas: vegano, vegetariano, sem_gluten, baixo_acucar, baixo_sodio.
export const PRODUTOS_DEMO = [
  {
    id: '1', nome: 'Bowl de quinoa com legumes', categoria: 'Refeição', restaurante: 'Cozinha Verde', preco: 32.9,
    descricao: 'Quinoa, legumes assados e grão-de-bico finalizados com azeite.',
    ingredientes: ['Quinoa', 'Abobrinha', 'Cenoura', 'Grão-de-bico', 'Azeite'],
    alergenos: [], tags: ['vegano', 'vegetariano', 'sem_gluten', 'baixo_acucar', 'baixo_sodio'],
  },
  {
    id: '2', nome: 'Salada Caesar com frango', categoria: 'Refeição', restaurante: 'Cozinha Verde', preco: 29.9,
    descricao: 'Alface, frango grelhado, parmesão, croutons e molho caesar.',
    ingredientes: ['Alface', 'Frango grelhado', 'Queijo parmesão', 'Croutons', 'Molho caesar'],
    alergenos: ['Leite', 'Ovos', 'Trigo', 'Peixes'], tags: ['baixo_acucar'],
  },
  {
    id: '3', nome: 'Wrap integral de falafel', categoria: 'Lanche', restaurante: 'Cozinha Verde', preco: 24.5,
    descricao: 'Pão folha integral, falafel, homus, tomate e folhas.',
    ingredientes: ['Pão folha integral', 'Falafel', 'Homus', 'Tomate', 'Folhas verdes'],
    alergenos: ['Trigo', 'Gergelim'], tags: ['vegano', 'vegetariano'],
  },
  {
    id: '4', nome: 'Omelete de espinafre', categoria: 'Refeição', restaurante: 'Cozinha Verde', preco: 22,
    descricao: 'Omelete com espinafre, cebola e queijo minas.',
    ingredientes: ['Ovos', 'Espinafre', 'Queijo minas', 'Cebola'],
    alergenos: ['Ovos', 'Leite'], tags: ['vegetariano', 'sem_gluten', 'baixo_acucar'],
  },
  {
    id: '5', nome: 'Sopa de lentilha', categoria: 'Refeição', restaurante: 'Cozinha Verde', preco: 18.5,
    descricao: 'Sopa de lentilha com cenoura, cebola e alho.',
    ingredientes: ['Lentilha', 'Cenoura', 'Cebola', 'Alho', 'Sal'],
    alergenos: [], tags: ['vegano', 'vegetariano', 'sem_gluten'],
  },
  {
    id: '6', nome: 'Pão de queijo (6 unidades)', categoria: 'Lanche', restaurante: 'Padaria Grão Fino', preco: 14,
    descricao: 'Pão de queijo assado na hora.',
    ingredientes: ['Polvilho', 'Queijo', 'Ovos', 'Leite'],
    alergenos: ['Leite', 'Ovos'], tags: ['vegetariano', 'sem_gluten'],
  },
  {
    id: '7', nome: 'Granola artesanal com castanhas', categoria: 'Lanche', restaurante: 'Padaria Grão Fino', preco: 19.9,
    descricao: 'Aveia, castanhas, coco e mel.',
    ingredientes: ['Aveia', 'Castanhas', 'Coco', 'Mel'],
    alergenos: ['Castanhas'], tags: ['vegetariano'],
  },
  {
    id: '8', nome: 'Bolo de cenoura fit', categoria: 'Sobremesa', restaurante: 'Padaria Grão Fino', preco: 12.5,
    descricao: 'Bolo com farinha integral e adoçante.',
    ingredientes: ['Farinha de trigo integral', 'Cenoura', 'Ovos', 'Óleo', 'Adoçante'],
    alergenos: ['Trigo', 'Ovos'], tags: ['vegetariano', 'baixo_acucar'],
  },
  {
    id: '9', nome: 'Brownie vegano de cacau', categoria: 'Sobremesa', restaurante: 'Padaria Grão Fino', preco: 11.9,
    descricao: 'Brownie com cacau, farinha de arroz e óleo de coco.',
    ingredientes: ['Cacau', 'Farinha de arroz', 'Óleo de coco', 'Açúcar de coco'],
    alergenos: [], tags: ['vegano', 'vegetariano', 'sem_gluten'],
  },
  {
    id: '10', nome: 'Suco verde', categoria: 'Bebida', restaurante: 'Sucos & Cia', preco: 9.9,
    descricao: 'Couve, limão, maçã e gengibre.',
    ingredientes: ['Couve', 'Limão', 'Maçã', 'Gengibre'],
    alergenos: [], tags: ['vegano', 'vegetariano', 'sem_gluten', 'baixo_sodio'],
  },
  {
    id: '11', nome: 'Bebida de amêndoas', categoria: 'Bebida', restaurante: 'Sucos & Cia', preco: 12.9,
    descricao: 'Bebida vegetal de amêndoas com tâmara.',
    ingredientes: ['Amêndoas', 'Água', 'Tâmara'],
    alergenos: ['Castanhas'], tags: ['vegano', 'vegetariano', 'sem_gluten', 'baixo_sodio'],
  },
  {
    id: '12', nome: 'Iogurte natural com frutas', categoria: 'Sobremesa', restaurante: 'Sucos & Cia', preco: 10.9,
    descricao: 'Iogurte natural com morango e banana.',
    ingredientes: ['Iogurte natural', 'Morango', 'Banana'],
    alergenos: ['Leite'], tags: ['vegetariano', 'sem_gluten'],
  },
];

// Mesmas categorias do painel administrativo.
export const CATEGORIAS = ['Refeição', 'Lanche', 'Bebida', 'Sobremesa'];
