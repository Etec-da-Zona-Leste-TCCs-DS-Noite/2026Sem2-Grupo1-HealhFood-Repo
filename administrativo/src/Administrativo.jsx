import { useRef, useState } from 'react'
import {
  carregarDados,
  dataAtual,
  exportarFinanceiro,
  moeda,
  salvarDados,
  totaisFinanceiros,
} from './dados.js'

const navegacao = [
  { id: 'dashboard', icone: '▦', titulo: 'Visão geral' },
  { id: 'restaurantes', icone: '▣', titulo: 'Restaurantes parceiros' },
  { id: 'pedidos', icone: '▥', titulo: 'Pedidos' },
  { id: 'financeiro', icone: '◉', titulo: 'Gestão financeira' },
]

const secoes = {
  restaurantes: {
    titulo: 'Restaurantes parceiros',
    descricao: 'Administre os estabelecimentos parceiros.',
    formulario: 'Adicionar restaurante',
    botao: '+ Salvar restaurante',
    tabela: 'Rede de parceiros',
    campos: [
      { nome: 'nome', coluna: 'Restaurante', rotulo: 'Nome do restaurante' },
      { nome: 'cidade', coluna: 'Cidade' },
      { nome: 'contato', coluna: 'Contato', rotulo: 'Telefone / WhatsApp' },
      { nome: 'status', coluna: 'Status', opcoes: ['Ativo', 'Em análise', 'Inativo'] },
    ],
  },
  pedidos: {
    titulo: 'Gestão de pedidos',
    descricao: 'Acompanhe os pedidos registrados na demonstração.',
    formulario: 'Registrar pedido',
    botao: '+ Salvar pedido',
    tabela: 'Pedidos registrados',
    campos: [
      { nome: 'cliente', coluna: 'Cliente', rotulo: 'Nome do cliente' },
      { nome: 'restaurante', coluna: 'Restaurante' },
      { nome: 'valor', coluna: 'Valor', rotulo: 'Valor do pedido em R$', tipo: 'number', min: 0 },
      { nome: 'status', coluna: 'Status', opcoes: ['Pendente', 'Em preparo', 'Concluído', 'Cancelado'] },
    ],
  },
  financeiro: {
    titulo: 'Gestão financeira',
    descricao: 'Registre receitas e despesas e acompanhe o resultado financeiro.',
    formulario: 'Adicionar receita ou despesa',
    botao: '+ Registrar movimentação',
    tabela: 'Histórico financeiro',
    campos: [
      { nome: 'descricao', coluna: 'Descrição', rotulo: 'Descrição da movimentação' },
      { nome: 'valor', coluna: 'Valor', rotulo: 'Valor em R$', tipo: 'number', min: 0.01 },
      { nome: 'tipo', coluna: 'Tipo', opcoes: ['Receita', 'Despesa'] },
      { nome: 'data', coluna: 'Data', tipo: 'date' },
    ],
    colunas: ['descricao', 'tipo', 'valor', 'data'],
  },
}

