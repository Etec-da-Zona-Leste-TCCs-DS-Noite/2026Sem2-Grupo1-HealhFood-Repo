import { useEffect, useRef, useState } from 'react'
import {
  campos,
  etapas,
  etapasEntrega,
  exportarPedidos,
  gravarBanco,
  identificador,
  lerBanco,
  moeda,
  proximaEtapa,
  resumoPedidos,
  totalDosItens,
} from './dados.js'

const menu = [
  { id: 'dashboard', icone: '▦', titulo: 'Visão geral' },
  { id: 'restaurante', icone: '▣', titulo: 'Meu restaurante' },
  { id: 'produtos', icone: '◈', titulo: 'Meu cardápio' },
  { id: 'pedidos', icone: '▤', titulo: 'Meus pedidos' },
  { id: 'relatorios', icone: '◫', titulo: 'Meus resultados' },
]

function iniciarBanco() {
  try {
    return { banco: lerBanco(), erro: false }
  } catch (erro) {
    console.error(erro)
    return { banco: { restaurante: null, produtos: [], pedidos: [] }, erro: true }
  }
}

export default function Fornecedores() {
  const [inicio] = useState(iniciarBanco)
  const [banco, setBanco] = useState(inicio.banco)
  const [pagina, setPagina] = useState('dashboard')
  const [aviso, setAviso] = useState('')
  const avisoTimer = useRef(null)
  const { restaurante, produtos, pedidos } = banco
  const resumo = resumoPedidos(pedidos)

  useEffect(() => {
    if (inicio.erro)
      window.alert(
        'Não foi possível ler os dados salvos. Verifique o armazenamento deste navegador.',
      )
    return () => clearTimeout(avisoTimer.current)
  }, [inicio.erro])

  function avisar(texto) {
    setAviso(texto)
    clearTimeout(avisoTimer.current)
    avisoTimer.current = setTimeout(() => setAviso(''), 3500)
  }

  function navegar(destino) {
    setPagina(destino)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function salvar(alteracoes) {
    const proximo = { ...banco, ...alteracoes }
    try {
      gravarBanco(proximo)
    } catch (erro) {
      console.error(erro)
      window.alert('Não foi possível salvar. Os campos foram mantidos para você tentar novamente.')
      return false
    }
    setBanco(proximo)
    return true
  }

  function exigirRestaurante() {
    if (restaurante) return true
    navegar('restaurante')
    avisar('Cadastre seu restaurante antes de continuar.')
    return false
  }

  return (
    <>
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-symbol">✚</div>
          <div>
            <strong>Health Food</strong>
            <small>Área do restaurante parceiro</small>
          </div>
        </div>
        <p className="nav-label">MEU RESTAURANTE</p>
        <nav aria-label="Menu principal">
          {menu.map(({ id, icone, titulo }) => (
            <button
              key={id}
              type="button"
              className={pagina === id ? 'nav-link active' : 'nav-link'}
              aria-current={pagina === id ? 'page' : undefined}
              onClick={() => navegar(id)}
            >
              <b aria-hidden="true">{icone}</b>
              <span>{titulo}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <span className="avatar">HF</span>
          <div>
            <strong id="nome-perfil">{restaurante?.nome || 'Meu restaurante'}</strong>
            <small>Restaurante parceiro</small>
          </div>
        </div>
      </aside>
      <main className="main">
        <header className="topbar">
          <div>
            <h1 id="page-title">{menu.find((item) => item.id === pagina).titulo}</h1>
            <p>Cuide do seu restaurante, do cardápio e de cada pedido.</p>
          </div>
          <span className="demo">● Protótipo acadêmico</span>
        </header>
        <VisaoGeral ativa={pagina === 'dashboard'} {...{ produtos, pedidos, resumo, navegar }} />
        <Restaurante ativa={pagina === 'restaurante'} {...{ restaurante, salvar, avisar }} />
        <Cardapio
          ativa={pagina === 'produtos'}
          {...{ produtos, salvar, avisar, exigirRestaurante }}
        />
        <Pedidos
          ativa={pagina === 'pedidos'}
          {...{ restaurante, produtos, pedidos, salvar, avisar, exigirRestaurante }}
        />
        <Resultados ativa={pagina === 'relatorios'} {...{ pedidos, resumo, avisar }} />
        <footer>
          Health Food © 2026 • Área do restaurante parceiro • Dados salvos apenas neste navegador.
        </footer>
      </main>
      <div id="toast" className={aviso ? 'toast show' : 'toast'} role="status" aria-live="polite">
        {aviso}
      </div>
    </>
  )
}

function Pagina({ id, ativa, children }) {
  return (
    <section className={ativa ? 'page active' : 'page'} id={id}>
      {children}
    </section>
  )
}

function Tag({ texto }) {
  let classe = 'tag'
  if (['Cancelado', 'Indisponível'].includes(texto)) classe += ' danger'
  if (['Recebido', 'Em preparo'].includes(texto)) classe += ' warning'
  return <span className={classe}>{texto}</span>
}

function VisaoGeral({ ativa, produtos, pedidos, resumo, navegar }) {
  return (
    <Pagina ativa={ativa} id="dashboard">
      <div className="hero">
        <span>HEALTH FOOD • ALIMENTAÇÃO SAUDÁVEL</span>
        <h2>Seu restaurante faz parte dessa escolha.</h2>
        <p>
          A Health Food aproxima pessoas de restaurantes que oferecem refeições saudáveis e
          informações claras sobre os alimentos. Apresente seus pratos, informe os ingredientes e
          acompanhe os pedidos do seu estabelecimento.
        </p>
        <button className="hero-button" onClick={() => navegar('restaurante')} type="button">
          Cadastrar meu restaurante →
        </button>
      </div>
      <div className="stats">
        <article className="stat">
          <span>Comidas cadastradas</span>
          <strong id="stat-produtos">{produtos.length}</strong>
          <small>Itens do seu cardápio</small>
        </article>
        <article className="stat">
          <span>Pedidos em andamento</span>
          <strong id="stat-andamento">{resumo.andamento}</strong>
          <small>Do recebimento à entrega</small>
        </article>
        <article className="stat">
          <span>Pedidos concluídos</span>
          <strong id="stat-concluidos">{resumo.concluidos}</strong>
          <small>Entregas e retiradas finalizadas</small>
        </article>
        <article className="stat">
          <span>Vendas concluídas</span>
          <strong id="stat-vendas">{moeda(resumo.vendas)}</strong>
          <small>Valor bruto registrado</small>
        </article>
      </div>
      <div className="two-columns">
        <article className="panel">
          <div className="panel-heading">
            <h3>Sobre a Health Food</h3>
          </div>
          <p className="body-copy">
            Acreditamos que escolher uma refeição deve ser simples. Nosso propósito é dar
            visibilidade à comida saudável e ajudar cada pessoa a conhecer melhor o que está no
            prato.
          </p>
          <p className="body-copy">
            Como restaurante parceiro, você apresenta seu negócio, organiza seu cardápio e acompanha
            o atendimento. Informe ingredientes, alergênicos e cuidados no preparo com clareza.
          </p>
          <button className="text-button" onClick={() => navegar('produtos')} type="button">
            Montar meu cardápio →
          </button>
        </article>
        <article className="panel">
          <div className="panel-heading">
            <h3>Pedidos recentes</h3>
            <button className="text-button" onClick={() => navegar('pedidos')} type="button">
              Ver pedidos →
            </button>
          </div>
          <div id="recentes" className="recent-list">
            {pedidos.slice(0, 5).map((pedido) => (
              <div className="recent-item" key={pedido.id}>
                <div>
                  <strong>
                    #{pedido.numero} • {pedido.cliente}
                  </strong>
                  <small>
                    {moeda(pedido.total)} • {pedido.modalidade}
                  </small>
                </div>
                <Tag texto={pedido.status} />
              </div>
            ))}
            {!pedidos.length && <p className="empty">Seus pedidos recentes aparecerão aqui.</p>}
          </div>
        </article>
      </div>
    </Pagina>
  )
}

function Restaurante({ ativa, restaurante, salvar, avisar }) {
  const uf = useRef(null)

  function enviar(evento) {
    evento.preventDefault()
    const dados = campos(evento.currentTarget)
    if (dados.cnpj && dados.cnpj.replace(/\D/g, '').length !== 14) {
      avisar('Informe o CNPJ com 14 dígitos ou deixe o campo vazio.')
      return
    }
    dados.uf = dados.uf.toUpperCase()
    if (salvar({ restaurante: dados })) {
      uf.current.value = dados.uf
      avisar('Dados do seu restaurante salvos!')
    }
  }

  return (
    <Pagina ativa={ativa} id="restaurante">
      <div className="section-title">
        <div>
          <h2>Meu restaurante parceiro</h2>
          <p>Cadastre e atualize os dados do seu próprio estabelecimento.</p>
        </div>
      </div>
      <div className="panel form-panel">
        <div className="panel-heading">
          <h3>Dados do restaurante</h3>
        </div>
        <form id="restaurante-form" onSubmit={enviar}>
          <div className="form-grid">
            <label>
              Nome do restaurante{' '}
              <input
                name="nome"
                defaultValue={restaurante?.nome}
                maxLength="100"
                required
                placeholder="Como seu restaurante é conhecido"
              />
            </label>
            <label>
              Razão social{' '}
              <input
                name="razao"
                defaultValue={restaurante?.razao}
                maxLength="120"
                placeholder="Nome empresarial"
              />
            </label>
            <label>
              CNPJ (opcional){' '}
              <input
                name="cnpj"
                defaultValue={restaurante?.cnpj}
                maxLength="18"
                inputMode="numeric"
                placeholder="00.000.000/0000-00"
              />
            </label>
            <label>
              Responsável{' '}
              <input
                name="responsavel"
                defaultValue={restaurante?.responsavel}
                maxLength="100"
                required
              />
            </label>
            <label>
              Telefone / WhatsApp{' '}
              <input name="telefone" defaultValue={restaurante?.telefone} maxLength="30" required />
            </label>
            <label>
              E-mail comercial{' '}
              <input
                name="email"
                defaultValue={restaurante?.email}
                type="email"
                maxLength="140"
                required
              />
            </label>
            <label>
              Cidade{' '}
              <input name="cidade" defaultValue={restaurante?.cidade} maxLength="100" required />
            </label>
            <label>
              UF{' '}
              <input
                ref={uf}
                name="uf"
                defaultValue={restaurante?.uf}
                maxLength="2"
                minLength="2"
                pattern="[A-Za-z]{2}"
                required
                placeholder="SP"
              />
            </label>
            <label className="wide">
              Endereço completo{' '}
              <input
                name="endereco"
                defaultValue={restaurante?.endereco}
                maxLength="250"
                required
                placeholder="Rua, número, bairro e complemento"
              />
            </label>
            <label>
              Funcionamento{' '}
              <input
                name="horario"
                defaultValue={restaurante?.horario}
                maxLength="150"
                required
                placeholder="Segunda a sábado, das 11h às 22h"
              />
            </label>
            <label>
              Atendimento{' '}
              <select name="atendimento" defaultValue={restaurante?.atendimento}>
                <option>Aberto para pedidos</option>
                <option>Temporariamente fechado</option>
              </select>
            </label>
            <label>
              Modalidades oferecidas{' '}
              <select name="modalidade" defaultValue={restaurante?.modalidade}>
                <option>Entrega e retirada</option>
                <option>Somente entrega</option>
                <option>Somente retirada</option>
              </select>
            </label>
            <label>
              Região de entrega{' '}
              <input
                name="regiao"
                defaultValue={restaurante?.regiao}
                maxLength="200"
                placeholder="Bairros atendidos ou apenas retirada"
              />
            </label>
            <label className="wide">
              Sobre o restaurante{' '}
              <textarea
                name="descricao"
                defaultValue={restaurante?.descricao}
                maxLength="1000"
                rows="3"
                placeholder="Conte sobre sua cozinha e sua proposta de alimentação"
              ></textarea>
            </label>
          </div>
          <div className="form-actions">
            <button className="primary-button" type="submit">
              Salvar meu restaurante
            </button>
          </div>
        </form>
        <p className="helper">
          Este cadastro organiza seu perfil no protótipo; não representa aprovação de parceria pela
          Health Food.
        </p>
      </div>
    </Pagina>
  )
}

function detalharProduto(produto) {
  window.alert(
    [
      produto.nome,
      produto.descricao,
      `Preço: ${moeda(produto.preco)}`,
      `Porção: ${produto.porcao}`,
      `Ingredientes: ${produto.ingredientes}`,
      `Alergênicos e contato cruzado: ${produto.alergenicos}`,
      `Característica declarada: ${produto.perfil}`,
      `Preparo: ${produto.tempo} minutos`,
      `Informação nutricional: ${produto.nutricao || 'Não informada'}`,
    ].join('\n'),
  )
}

function Cardapio({ ativa, produtos, salvar, avisar, exigirRestaurante }) {
  const [edicao, setEdicao] = useState(null)
  const [versaoFormulario, setVersaoFormulario] = useState(0)
  const [busca, setBusca] = useState('')
  const [filtro, setFiltro] = useState('')
  const painel = useRef(null)
  const termo = busca.trim().toLocaleLowerCase('pt-BR')
  const lista = produtos.filter(
    (produto) =>
      `${produto.nome} ${produto.ingredientes}`.toLocaleLowerCase('pt-BR').includes(termo) &&
      (!filtro || produto.disponibilidade === filtro),
  )

  function trocarEdicao(produto) {
    setEdicao(produto)
    setVersaoFormulario((versao) => versao + 1)
  }

  function enviar(evento) {
    evento.preventDefault()
    if (!exigirRestaurante()) return
    const produto = campos(evento.currentTarget)
    produto.preco = Number(produto.preco)
    produto.tempo = Number(produto.tempo)
    if (
      !produto.nome ||
      !produto.ingredientes ||
      !produto.alergenicos ||
      !Number.isFinite(produto.preco) ||
      produto.preco <= 0
    ) {
      avisar('Preencha as informações e informe um preço válido.')
      return
    }

    produto.id = edicao?.id || identificador()
    const atualizados = edicao
      ? produtos.map((item) => (item.id === produto.id ? produto : item))
      : [produto, ...produtos]
    if (salvar({ produtos: atualizados })) {
      trocarEdicao(null)
      avisar('Produto salvo no seu cardápio!')
    }
  }

  function editar(produto) {
    trocarEdicao(produto)
    painel.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  function excluir(produto) {
    if (
      !window.confirm(
        `Excluir "${produto.nome}" do cardápio? Os pedidos anteriores manterão seus itens.`,
      )
    )
      return
    if (salvar({ produtos: produtos.filter((item) => item.id !== produto.id) })) {
      if (edicao?.id === produto.id) trocarEdicao(null)
      avisar('Produto excluído do cardápio.')
    }
  }

  return (
    <Pagina ativa={ativa} id="produtos">
      <div className="section-title">
        <div>
          <h2>Meu cardápio</h2>
          <p>Cadastre as comidas e bebidas do seu restaurante.</p>
        </div>
      </div>
      <div className="panel form-panel" id="produto-area" ref={painel}>
        <div className="panel-heading">
          <h3 id="produto-titulo">
            {edicao ? 'Editar comida ou bebida' : 'Cadastrar comida ou bebida'}
          </h3>
        </div>
        <form id="produto-form" key={versaoFormulario} onSubmit={enviar}>
          <div className="form-grid">
            <label>
              Nome{' '}
              <input
                name="nome"
                defaultValue={edicao?.nome}
                maxLength="100"
                required
                placeholder="Ex.: Bowl de legumes com arroz integral"
              />
            </label>
            <label>
              Categoria{' '}
              <select name="categoria" defaultValue={edicao?.categoria}>
                <option>Refeição</option>
                <option>Lanche</option>
                <option>Bebida</option>
                <option>Sobremesa</option>
              </select>
            </label>
            <label>
              Preço em R${' '}
              <input
                name="preco"
                defaultValue={edicao?.preco}
                type="number"
                min="0.01"
                max="100000"
                step="0.01"
                required
              />
            </label>
            <label>
              Porção / volume{' '}
              <input
                name="porcao"
                defaultValue={edicao?.porcao}
                maxLength="80"
                required
                placeholder="Ex.: 400 g ou 300 ml"
              />
            </label>
            <label className="wide">
              Descrição{' '}
              <textarea
                name="descricao"
                defaultValue={edicao?.descricao}
                rows="2"
                maxLength="1000"
                required
                placeholder="Apresente o prato e os acompanhamentos"
              ></textarea>
            </label>
            <label className="wide">
              Ingredientes completos{' '}
              <textarea
                name="ingredientes"
                defaultValue={edicao?.ingredientes}
                rows="3"
                maxLength="1500"
                required
                placeholder="Inclua molhos, temperos e acompanhamentos"
              ></textarea>
            </label>
            <label className="wide">
              Alergênicos e contato cruzado{' '}
              <textarea
                name="alergenicos"
                defaultValue={edicao?.alergenicos}
                rows="2"
                maxLength="1000"
                required
                placeholder="Informe o que contém, pode conter e cuidados no preparo"
              ></textarea>
            </label>
            <label>
              Característica declarada{' '}
              <select name="perfil" defaultValue={edicao?.perfil}>
                <option>Não informado</option>
                <option>Vegetariano</option>
                <option>Vegano</option>
                <option>Sem ingredientes com glúten</option>
                <option>Sem ingredientes com lactose</option>
              </select>
            </label>
            <label>
              Tempo de preparo (minutos){' '}
              <input
                name="tempo"
                defaultValue={edicao?.tempo}
                type="number"
                min="1"
                max="1440"
                step="1"
                required
              />
            </label>
            <label>
              Disponibilidade{' '}
              <select name="disponibilidade" defaultValue={edicao?.disponibilidade}>
                <option>Disponível</option>
                <option>Indisponível</option>
              </select>
            </label>
            <label>
              Informação nutricional (opcional){' '}
              <input
                name="nutricao"
                defaultValue={edicao?.nutricao}
                maxLength="300"
                placeholder="Ex.: valores por porção, quando disponíveis"
              />
            </label>
          </div>
          <div className="form-actions">
            <button
              type="button"
              className="outline-button"
              id="cancelar-produto"
              onClick={() => trocarEdicao(null)}
            >
              Limpar / cancelar edição
            </button>
            <button type="submit" className="primary-button" id="salvar-produto">
              {edicao ? 'Salvar alterações' : 'Salvar produto'}
            </button>
          </div>
        </form>
        <p className="helper">
          As características são declaradas pelo restaurante. Para restrições alimentares, informe
          também possíveis contatos cruzados; o cadastro não certifica segurança para consumo.
        </p>
      </div>
      <div className="panel">
        <div className="panel-heading">
          <h3>Comidas e bebidas cadastradas</h3>
        </div>
        <div className="filters">
          <input
            id="busca-produto"
            value={busca}
            onChange={(evento) => setBusca(evento.target.value)}
            type="search"
            aria-label="Buscar no cardápio"
            placeholder="Buscar nome ou ingrediente..."
          />
          <select
            id="filtro-produto"
            value={filtro}
            onChange={(evento) => setFiltro(evento.target.value)}
            aria-label="Filtrar disponibilidade"
          >
            <option value="">Todas as disponibilidades</option>
            <option>Disponível</option>
            <option>Indisponível</option>
          </select>
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Produto</th>
                <th>Preço</th>
                <th>Categoria</th>
                <th>Disponibilidade</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody id="produtos-tabela">
              {lista.map((produto) => (
                <tr key={produto.id}>
                  <td>
                    <strong className="cell-title">{produto.nome}</strong>
                    <small className="cell-sub">{produto.porcao}</small>
                  </td>
                  <td>{moeda(produto.preco)}</td>
                  <td>{produto.categoria}</td>
                  <td>
                    <Tag texto={produto.disponibilidade} />
                  </td>
                  <td>
                    <button className="row-button" onClick={() => detalharProduto(produto)}>
                      Detalhes
                    </button>{' '}
                    <button className="row-button" onClick={() => editar(produto)}>
                      Editar
                    </button>{' '}
                    <button className="row-button delete" onClick={() => excluir(produto)}>
                      Excluir
                    </button>
                  </td>
                </tr>
              ))}
              {!lista.length && (
                <tr>
                  <td colSpan={5} className="empty">
                    Nenhum produto encontrado. Cadastre sua primeira comida ou bebida.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Pagina>
  )
}

function novaLinha() {
  return { id: identificador(), produtoId: '', quantidade: '1' }
}

function Pedidos({ ativa, restaurante, produtos, pedidos, salvar, avisar, exigirRestaurante }) {
  const [modalidade, setModalidade] = useState('Entrega')
  const [linhas, setLinhas] = useState(() => [novaLinha()])
  const [busca, setBusca] = useState('')
  const [filtro, setFiltro] = useState('')
  const [selecionadoId, setSelecionadoId] = useState(null)
  const painelCaminho = useRef(null)
  const selecionado = pedidos.find((pedido) => pedido.id === selecionadoId)
  const disponiveis = produtos.filter((produto) => produto.disponibilidade === 'Disponível')
  const disponiveisPorId = new Map(disponiveis.map((produto) => [produto.id, produto]))
  const termo = busca.trim().toLocaleLowerCase('pt-BR')
  const lista = pedidos.filter(
    (pedido) =>
      `${pedido.cliente} #${pedido.numero}`.toLocaleLowerCase('pt-BR').includes(termo) &&
      (!filtro || pedido.status === filtro),
  )

  const itens = linhas.map((linha) => {
    const produto = disponiveisPorId.get(linha.produtoId)
    if (!produto) return null
    return {
      produtoId: produto.id,
      nome: produto.nome,
      preco: produto.preco,
      quantidade: Number(linha.quantidade),
    }
  })

  // Descarta seleções de produtos removidos ou indisponíveis.
  useEffect(() => {
    const ids = new Set(
      produtos
        .filter((produto) => produto.disponibilidade === 'Disponível')
        .map((produto) => produto.id),
    )
    setLinhas((atuais) => {
      if (!atuais.some((linha) => linha.produtoId && !ids.has(linha.produtoId))) return atuais
      return atuais.map((linha) => (ids.has(linha.produtoId) ? linha : { ...linha, produtoId: '' }))
    })
  }, [produtos])

  function adicionarLinha() {
    setLinhas([...linhas, novaLinha()])
  }

  function editarLinha(id, alteracoes) {
    setLinhas(linhas.map((linha) => (linha.id === id ? { ...linha, ...alteracoes } : linha)))
  }

  function removerLinha(id) {
    if (linhas.length === 1) {
      avisar('Mantenha pelo menos um item no pedido.')
      return
    }
    setLinhas(linhas.filter((linha) => linha.id !== id))
  }

  function enviar(evento) {
    evento.preventDefault()
    if (!exigirRestaurante()) return
    if (restaurante.atendimento !== 'Aberto para pedidos') {
      avisar(
        'Seu restaurante está fechado para novos pedidos. Atualize o atendimento em Meu restaurante.',
      )
      return
    }

    const formulario = evento.currentTarget
    const dados = campos(formulario)
    if (
      (modalidade === 'Entrega' && restaurante.modalidade === 'Somente retirada') ||
      (modalidade === 'Retirada' && restaurante.modalidade === 'Somente entrega')
    ) {
      avisar('Essa modalidade não é oferecida pelo seu restaurante.')
      return
    }
    if (
      !dados.cliente ||
      !dados.telefone ||
      (modalidade === 'Entrega' && !dados.endereco) ||
      itens.some(
        (item) =>
          !item ||
          !Number.isInteger(item.quantidade) ||
          item.quantidade < 1 ||
          item.quantidade > 999,
      )
    ) {
      avisar(
        'Informe os dados do cliente e selecione produtos disponíveis com quantidades válidas.',
      )
      return
    }

    const agora = new Date().toISOString()
    // Guarda os nomes e preços do momento do pedido para preservar o histórico.
    const pedido = {
      ...dados,
      id: identificador(),
      numero: pedidos.reduce((maior, atual) => Math.max(maior, Number(atual.numero) || 0), 0) + 1,
      itens,
      total: totalDosItens(itens),
      status: 'Recebido',
      criadoEm: agora,
      historico: [{ status: 'Recebido', data: agora }],
    }
    if (salvar({ pedidos: [pedido, ...pedidos] })) {
      formulario.reset()
      setLinhas([novaLinha()])
      setModalidade('Entrega')
      setSelecionadoId(pedido.id)
      avisar(`Pedido #${pedido.numero} registrado!`)
    }
  }

  function mudarEtapa(pedido, status) {
    const atualizado = {
      ...pedido,
      status,
      historico: [...pedido.historico, { status, data: new Date().toISOString() }],
    }
    if (
      salvar({ pedidos: pedidos.map((atual) => (atual.id === pedido.id ? atualizado : atual)) })
    ) {
      avisar(`Pedido #${pedido.numero}: ${status}.`)
    }
  }

  function cancelar(pedido) {
    if (window.confirm(`Cancelar o pedido #${pedido.numero}?`)) mudarEtapa(pedido, 'Cancelado')
  }

  function verCaminho(id) {
    setSelecionadoId(id)
    requestAnimationFrame(() =>
      painelCaminho.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
    )
  }

  return (
    <Pagina ativa={ativa} id="pedidos">
      <div className="section-title">
        <div>
          <h2>Meus pedidos</h2>
          <p>Registre pedidos do seu restaurante e acompanhe cada etapa.</p>
        </div>
      </div>
      <div className="panel">
        <div className="panel-heading">
          <h3>Registrar pedido</h3>
        </div>
        <form id="pedido-form" onSubmit={enviar}>
          <div className="form-grid">
            <label>
              Cliente <input name="cliente" maxLength="100" required />
            </label>
            <label>
              Telefone <input name="telefone" maxLength="30" required />
            </label>
            <label>
              Modalidade{' '}
              <select
                name="modalidade"
                id="pedido-modalidade"
                value={modalidade}
                onChange={(evento) => setModalidade(evento.target.value)}
              >
                <option>Entrega</option>
                <option>Retirada</option>
              </select>
            </label>
            <label>
              Endereço de entrega{' '}
              <input
                name="endereco"
                id="pedido-endereco"
                maxLength="250"
                required={modalidade === 'Entrega'}
                disabled={modalidade !== 'Entrega'}
              />
            </label>
            <label className="wide">
              Observações do cliente{' '}
              <textarea
                name="observacoes"
                rows="2"
                maxLength="1000"
                placeholder="Preferências e informações para o atendimento"
              ></textarea>
            </label>
          </div>
          <div className="panel-heading item-heading">
            <h3>Itens do pedido</h3>
            <button
              className="outline-button"
              type="button"
              id="adicionar-item"
              onClick={adicionarLinha}
            >
              + Adicionar item
            </button>
          </div>
          <div id="itens-pedido">
            {linhas.map((linha) => (
              <div className="order-item" key={linha.id}>
                <label>
                  Produto
                  <select
                    className="item-produto"
                    required
                    value={disponiveisPorId.has(linha.produtoId) ? linha.produtoId : ''}
                    onChange={(evento) => editarLinha(linha.id, { produtoId: evento.target.value })}
                  >
                    <option value="">Selecione uma comida ou bebida</option>
                    {disponiveis.map((produto) => (
                      <option key={produto.id} value={produto.id}>
                        {produto.nome} — {moeda(produto.preco)}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Quantidade
                  <input
                    className="item-quantidade"
                    type="number"
                    min="1"
                    max="999"
                    step="1"
                    required
                    value={linha.quantidade}
                    onChange={(evento) =>
                      editarLinha(linha.id, { quantidade: evento.target.value })
                    }
                  />
                </label>
                <button
                  type="button"
                  className="row-button delete"
                  onClick={() => removerLinha(linha.id)}
                >
                  Remover
                </button>
              </div>
            ))}
          </div>
          <p className="order-total">
            Total: <strong id="pedido-total">{moeda(totalDosItens(itens))}</strong>
          </p>
          <div className="form-actions">
            <button className="primary-button" type="submit">
              Registrar pedido recebido
            </button>
          </div>
        </form>
        <p className="helper">
          Registro manual de demonstração. Os pedidos não são recebidos de outro site nem enviados a
          um serviço de entrega.
        </p>
      </div>
      <div className="panel">
        <div className="panel-heading">
          <h3>Acompanhar pedidos</h3>
        </div>
        <div className="filters">
          <input
            id="busca-pedido"
            value={busca}
            onChange={(evento) => setBusca(evento.target.value)}
            type="search"
            aria-label="Buscar pedido"
            placeholder="Buscar cliente ou número..."
          />
          <select
            id="filtro-pedido"
            value={filtro}
            onChange={(evento) => setFiltro(evento.target.value)}
            aria-label="Filtrar etapa"
          >
            <option value="">Todas as etapas</option>
            <option>Recebido</option>
            <option>Em preparo</option>
            <option>Pronto</option>
            <option>Saiu para entrega</option>
            <option>Concluído</option>
            <option>Cancelado</option>
          </select>
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Pedido</th>
                <th>Cliente</th>
                <th>Total</th>
                <th>Modalidade</th>
                <th>Etapa</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody id="pedidos-tabela">
              {lista.map((pedido) => {
                const proxima = proximaEtapa(pedido)
                return (
                  <tr key={pedido.id}>
                    <td>#{pedido.numero}</td>
                    <td>{pedido.cliente}</td>
                    <td>{moeda(pedido.total)}</td>
                    <td>{pedido.modalidade}</td>
                    <td>
                      <Tag texto={pedido.status} />
                    </td>
                    <td>
                      <button className="row-button" onClick={() => verCaminho(pedido.id)}>
                        Ver caminho
                      </button>{' '}
                      {proxima && (
                        <>
                          <button
                            className="row-button"
                            onClick={() => mudarEtapa(pedido, proxima)}
                          >
                            {proxima}
                          </button>{' '}
                          <button className="row-button delete" onClick={() => cancelar(pedido)}>
                            Cancelar
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                )
              })}
              {!lista.length && (
                <tr>
                  <td colSpan={6} className="empty">
                    Nenhum pedido encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <div
        className="panel"
        id="caminho-pedido"
        ref={painelCaminho}
        hidden={!selecionado}
        aria-live="polite"
      >
        {selecionado && <CaminhoPedido pedido={selecionado} />}
      </div>
    </Pagina>
  )
}

function CaminhoPedido({ pedido }) {
  const fluxo = etapas(pedido)
  if (pedido.status === 'Cancelado') fluxo.push('Cancelado')
  const detalhes = [
    `${pedido.cliente} • ${pedido.telefone}`,
    `${pedido.modalidade}: ${pedido.endereco || 'Retirada no restaurante'}`,
    ...pedido.itens.map((item) => `${item.quantidade} × ${item.nome} (${moeda(item.preco)} cada)`),
    `Total: ${moeda(pedido.total)}`,
    `Observações: ${pedido.observacoes || 'Nenhuma'}`,
  ].join('\n')

  return (
    <>
      <div className="panel-heading">
        <h3>Caminho do pedido #{pedido.numero}</h3>
        <Tag texto={pedido.status} />
      </div>
      <p className="details-copy">{detalhes}</p>
      <ol className="order-steps">
        {fluxo.map((etapa) => {
          const marco = pedido.historico.find((item) => item.status === etapa)
          const classes = [marco && 'done', pedido.status === etapa && 'current'].filter(Boolean)
          const descricao = marco
            ? new Date(marco.data).toLocaleString('pt-BR')
            : pedido.status === 'Cancelado'
              ? 'Não realizada'
              : 'Aguardando'
          return (
            <li className={classes.join(' ')} key={etapa}>
              {etapa} — {descricao}
            </li>
          )
        })}
      </ol>
    </>
  )
}

function Resultados({ ativa, pedidos, resumo, avisar }) {
  const contagem = [...etapasEntrega, 'Cancelado'].map((status) => [
    status,
    pedidos.filter((pedido) => pedido.status === status).length,
  ])
  const maior = Math.max(1, ...contagem.map(([, quantidade]) => quantidade))

  function exportar() {
    exportarPedidos(pedidos)
    avisar('Relatório dos seus pedidos exportado.')
  }

  return (
    <Pagina ativa={ativa} id="relatorios">
      <div className="section-title">
        <div>
          <h2>Meus resultados</h2>
          <p>Resumo dos pedidos registrados pelo seu restaurante.</p>
        </div>
        <button className="outline-button" id="exportar-pedidos" onClick={exportar} type="button">
          Exportar pedidos CSV
        </button>
      </div>
      <div className="stats">
        <article className="stat">
          <span>Pedidos registrados</span>
          <strong id="report-total">{pedidos.length}</strong>
        </article>
        <article className="stat">
          <span>Concluídos</span>
          <strong id="report-concluidos">{resumo.concluidos}</strong>
        </article>
        <article className="stat">
          <span>Cancelados</span>
          <strong id="report-cancelados">{resumo.cancelados}</strong>
        </article>
        <article className="stat">
          <span>Ticket médio concluído</span>
          <strong id="report-ticket">
            {moeda(resumo.concluidos ? resumo.vendas / resumo.concluidos : 0)}
          </strong>
        </article>
      </div>
      <div className="panel">
        <div className="panel-heading">
          <h3>Pedidos por etapa</h3>
        </div>
        <div id="categorias-grafico" className="category-chart">
          {contagem.map(([status, quantidade]) => (
            <div className="category-item" key={status}>
              <div className="category-top">
                <span>{status}</span>
                <strong>{quantidade}</strong>
              </div>
              <div className="category-track">
                <div
                  className="category-fill"
                  style={{ width: `${(quantidade / maior) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </Pagina>
  )
}