export default function Administrativo() {
  const [dados, setDados] = useState(carregarDados)
  const [pagina, setPagina] = useState('dashboard')
  const totais = totaisFinanceiros(dados.financeiro)

  function navegar(destino) {
    setPagina(destino)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function salvar(tipo, registros) {
    const atualizado = { ...dados, [tipo]: registros }
    try {
      salvarDados(atualizado)
    } catch (erro) {
      console.error('Erro ao salvar:', erro)
      window.alert('Não foi possível salvar os dados neste navegador.')
      return false
    }
    setDados(atualizado)
    return true
  }

  return (
    <>
      <aside className="sidebar">
        <div className="logo">
          <img src={`${import.meta.env.BASE_URL}logo-healthfood.png`} alt="Logomarca Health Food" />
          <p>Painel Administrativo</p>
        </div>
        <nav className="menu" aria-label="Menu administrativo">
          {navegacao.map(({ id, icone, titulo }) => (
            <button
              className={pagina === id ? 'menu-btn ativo' : 'menu-btn'}
              aria-current={pagina === id ? 'page' : undefined}
              onClick={() => navegar(id)}
              type="button"
              key={id}
            >
              <span aria-hidden="true">{icone}</span> {titulo}
            </button>
          ))}
        </nav>
        <div className="usuario">
          <div className="avatar">HF</div>
          <div>
            <strong>Equipe Health Food</strong>
            <small>Administradores</small>
          </div>
        </div>
      </aside>

      <main className="conteudo">
        <header className="cabecalho">
          <div>
            <h1 id="titulo-pagina">{navegacao.find((item) => item.id === pagina).titulo}</h1>
            <p>Gerencie o Health Food em um só lugar.</p>
          </div>
          <span className="selo">● Protótipo administrativo</span>
        </header>

        <Pagina id="dashboard" ativa={pagina === 'dashboard'}>
          <VisaoGeral dados={dados} totais={totais} />
        </Pagina>

        {Object.entries(secoes).map(([tipo, secao]) => (
          <Pagina id={tipo} ativa={pagina === tipo} key={tipo}>
            <SecaoRegistros
              tipo={tipo}
              secao={secao}
              registros={dados[tipo]}
              salvar={(registros) => salvar(tipo, registros)}
            >
              {tipo === 'financeiro' && <IndicadoresFinanceiros totais={totais} />}
            </SecaoRegistros>
          </Pagina>
        ))}
        <footer>Health Food © 2026 • Sistema administrativo • Protótipo acadêmico</footer>
      </main>
    </>
  )
}

function Pagina({ id, ativa, children }) {
  return (
    <section className={ativa ? 'pagina ativa' : 'pagina'} id={id}>
      {children}
    </section>
  )
}

function Indicador({ titulo, valor, id, detalhe, cor }) {
  return (
    <article className="indicador">
      <p>{titulo}</p>
      <h2 id={id} style={cor ? { color: cor } : undefined}>
        {valor}
      </h2>
      {detalhe && <small>{detalhe}</small>}
    </article>
  )
}

function corDoSaldo(saldo) {
  return saldo < 0 ? 'var(--vermelho)' : 'var(--verde)'
}

function VisaoGeral({ dados, totais }) {
  const { receitas, despesas, saldo } = totais
  const total = receitas + despesas
  const largura = (valor) => ({ width: `${total > 0 ? (valor / total) * 100 : 0}%` })
  const ativos = dados.restaurantes.filter((item) => item.status === 'Ativo').length
  const pendentes = dados.pedidos.filter((item) => item.status === 'Pendente').length

  return (
    <>
      <div className="boas-vindas">
        <span>HEALTH FOOD • GESTÃO EMPRESARIAL</span>
        <h2>Bem-vindo ao painel administrativo!</h2>
        <p>Controle seus parceiros, pedidos e resultados financeiros.</p>
      </div>
      <div className="indicadores">
        <Indicador
          id="total-restaurantes"
          titulo="Restaurantes"
          valor={dados.restaurantes.length}
          detalhe="Parceiros cadastrados"
        />
        <Indicador
          id="total-receitas"
          titulo="Receitas"
          valor={moeda(receitas)}
          detalhe="Entradas registradas"
        />
        <Indicador
          id="total-despesas"
          titulo="Despesas"
          valor={moeda(despesas)}
          detalhe="Saídas registradas"
        />
      </div>
      <div className="duas-colunas">
        <article className="cartao">
          <h3>Resumo financeiro</h3>
          <p className="texto-suave">Resultado das movimentações cadastradas</p>
          <h2 className="saldo" id="saldo-geral" style={{ color: corDoSaldo(saldo) }}>
            {moeda(saldo)}
          </h2>
          <div className="barra-financeira" aria-hidden="true">
            <div id="barra-receitas" style={largura(receitas)} />
            <div id="barra-despesas" style={largura(despesas)} />
          </div>
          <p className="legenda">🟢 Receitas &nbsp;&nbsp; 🟠 Despesas</p>
        </article>
        <article className="cartao">
          <h3>Resumo operacional</h3>
          <div className="linha-resumo">
            <span>Pedidos registrados</span>
            <strong id="total-pedidos">{dados.pedidos.length}</strong>
          </div>
          <div className="linha-resumo">
            <span>Restaurantes ativos</span>
            <strong id="restaurantes-ativos">{ativos}</strong>
          </div>
          <div className="linha-resumo">
            <span>Pedidos pendentes</span>
            <strong id="pedidos-pendentes">{pendentes}</strong>
          </div>
        </article>
      </div>
    </>
  )
}

function IndicadoresFinanceiros({ totais }) {
  const { receitas, despesas, saldo } = totais
  return (
    <div className="indicadores indicadores-financeiros">
      <Indicador id="financeiro-receitas" titulo="Receitas" valor={moeda(receitas)} />
      <Indicador id="financeiro-despesas" titulo="Despesas" valor={moeda(despesas)} />
      <Indicador id="financeiro-saldo" titulo="Resultado" valor={moeda(saldo)} cor={corDoSaldo(saldo)} />
    </div>
  )
}

function SecaoRegistros({ tipo, secao, registros, salvar, children }) {
  const [edicao, setEdicao] = useState(null)
  const [versaoFormulario, setVersaoFormulario] = useState(0)
  const cartao = useRef(null)
  const colunas = secao.colunas
    ? secao.colunas.map((nome) => secao.campos.find((campo) => campo.nome === nome))
    : secao.campos

  function atualizarFormulario(registro) {
    setEdicao(registro)
    setVersaoFormulario((versao) => versao + 1)
  }

  function enviar(evento) {
    evento.preventDefault()
    const valores = Object.fromEntries(new FormData(evento.currentTarget))
    if ('valor' in valores) valores.valor = Number(valores.valor)

    const novosRegistros = edicao
      ? registros.map((registro) => (registro.id === edicao.id ? { ...registro, ...valores } : registro))
      : [
          ...registros,
          { id: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`, ...valores },
        ]

    if (salvar(novosRegistros)) {
      atualizarFormulario(null)
      window.alert('Registro salvo com sucesso!')
    }
  }

  function editar(registro) {
    atualizarFormulario(registro)
    cartao.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  function excluir(registro) {
    if (!window.confirm('Deseja realmente excluir este registro?')) return
    if (salvar(registros.filter((item) => item.id !== registro.id)) && edicao?.id === registro.id) {
      atualizarFormulario(null)
    }
  }

  return (
    <>
      <div className="titulo-secao">
        <h2>{secao.titulo}</h2>
        <p>{secao.descricao}</p>
      </div>
      {children}
      <article className="cartao" ref={cartao}>
        <h3>{secao.formulario}</h3>
        <form id={`form-${tipo}`} className="formulario" key={versaoFormulario} onSubmit={enviar}>
          {secao.campos.map((campo) => (
            <Campo key={campo.nome} campo={campo} valor={edicao?.[campo.nome]} />
          ))}
          <button type="submit" className="botao-verde">
            {edicao ? 'Salvar alterações' : secao.botao}
          </button>
        </form>
      </article>

      <article className="cartao">
        {tipo === 'financeiro' ? (
          <div className="titulo-tabela">
            <h3>{secao.tabela}</h3>
            <button
              type="button"
              className="botao-claro"
              id="exportar"
              onClick={() => exportarFinanceiro(registros)}
            >
              Exportar CSV
            </button>
          </div>
        ) : (
          <h3>{secao.tabela}</h3>
        )}
        <Tabela id={tipo} colunas={colunas} registros={registros} editar={editar} excluir={excluir} />
      </article>
    </>
  )
}

function Campo({ campo, valor }) {
  const { nome, coluna, rotulo = coluna, tipo = 'text', min, opcoes } = campo
  if (opcoes) {
    return (
      <select name={nome} aria-label={rotulo} defaultValue={valor ?? opcoes[0]}>
        {opcoes.map((opcao) => (
          <option key={opcao}>{opcao}</option>
        ))}
      </select>
    )
  }
  return (
    <input
      name={nome}
      type={tipo}
      min={min}
      step={tipo === 'number' ? '0.01' : undefined}
      aria-label={rotulo}
      placeholder={tipo === 'date' ? undefined : rotulo}
      defaultValue={valor ?? (tipo === 'date' ? dataAtual() : '')}
      required
    />
  )
}

function Tabela({ id, colunas, registros, editar, excluir }) {
  return (
    <div className="tabela-rolagem">
      <table>
        <thead>
          <tr>
            {colunas.map(({ nome, coluna }) => (
              <th key={nome} scope="col">
                {coluna}
              </th>
            ))}
            <th scope="col">Ações</th>
          </tr>
        </thead>
        <tbody id={`lista-${id}`}>
          {!registros.length && (
            <tr>
              <td colSpan={colunas.length + 1}>Nenhum registro cadastrado até o momento.</td>
            </tr>
          )}
          {registros.map((registro) => (
            <tr key={registro.id}>
              {colunas.map(({ nome }) => (
                <td key={nome}>
                  <Celula campo={nome} valor={registro[nome]} />
                </td>
              ))}
              <td>
                <button type="button" className="botao-acao" onClick={() => editar(registro)}>
                  Editar
                </button>
                <button type="button" className="botao-acao excluir" onClick={() => excluir(registro)}>
                  Excluir
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function Celula({ campo, valor }) {
  if (campo === 'valor') return moeda(valor)
  if (campo !== 'status' && campo !== 'tipo') return valor
  const negativos = ['Inativo', 'Cancelado', 'Despesa']
  const pendentes = ['Pendente', 'Em preparo', 'Em análise']
  const cor = negativos.includes(valor) ? ' perigo' : pendentes.includes(valor) ? ' atencao' : ''
  return <span className={`etiqueta${cor}`}>{valor}</span>
}
