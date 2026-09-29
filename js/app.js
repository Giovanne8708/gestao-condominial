/* ==========================================================
   SISTEMA DE GESTÃO DE MANUTENÇÃO
   APP.JS
   Versão revisada
   ========================================================== */

"use strict";

/* ==========================================================
   AVISOS NA TELA
   Substitui as caixas de alerta do navegador por avisos
   discretos que somem sozinhos.
   ========================================================== */

function mostrarAviso(mensagem, tipo) {

    let area = document.getElementById("area-avisos");

    if (!area) {
        area = document.createElement("div");
        area.id = "area-avisos";
        area.setAttribute("role", "status");
        area.setAttribute("aria-live", "polite");
        document.body.appendChild(area);
    }

    const texto = String(mensagem ?? "").trim();

    if (!tipo) {
        tipo = /sucesso|salv|criad|enviad|finalizad|atualizad/i.test(texto)
            ? "sucesso"
            : "atencao";
    }

    const aviso = document.createElement("div");
    aviso.className = "aviso aviso-" + tipo;

    const conteudo = document.createElement("p");
    conteudo.textContent = texto;

    const fechar = document.createElement("button");
    fechar.type = "button";
    fechar.setAttribute("aria-label", "Fechar aviso");
    fechar.textContent = "\u00d7";

    const remover = () => aviso.remove();

    fechar.addEventListener("click", remover);

    aviso.appendChild(conteudo);
    aviso.appendChild(fechar);
    area.appendChild(aviso);

    setTimeout(remover, tipo === "sucesso" ? 4500 : 7000);
}

window.alert = function (mensagem) {
    mostrarAviso(mensagem);
};



/* ==========================================================
   01. CONFIGURAÇÕES GERAIS
   ========================================================== */

const STORAGE_DADOS = "mp_data";
const STORAGE_SESSAO = "mp_session";

const SENHA_DEMO = "123";

const USUARIOS_DEMO = {
    "admin@empresa.com": {
        role: "admin",
        nome: "Administrativo"
    },

    "tecnico@empresa.com": {
        role: "tecnico",
        nome: "João Silva"
    },

    "sindico@condominio.com": {
        role: "sindico",
        nome: "João Siqueira"
    }
};

const TÉCNICO_LOGADO = "João Silva";


/* ==========================================================
   02. INICIALIZAÇÃO
   ========================================================== */

document.addEventListener("DOMContentLoaded", () => {

    inicializarBancoDados();

    configurarModuloLogin();
    configurarNavegacao();
    configurarMenuMobile();

    configurarModuloPortalSindico();
    configurarModuloChamadosAdmin();
    configurarModuloOSAdmin();
    configurarModuloOSTecnico();

    configurarTelaConfiguracoesWhiteLabel();

    configurarFechamentoModais();

    verificarSessaoAtiva();

});


/* ==========================================================
   03. FUNÇÕES UTILITÁRIAS
   ========================================================== */

function obterElemento(id) {
    return document.getElementById(id);
}


function definirTexto(id, valor) {
    const elemento = obterElemento(id);

    if (elemento) {
        elemento.textContent = valor ?? "";
    }
}


function escaparHTML(valor) {

    if (valor === null || valor === undefined) {
        return "";
    }

    return String(valor)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


function hojeISO() {

    const agora = new Date();

    const ano = agora.getFullYear();
    const mes = String(agora.getMonth() + 1).padStart(2, "0");
    const dia = String(agora.getDate()).padStart(2, "0");

    return `${ano}-${mes}-${dia}`;
}


function formatarData(data) {

    if (!data) {
        return "-";
    }

    if (String(data).includes("-")) {

        const partes = String(data).split("-");

        if (partes.length === 3) {
            return `${partes[2]}/${partes[1]}/${partes[0]}`;
        }
    }

    return data;
}


function gerarNovoId(lista, idInicial) {

    if (!Array.isArray(lista) || lista.length === 0) {
        return idInicial;
    }

    const ids = lista
        .map(item => Number(item.id))
        .filter(id => Number.isFinite(id));

    if (ids.length === 0) {
        return idInicial;
    }

    return Math.max(...ids) + 1;
}


function obterSessao() {

    try {

        const sessao = localStorage.getItem(STORAGE_SESSAO);

        if (!sessao) {
            return null;
        }

        return JSON.parse(sessao);

    } catch (erro) {

        console.error("Erro ao recuperar sessão:", erro);

        localStorage.removeItem(STORAGE_SESSAO);

        return null;
    }
}


/* ==========================================================
   04. BANCO LOCAL
   ========================================================== */

function criarDadosIniciais() {

    return {

        settings: {
            systemName: "Gestão de Manutenção",
            companyName: "Sua Empresa",
            primaryColor: "#2563eb",
            logoBase64: ""
        },

        chamados: [
            {
                id: 101,
                condominio: "Residencial Jardim das Palmeiras",
                local: "Bloco B - Elevador",
                categoria: "Elevadores",
                problema: "Porta travando no 3º andar",
                prioridade: "Alta",
                status: "Novo",
                data: new Date().toLocaleDateString("pt-BR"),
                dataISO: hojeISO(),
                laudoTecnico: "",
                materiaisUsados: ""
            }
        ],

        ordensServico: [],

        condominios: [
            {
                id: 1,
                nome: "Residencial Jardim das Palmeiras",
                endereco: "Av. Beira Rio, 1000",
                sindico: "João Siqueira",
                telefone: "",
                status: "Ativo"
            },

            {
                id: 2,
                nome: "Condomínio Solar",
                endereco: "Rua das Flores, 45",
                sindico: "Carlos Alberto",
                telefone: "",
                status: "Ativo"
            }
        ],

        equipamentos: [],
        materiais: [],
        preventivas: [],
        documentos: []
    };
}


function normalizarDados(dados) {

    if (!dados || typeof dados !== "object") {
        dados = {};
    }

    if (!dados.settings) {
        dados.settings = {};
    }

    dados.settings = {
        systemName:
            dados.settings.systemName ||
            "Gestão de Manutenção",

        companyName:
            dados.settings.companyName ||
            "Sua Empresa",

        primaryColor:
            dados.settings.primaryColor ||
            "#2563eb",

        logoBase64:
            dados.settings.logoBase64 ||
            ""
    };


    if (!Array.isArray(dados.chamados)) {
        dados.chamados = [];
    }

    if (!Array.isArray(dados.ordensServico)) {
        dados.ordensServico = [];
    }

    if (!Array.isArray(dados.condominios)) {
        dados.condominios = [];
    }

    if (!Array.isArray(dados.equipamentos)) {
        dados.equipamentos = [];
    }

    if (!Array.isArray(dados.materiais)) {
        dados.materiais = [];
    }

    if (!Array.isArray(dados.preventivas)) {
        dados.preventivas = [];
    }

    if (!Array.isArray(dados.documentos)) {
        dados.documentos = [];
    }


    dados.chamados.forEach(chamado => {

        if (!chamado.status) {
            chamado.status = "Novo";
        }

        if (!chamado.prioridade) {
            chamado.prioridade = "Normal";
        }

        if (!chamado.data) {
            chamado.data = new Date().toLocaleDateString("pt-BR");
        }

    });


    return dados;
}


function inicializarBancoDados() {

    const dadosSalvos = localStorage.getItem(STORAGE_DADOS);

    if (!dadosSalvos) {

        salvarDados(criarDadosIniciais());

        return;
    }

    try {

        const dados = JSON.parse(dadosSalvos);

        salvarDados(normalizarDados(dados));

    } catch (erro) {

        console.error("Banco local inválido. Recriando dados.", erro);

        salvarDados(criarDadosIniciais());
    }
}


function getDados() {

    try {

        const dados = localStorage.getItem(STORAGE_DADOS);

        if (!dados) {

            const novosDados = criarDadosIniciais();

            salvarDados(novosDados);

            return novosDados;
        }

        return normalizarDados(JSON.parse(dados));

    } catch (erro) {

        console.error("Erro ao acessar dados:", erro);

        const novosDados = criarDadosIniciais();

        salvarDados(novosDados);

        return novosDados;
    }
}


function salvarDados(dados) {

    const dadosNormalizados = normalizarDados(dados);

    localStorage.setItem(
        STORAGE_DADOS,
        JSON.stringify(dadosNormalizados)
    );
}


/* ==========================================================
   05. AUTENTICAÇÃO
   ========================================================== */

function configurarModuloLogin() {

    const formLogin = obterElemento("form-login");

    if (!formLogin) {
        return;
    }

    formLogin.addEventListener("submit", function(event) {

        event.preventDefault();

        const inputEmail = obterElemento("login-email");
        const inputSenha = obterElemento("login-senha");

        const email = inputEmail
            ? inputEmail.value.trim().toLowerCase()
            : "";

        const senha = inputSenha
            ? inputSenha.value
            : "";


        if (!email || !senha) {

            alert("Informe o e-mail e a senha.");

            return;
        }


        const usuario = USUARIOS_DEMO[email];


        if (!usuario || senha !== SENHA_DEMO) {

            alert(
                "Não foi possível acessar.\n\n" +
                "Verifique o e-mail e a senha."
            );

            return;
        }


        const sessao = {

            email: email,

            role: usuario.role,

            nome: usuario.nome,

            loginEm: new Date().toISOString()

        };


        localStorage.setItem(
            STORAGE_SESSAO,
            JSON.stringify(sessao)
        );


        formLogin.reset();

        verificarSessaoAtiva();

    });
}


function verificarSessaoAtiva() {

    const sessao = obterSessao();

    const loginWrapper = obterElemento("login-wrapper");
    const sidebar = obterElemento("sidebar");
    const mainApp = obterElemento("main-app");


    if (sessao) {

        if (loginWrapper) {
            loginWrapper.classList.add("hidden");
        }

        if (sidebar) {
            sidebar.classList.remove("hidden");
        }

        if (mainApp) {
            mainApp.classList.remove("hidden");
        }


        aplicarConfiguracoesVisuaisInternas();


        definirTexto(
            "header-user-name",
            sessao.nome
        );


        const avatar = obterElemento("header-user-avatar");

        if (avatar) {

            avatar.textContent =
                sessao.nome
                    ? sessao.nome.charAt(0).toUpperCase()
                    : "U";
        }


        aplicarRegraPerfilSessao(
            sessao.role,
            sessao.nome
        );

    } else {

        if (loginWrapper) {
            loginWrapper.classList.remove("hidden");
        }

        if (sidebar) {
            sidebar.classList.add("hidden");
        }

        if (mainApp) {
            mainApp.classList.add("hidden");
        }


        aplicarWhiteLabelNoLogin();
    }
}


window.realizarLogout = function() {

    localStorage.removeItem(STORAGE_SESSAO);

    const sidebar = obterElemento("sidebar");

    if (sidebar) {
        sidebar.classList.remove("open");
    }

    verificarSessaoAtiva();

};


/* ==========================================================
   06. CONTROLE DE PERFIL
   ========================================================== */

function aplicarRegraPerfilSessao(role, nome) {

    const menuAdmin = obterElemento("menu-admin");
    const menuSindico = obterElemento("menu-sindico");
    const menuTecnico = obterElemento("menu-tecnico");


    if (menuAdmin) {
        menuAdmin.classList.add("hidden");
    }

    if (menuSindico) {
        menuSindico.classList.add("hidden");
    }

    if (menuTecnico) {
        menuTecnico.classList.add("hidden");
    }


    if (role === "sindico") {

        if (menuSindico) {
            menuSindico.classList.remove("hidden");
        }

        definirTexto(
            "header-user-role",
            "Síndico / Cliente"
        );

        definirTexto(
            "sindico-welcome-text",
            `Olá, ${nome}.`
        );

        irParaTela("sindico-inicio");

        atualizarPortalSindico();

    }

    else if (role === "tecnico") {

        if (menuTecnico) {
            menuTecnico.classList.remove("hidden");
        }

        definirTexto(
            "header-user-role",
            "Técnico de Campo"
        );

        definirTexto(
            "tec-welcome-text",
            `Olá, ${nome}.`
        );

        irParaTela("tecnico-inicio");

        atualizarPortalTecnico(nome);

    }

    else {

        if (menuAdmin) {
            menuAdmin.classList.remove("hidden");
        }

        definirTexto(
            "header-user-role",
            "Gestor Administrativo"
        );

        irParaTela("dashboard");

        atualizarDashboardAdmin();
    }
}


/* ==========================================================
   07. WHITE LABEL
   ========================================================== */

function aplicarWhiteLabelNoLogin() {

    const dados = getDados();

    if (!dados || !dados.settings) {
        return;
    }

    const configuracoes = dados.settings;


    document.documentElement.style.setProperty(
        "--primary-color",
        configuracoes.primaryColor || "#2563eb"
    );


    document.title =
        `Acesso | ${configuracoes.systemName || "Gestão"}`;


    definirTexto(
        "login-system-name",
        configuracoes.systemName ||
        "Gestão de Manutenção"
    );


    const logo = obterElemento("login-logo-img");

    if (logo) {

        if (
            configuracoes.logoBase64 &&
            configuracoes.logoBase64.trim() !== ""
        ) {

            logo.src = configuracoes.logoBase64;

            logo.classList.remove("hidden");

        } else {

            logo.classList.add("hidden");
        }
    }
}


function aplicarConfiguracoesVisuaisInternas() {

    const dados = getDados();

    if (!dados || !dados.settings) {
        return;
    }

    const configuracoes = dados.settings;


    document.documentElement.style.setProperty(
        "--primary-color",
        configuracoes.primaryColor || "#2563eb"
    );


    document.title =
        `${configuracoes.companyName || "Empresa"} | ${configuracoes.systemName || "Sistema"}`;


    definirTexto(
        "company-name-display",
        configuracoes.companyName || "Sua Empresa"
    );


    definirTexto(
        "system-name-display",
        configuracoes.systemName || "Gestão de Manutenção"
    );


    const logo = obterElemento("company-logo-img");
    const placeholder = obterElemento("company-logo-placeholder");


    if (logo && placeholder) {

        if (
            configuracoes.logoBase64 &&
            configuracoes.logoBase64.trim() !== ""
        ) {

            logo.src = configuracoes.logoBase64;

            logo.classList.remove("hidden");

            placeholder.classList.add("hidden");

        } else {

            logo.classList.add("hidden");

            placeholder.classList.remove("hidden");
        }
    }
}


/* ==========================================================
   08. NAVEGAÇÃO
   ========================================================== */

function configurarNavegacao() {

    const navItems =
        document.querySelectorAll(".nav-item");


    navItems.forEach(item => {

        item.addEventListener("click", function(event) {

            event.preventDefault();

            const targetPage =
                item.getAttribute("data-page");


            if (!targetPage) {
                return;
            }


            navegarParaPagina(targetPage);
        });
    });
}


function paginaPermitidaParaPerfil(pagina, role) {

    const paginasAdmin = [
        "dashboard",
        "chamados",
        "os",
        "agenda",
        "condominios",
        "equipamentos",
        "configuracoes"
    ];


    const paginasSindico = [
        "sindico-inicio",
        "sindico-novo-chamado",
        "sindico-meus-chamados"
    ];


    const paginasTecnico = [
        "tecnico-inicio",
        "tecnico-os"
    ];


    if (role === "admin") {
        return paginasAdmin.includes(pagina);
    }


    if (role === "sindico") {
        return paginasSindico.includes(pagina);
    }


    if (role === "tecnico") {
        return paginasTecnico.includes(pagina);
    }


    return false;
}


window.navegarParaPagina = function(pagina) {

    const sessao = obterSessao();

    if (!sessao) {
        return;
    }


    if (!paginaPermitidaParaPerfil(pagina, sessao.role)) {

        console.warn(
            "Página não permitida para o perfil:",
            pagina
        );

        return;
    }


    const paginas =
        document.querySelectorAll(".page-view");


    paginas.forEach(page => {
        page.classList.add("hidden");
        page.classList.remove("active");
    });


    const paginaAlvo =
        obterElemento(`page-${pagina}`);


    if (!paginaAlvo) {
        console.warn(
            "Página não encontrada:",
            `page-${pagina}`
        );

        return;
    }


    paginaAlvo.classList.remove("hidden");
    paginaAlvo.classList.add("active");


    const navItems =
        document.querySelectorAll(".nav-item");


    navItems.forEach(nav => {

        const navPage =
            nav.getAttribute("data-page");

        nav.classList.toggle(
            "active",
            navPage === pagina
        );
    });


    const sidebar =
        obterElemento("sidebar");

    if (sidebar) {
        sidebar.classList.remove("open");
    }


    atualizarTelaPorPagina(pagina);
};


window.irParaTela = function(pagina) {

    window.navegarParaPagina(pagina);

};


function atualizarTelaPorPagina(pagina) {

    switch (pagina) {

        case "dashboard":
            atualizarDashboardAdmin();
            break;

        case "chamados":
            renderizarTabelaChamadosAdmin();
            break;

        case "os":
            renderizarTabelaOSAdmin();
            break;

        case "agenda":
            renderizarAgendaRotas();
            break;

        case "condominios":
            renderizarTabelaCondominios();
            break;

        case "equipamentos":
            renderizarTabelaEquipamentos();
            break;

        case "sindico-inicio":
        case "sindico-novo-chamado":
        case "sindico-meus-chamados":
            atualizarPortalSindico();
            break;

        case "tecnico-inicio":
        case "tecnico-os": {

            const sessao = obterSessao();

            atualizarPortalTecnico(
                sessao
                    ? sessao.nome
                    : TÉCNICO_LOGADO
            );

            break;
        }

        case "configuracoes":
            carregarConfiguracoes();
            break;
    }
}


/* ==========================================================
   09. MENU MOBILE
   ========================================================== */

function configurarMenuMobile() {

    const botao =
        obterElemento("mobile-menu-btn");

    const sidebar =
        obterElemento("sidebar");


    if (!botao || !sidebar) {
        return;
    }


    botao.addEventListener("click", () => {

        sidebar.classList.toggle("open");

    });


    document.addEventListener("click", event => {

        if (
            window.innerWidth > 768 ||
            !sidebar.classList.contains("open")
        ) {
            return;
        }


        const clicouNoMenu =
            sidebar.contains(event.target);

        const clicouNoBotao =
            botao.contains(event.target);


        if (!clicouNoMenu && !clicouNoBotao) {

            sidebar.classList.remove("open");
        }
    });
}


/* ==========================================================
   10. DASHBOARD ADMINISTRATIVO
   ========================================================== */

function atualizarDashboardAdmin() {

    const dados = getDados();

    const chamados =
        dados.chamados || [];

    const ordens =
        dados.ordensServico || [];


    const chamadosNovos =
        chamados.filter(
            chamado => chamado.status === "Novo"
        ).length;


    const osAndamento =
        ordens.filter(
            os => os.status === "Em andamento"
        ).length;


    const osAtrasadas =
        ordens.filter(
            os => verificarOSAtrasada(os)
        ).length;


    definirTexto(
        "count-os",
        chamadosNovos
    );


    definirTexto(
        "count-andamento",
        osAndamento
    );


    definirTexto(
        "count-atrasadas",
        osAtrasadas
    );
}


function verificarOSAtrasada(os) {

    if (!os) {
        return false;
    }


    if (
        os.status === "Concluída" ||
        !os.dataFormatoEN
    ) {
        return false;
    }


    const hoje = hojeISO();


    return (
        os.dataFormatoEN < hoje &&
        os.status !== "Concluída"
    );
}


/* ==========================================================
   11. CHAMADOS ADMINISTRATIVOS
   ========================================================== */

function configurarModuloChamadosAdmin() {

    const botao =
        obterElemento("btn-abrir-modal-os-avulsa");

    if (botao) {

        botao.addEventListener("click", () => {

            abrirModal("modal-nova-os-avulsa");

        });
    }


    const fechar =
        obterElemento("btn-fechar-modal-os-avulsa");

    if (fechar) {

        fechar.addEventListener("click", () => {

            fecharModal("modal-nova-os-avulsa");

        });
    }


    const cancelar =
        obterElemento("btn-canc-os-av");

    if (cancelar) {

        cancelar.addEventListener("click", () => {

            fecharModal("modal-nova-os-avulsa");

        });
    }


    const form =
        obterElemento("form-nova-os-avulsa");


    if (form) {

        form.addEventListener("submit", event => {

            event.preventDefault();

            criarOSAvulsa();

        });
    }
}


window.filtrarChamados = function(status, elemento) {

    const abas =
        document.querySelectorAll(
            "#page-chamados .filter-tab"
        );


    abas.forEach(aba => {
        aba.classList.remove("active");
    });


    if (elemento) {

        elemento.classList.add("active");

    } else if (typeof event !== "undefined" && event?.currentTarget) {

        event.currentTarget.classList.add("active");
    }


    renderizarTabelaChamadosAdmin(status);

};


function renderizarTabelaChamadosAdmin(
    filtro = "Todos"
) {

    const dados = getDados();

    const tbody =
        document.querySelector(
            "#tabela-chamados tbody"
        );


    if (!tbody) {
        return;
    }


    let lista =
        [...dados.chamados];


    if (filtro !== "Todos") {

        lista =
            lista.filter(
                chamado =>
                    chamado.status === filtro
            );
    }


    lista.sort(
        (a, b) =>
            Number(b.id) - Number(a.id)
    );


    tbody.innerHTML = "";


    if (lista.length === 0) {

        tbody.innerHTML = `
            <tr>
                <td colspan="5">
                    <div class="empty-state">
                        <span class="material-symbols-outlined">
                            inbox
                        </span>
                        <h3>Nenhum chamado encontrado</h3>
                        <p>
                            Não existem chamados para este filtro.
                        </p>
                    </div>
                </td>
            </tr>
        `;

        return;
    }


    lista.forEach(chamado => {

        const badge =
            classeStatusChamado(
                chamado.status
            );


        tbody.innerHTML += `

            <tr>

                <td>
                    <strong>
                        #${escaparHTML(chamado.id)}
                    </strong>
                </td>

                <td>
                    <strong>
                        ${escaparHTML(chamado.condominio)}
                    </strong>

                    <br>

                    <small class="text-muted">
                        ${escaparHTML(chamado.local)}
                    </small>
                </td>

                <td>
                    ${escaparHTML(chamado.problema)}
                </td>

                <td>
                    <span class="badge ${badge}">
                        ${escaparHTML(chamado.status)}
                    </span>
                </td>

                <td style="text-align:right;">

                    <button
                        class="btn btn-primary"
                        type="button"
                        onclick="abrirAdminChamado(${Number(chamado.id)})"
                    >
                        Analisar
                    </button>

                </td>

            </tr>
        `;
    });
}


function classeStatusChamado(status) {

    switch (status) {

        case "Novo":
            return "badge-status-novo";

        case "Agendado":
            return "badge-status-agendada";

        case "Em atendimento":
            return "badge-status-andamento";

        case "Concluído":
            return "badge-status-concluida";

        default:
            return "badge-status-novo";
    }
}


/* ==========================================================
   12. DETALHES DO CHAMADO
   ========================================================== */

window.abrirAdminChamado = function(id) {

    const dados = getDados();


    const chamado =
        dados.chamados.find(
            item => Number(item.id) === Number(id)
        );


    if (!chamado) {
        return;
    }


    definirTexto(
        "modal-chamado-titulo",
        `Chamado #${chamado.id} — ${chamado.condominio}`
    );


    definirTexto(
        "modal-chamado-local",
        chamado.local
    );


    definirTexto(
        "modal-chamado-problema",
        chamado.problema
    );


    const data =
        obterElemento("conv-os-data");


    if (data) {

        data.value =
            chamado.dataISO ||
            hojeISO();
    }


    const tecnico =
        obterElemento("conv-os-tecnico");


    if (
        tecnico &&
        !tecnico.value
    ) {
        tecnico.value = TÉCNICO_LOGADO;
    }


    const osExistente =
        dados.ordensServico.find(
            os =>
                Number(os.chamadoId) ===
                Number(chamado.id)
        );


    const bloco =
        obterElemento("bloco-conversao-os");


    const footer =
        obterElemento("modal-chamado-footer");


    if (osExistente) {

        if (bloco) {
            bloco.classList.add("hidden");
        }


        if (footer) {

            footer.innerHTML = `

                <button
                    type="button"
                    class="btn btn-ghost"
                    onclick="fecharModal('modal-detalhe-chamado')"
                >
                    Fechar
                </button>

                <button
                    type="button"
                    class="btn btn-primary"
                    onclick="fecharModal('modal-detalhe-chamado'); abrirVisualizacaoOS(${Number(osExistente.id)})"
                >
                    Ver Ordem de Serviço
                </button>

            `;
        }

    } else {

        if (bloco) {
            bloco.classList.remove("hidden");
        }


        if (footer) {

            footer.innerHTML = `

                <button
                    type="button"
                    class="btn btn-ghost"
                    onclick="fecharModal('modal-detalhe-chamado')"
                >
                    Fechar
                </button>

                <button
                    type="button"
                    class="btn btn-primary"
                    onclick="converterChamadoParaOS(${Number(chamado.id)})"
                >
                    Criar Ordem de Serviço
                </button>

            `;
        }
    }


    abrirModal("modal-detalhe-chamado");

};


window.converterChamadoParaOS = function(chamadoId) {

    const dados = getDados();


    const chamado =
        dados.chamados.find(
            item =>
                Number(item.id) ===
                Number(chamadoId)
        );


    if (!chamado) {
        return;
    }


    const inputData =
        obterElemento("conv-os-data");

    const inputHora =
        obterElemento("conv-os-hora");

    const inputTecnico =
        obterElemento("conv-os-tecnico");


    const dataEN =
        inputData?.value || "";

    const hora =
        inputHora?.value || "";

    const tecnico =
        inputTecnico?.value.trim() || "";


    if (!dataEN) {

        alert("Informe a data da OS.");

        return;
    }


    if (!hora) {

        alert("Informe o horário da OS.");

        return;
    }


    if (!tecnico) {

        alert("Informe o técnico responsável.");

        return;
    }


    const existe =
        dados.ordensServico.some(
            os =>
                Number(os.chamadoId) ===
                Number(chamado.id)
        );


    if (existe) {

        alert(
            "Este chamado já possui uma Ordem de Serviço."
        );

        return;
    }


    const novoId =
        gerarNovoId(
            dados.ordensServico,
            1001
        );


    const novaOS = {

        id: novoId,

        chamadoId: chamado.id,

        condominio:
            chamado.condominio,

        localOriginal:
            chamado.local,

        problemaOriginal:
            chamado.problema,

        categoria:
            chamado.categoria,

        prioridade:
            chamado.prioridade,

        dataFormatoEN:
            dataEN,

        data:
            formatarData(dataEN),

        hora:
            hora,

        tecnico:
            tecnico,

        status:
            "Agendada",

        diagnostico:
            "",

        materiais:
            "",

        criadaEm:
            new Date().toISOString()
    };


    dados.ordensServico.push(novaOS);


    chamado.status =
        "Agendado";


    salvarDados(dados);


    fecharModal(
        "modal-detalhe-chamado"
    );


    renderizarTabelaChamadosAdmin();

    renderizarTabelaOSAdmin();

    atualizarDashboardAdmin();


    alert(
        `Ordem de Serviço #${novoId} criada com sucesso.`
    );
};


/* ==========================================================
   13. ORDENS DE SERVIÇO
   ========================================================== */

function configurarModuloOSAdmin() {

    // O módulo é alimentado pelos botões
    // e pela função de conversão do chamado.
    // Não precisa registrar listeners extras aqui.
}


window.filtrarOS = function(status, elemento) {

    const abas =
        document.querySelectorAll(
            "#page-os .filter-tab"
        );


    abas.forEach(aba => {
        aba.classList.remove("active");
    });


    if (elemento) {

        elemento.classList.add("active");

    } else if (
        typeof event !== "undefined" &&
        event?.currentTarget
    ) {

        event.currentTarget.classList.add("active");
    }


    renderizarTabelaOSAdmin(status);

};


function renderizarTabelaOSAdmin(
    filtro = "Todas"
) {

    const dados = getDados();


    const tbody =
        document.querySelector(
            "#tabela-os tbody"
        );


    if (!tbody) {
        return;
    }


    let lista =
        [...dados.ordensServico];


    if (filtro !== "Todas") {

        lista =
            lista.filter(
                os =>
                    os.status === filtro
            );
    }


    lista.sort(
        (a, b) =>
            Number(b.id) - Number(a.id)
    );


    tbody.innerHTML = "";


    if (lista.length === 0) {

        tbody.innerHTML = `

            <tr>

                <td colspan="7">

                    <div class="empty-state">

                        <span class="material-symbols-outlined">
                            assignment
                        </span>

                        <h3>Nenhuma OS encontrada</h3>

                        <p>
                            As ordens de serviço aparecerão aqui.
                        </p>

                    </div>

                </td>

            </tr>
        `;

        return;
    }


    lista.forEach(os => {

        const badge =
            classeStatusOS(
                os.status
            );


        tbody.innerHTML += `

            <tr>

                <td>
                    <strong>
                        #${escaparHTML(os.id)}
                    </strong>
                </td>

                <td>
                    <strong>
                        ${escaparHTML(os.condominio)}
                    </strong>
                </td>

                <td>
                    ${escaparHTML(
                        os.problemaOriginal ||
                        os.servico ||
                        "Serviço Avulso"
                    )}
                </td>

                <td>
                    ${escaparHTML(
                        os.data ||
                        formatarData(os.dataFormatoEN)
                    )}
                    às
                    ${escaparHTML(os.hora || "-")}
                </td>

                <td>
                    ${escaparHTML(
                        os.tecnico || "-"
                    )}
                </td>

                <td>
                    <span class="badge ${badge}">
                        ${escaparHTML(os.status)}
                    </span>
                </td>

                <td style="text-align:right;">

                    <button
                        type="button"
                        class="btn btn-primary"
                        onclick="abrirVisualizacaoOS(${Number(os.id)})"
                    >
                        Visualizar
                    </button>

                </td>

            </tr>
        `;
    });
}


function classeStatusOS(status) {

    switch (status) {

        case "Agendada":
            return "badge-status-agendada";

        case "Em andamento":
            return "badge-status-andamento";

        case "Concluída":
            return "badge-status-concluida";

        case "Atrasada":
            return "badge-status-atrasada";

        default:
            return "badge-status-aberta";
    }
}


/* ==========================================================
   14. OS AVULSA
   ========================================================== */

function criarOSAvulsa() {

    const condominio =
        obterElemento("input-os-av-cond")
            ?.value.trim() || "";

    const servico =
        obterElemento("input-os-av-servico")
            ?.value.trim() || "";

    const tecnico =
        obterElemento("input-os-av-tec")
            ?.value.trim() || "";


    if (!condominio) {

        alert("Informe o condomínio.");

        return;
    }


    if (!servico) {

        alert("Informe o serviço.");

        return;
    }


    if (!tecnico) {

        alert("Informe o técnico.");

        return;
    }


    const dados = getDados();


    const novoId =
        gerarNovoId(
            dados.ordensServico,
            1001
        );


    const data = hojeISO();


    dados.ordensServico.push({

        id: novoId,

        chamadoId: null,

        condominio: condominio,

        localOriginal: "Atendimento avulso",

        problemaOriginal: servico,

        servico: servico,

        dataFormatoEN: data,

        data: formatarData(data),

        hora: "08:00",

        tecnico: tecnico,

        status: "Agendada",

        diagnostico: "",

        materiais: "",

        criadaEm: new Date().toISOString()
    });


    salvarDados(dados);


    const form =
        obterElemento("form-nova-os-avulsa");


    if (form) {
        form.reset();
    }


    fecharModal(
        "modal-nova-os-avulsa"
    );


    renderizarTabelaOSAdmin();

    atualizarDashboardAdmin();


    alert(
        `OS #${novoId} criada com sucesso.`
    );
}


/* ==========================================================
   15. VISUALIZAÇÃO DA OS
   ========================================================== */

window.abrirVisualizacaoOS = function(id) {

    const dados = getDados();


    const os =
        dados.ordensServico.find(
            item =>
                Number(item.id) ===
                Number(id)
        );


    if (!os) {
        return;
    }


    preencherDadosOSNoModal(os);


    const blocoAcoes =
        obterElemento("bloco-tecnico-acoes");


    if (blocoAcoes) {

        blocoAcoes.classList.add("hidden");
    }


    const blocoLaudo =
        obterElemento("bloco-laudo-final");


    if (blocoLaudo) {

        if (os.status === "Concluída") {

            blocoLaudo.classList.remove("hidden");

            definirTexto(
                "laudo-os-diag",
                os.diagnostico ||
                "Serviço concluído."
            );

            definirTexto(
                "laudo-os-mat",
                os.materiais ||
                "Nenhum material utilizado."
            );

        } else {

            blocoLaudo.classList.add("hidden");
        }
    }


    abrirModal(
        "modal-execucao-os"
    );
};


function preencherDadosOSNoModal(os) {

    definirTexto(
        "exec-os-titulo",
        `OS #${os.id} — ${os.status}`
    );


    definirTexto(
        "exec-os-condominio",
        os.condominio
    );


    definirTexto(
        "exec-os-local",
        os.localOriginal ||
        "Geral"
    );


    definirTexto(
        "exec-os-problema",
        os.problemaOriginal ||
        os.servico ||
        "Serviço sob demanda"
    );
}


/* ==========================================================
   16. TÉCNICO
   ========================================================== */

function configurarModuloOSTecnico() {

    const btnIniciar =
        obterElemento("btn-iniciar-os");

    const btnFinalizar =
        obterElemento("btn-finalizar-os");


    if (btnIniciar) {

        btnIniciar.addEventListener(
            "click",
            iniciarOSSelecionada
        );
    }


    if (btnFinalizar) {

        btnFinalizar.addEventListener(
            "click",
            finalizarOSSelecionada
        );
    }
}


function atualizarPortalTecnico(nomeLogado) {

    const nome =
        nomeLogado ||
        TÉCNICO_LOGADO;


    const dados = getDados();


    const ordens =
        dados.ordensServico.filter(
            os =>
                String(os.tecnico).trim() ===
                String(nome).trim()
        );


    const container =
        obterElemento(
            "tec-proximo-atendimento"
        );


    if (container) {

        const pendentes =
            ordens
                .filter(
                    os =>
                        os.status === "Agendada" ||
                        os.status === "Em andamento"
                )
                .sort(
                    (a, b) =>
                        `${a.dataFormatoEN || ""} ${a.hora || ""}`
                            .localeCompare(
                                `${b.dataFormatoEN || ""} ${b.hora || ""}`
                            )
                );


        if (pendentes.length > 0) {

            const proxima =
                pendentes[0];


            container.innerHTML = `

                <div
                    class="card clickable-card"
                    style="
                        border-left:4px solid var(--primary-color);
                        cursor:pointer;
                    "
                    onclick="abrirExecucaoOSMobile(${Number(proxima.id)})"
                >

                    <div
                        style="
                            display:flex;
                            justify-content:space-between;
                            align-items:center;
                            gap:10px;
                            margin-bottom:12px;
                        "
                    >

                        <strong
                            style="
                                font-size:20px;
                                color:var(--primary-color);
                            "
                        >
                            ${escaparHTML(
                                proxima.hora || "--:--"
                            )}
                        </strong>

                        <span class="badge ${classeStatusOS(proxima.status)}">
                            ${escaparHTML(proxima.status)}
                        </span>

                    </div>


                    <p
                        style="
                            font-size:15px;
                            font-weight:700;
                            margin-bottom:3px;
                        "
                    >
                        ${escaparHTML(
                            proxima.condominio
                        )}
                    </p>


                    <p
                        style="
                            font-size:12px;
                            color:var(--text-muted);
                            margin-bottom:15px;
                        "
                    >
                        ${escaparHTML(
                            proxima.localOriginal ||
                            "Local não informado"
                        )}
                    </p>


                    <button
                        type="button"
                        class="btn btn-primary btn-block"
                        style="margin:0;"
                        onclick="event.stopPropagation(); abrirExecucaoOSMobile(${Number(proxima.id)})"
                    >
                        Visualizar OS
                    </button>

                </div>

            `;

        } else {

            container.innerHTML = `

                <div class="card">

                    <div class="empty-state">

                        <span class="material-symbols-outlined">
                            event_available
                        </span>

                        <h3>Nenhuma OS pendente</h3>

                        <p>
                            Não existem atendimentos programados para você.
                        </p>

                    </div>

                </div>

            `;
        }
    }


    renderizarListaOSTecnico(
        "Pendentes",
        false
    );
}


window.mudarFiltroTecnico = function(
    filtro,
    elemento
) {

    const abas =
        document.querySelectorAll(
            "#page-tecnico-os .filter-tab"
        );


    abas.forEach(aba => {

        aba.classList.remove("active");

    });


    if (elemento) {

        elemento.classList.add("active");

    } else if (
        typeof event !== "undefined" &&
        event?.currentTarget
    ) {

        event.currentTarget.classList.add("active");
    }


    renderizarListaOSTecnico(
        filtro,
        true
    );
};


function renderizarListaOSTecnico(
    filtro = "Pendentes"
) {

    const container =
        obterElemento(
            "container-tec-lista-os"
        );


    if (!container) {
        return;
    }


    const sessao =
        obterSessao();


    const nome =
        sessao?.nome ||
        TÉCNICO_LOGADO;


    const dados =
        getDados();


    let ordens =
        dados.ordensServico.filter(
            os =>
                String(os.tecnico).trim() ===
                String(nome).trim()
        );


    if (filtro === "Pendentes") {

        ordens =
            ordens.filter(
                os =>
                    os.status !== "Concluída"
            );
    }


    if (filtro === "Concluídas") {

        ordens =
            ordens.filter(
                os =>
                    os.status === "Concluída"
            );
    }


    ordens.sort(
        (a, b) =>
            Number(b.id) - Number(a.id)
    );


    container.innerHTML = "";


    if (ordens.length === 0) {

        container.innerHTML = `

            <div class="empty-state">

                <span class="material-symbols-outlined">
                    assignment_turned_in
                </span>

                <h3>Nenhuma OS encontrada</h3>

                <p>
                    Não existem ordens de serviço neste filtro.
                </p>

            </div>

        `;

        return;
    }


    ordens.forEach(os => {

        const badge =
            classeStatusOS(
                os.status
            );


        container.innerHTML += `

            <div
                class="task-card"
                onclick="abrirExecucaoOSMobile(${Number(os.id)})"
                style="
                    cursor:pointer;
                    background:#fff;
                    border:1px solid var(--border-color);
                    border-radius:var(--radius-lg);
                    padding:16px;
                    margin-bottom:10px;
                "
            >

                <div
                    style="
                        display:flex;
                        align-items:center;
                        justify-content:space-between;
                        gap:10px;
                        margin-bottom:10px;
                    "
                >

                    <span
                        style="
                            font-size:11px;
                            font-weight:700;
                            color:var(--text-muted);
                        "
                    >
                        OS #${escaparHTML(os.id)}
                    </span>


                    <span class="badge ${badge}">
                        ${escaparHTML(os.status)}
                    </span>

                </div>


                <p
                    style="
                        font-size:11px;
                        color:var(--text-muted);
                        margin-bottom:4px;
                    "
                >
                    ${escaparHTML(
                        os.data || formatarData(os.dataFormatoEN)
                    )}
                    às
                    ${escaparHTML(os.hora || "-")}
                </p>


                <p
                    style="
                        font-size:13px;
                        font-weight:700;
                        margin-bottom:4px;
                    "
                >
                    ${escaparHTML(os.condominio)}
                </p>


                <p
                    style="
                        font-size:11px;
                        color:var(--text-muted);
                    "
                >
                    ${escaparHTML(
                        os.problemaOriginal ||
                        os.servico ||
                        "Serviço"
                    )}
                </p>

            </div>

        `;
    });
}


window.abrirExecucaoOSMobile = function(id) {

    const dados = getDados();


    const os =
        dados.ordensServico.find(
            item =>
                Number(item.id) ===
                Number(id)
        );


    if (!os) {
        return;
    }


    const sessao =
        obterSessao();


    if (
        sessao &&
        sessao.role === "tecnico" &&
        String(os.tecnico).trim() !==
        String(sessao.nome).trim()
    ) {

        alert(
            "Esta Ordem de Serviço não está atribuída a você."
        );

        return;
    }


    preencherDadosOSNoModal(os);


    const blocoAcoes =
        obterElemento(
            "bloco-tecnico-acoes"
        );


    const btnIniciar =
        obterElemento(
            "btn-iniciar-os"
        );


    const blocoFormulario =
        obterElemento(
            "bloco-tecnico-formulario"
        );


    const blocoLaudo =
        obterElemento(
            "bloco-laudo-final"
        );


    const inputDiag =
        obterElemento(
            "exec-input-diag"
        );


    const inputMat =
        obterElemento(
            "exec-input-materiais"
        );


    if (blocoAcoes) {

        blocoAcoes.classList.remove("hidden");
    }


    if (blocoLaudo) {

        blocoLaudo.classList.add("hidden");
    }


    if (inputDiag) {

        inputDiag.value =
            os.diagnostico || "";
    }


    if (inputMat) {

        inputMat.value =
            os.materiais || "";
    }


    if (os.status === "Concluída") {

        if (btnIniciar) {
            btnIniciar.classList.add("hidden");
        }

        if (blocoFormulario) {
            blocoFormulario.classList.add("hidden");
        }

        if (blocoLaudo) {

            blocoLaudo.classList.remove("hidden");

            definirTexto(
                "laudo-os-diag",
                os.diagnostico ||
                "Serviço concluído."
            );

            definirTexto(
                "laudo-os-mat",
                os.materiais ||
                "Nenhum material utilizado."
            );
        }

    }

    else if (os.status === "Em andamento") {

        if (btnIniciar) {
            btnIniciar.classList.add("hidden");
        }

        if (blocoFormulario) {
            blocoFormulario.classList.remove("hidden");
        }

    }

    else {

        if (btnIniciar) {
            btnIniciar.classList.remove("hidden");
        }

        if (blocoFormulario) {
            blocoFormulario.classList.add("hidden");
        }
    }


    abrirModal(
        "modal-execucao-os"
    );
};


function obterOSAbertaNoModal() {

    const titulo =
        obterElemento(
            "exec-os-titulo"
        );


    if (!titulo) {
        return null;
    }


    const texto =
        titulo.textContent || "";


    const match =
        texto.match(/OS\s*#(\d+)/i);


    if (!match) {
        return null;
    }


    return Number(match[1]);
}


function iniciarOSSelecionada() {

    const id =
        obterOSAbertaNoModal();


    if (!id) {

        alert(
            "Não foi possível identificar a Ordem de Serviço."
        );

        return;
    }


    const dados = getDados();


    const os =
        dados.ordensServico.find(
            item =>
                Number(item.id) ===
                Number(id)
        );


    if (!os) {
        return;
    }


    os.status =
        "Em andamento";


    if (os.chamadoId) {

        const chamado =
            dados.chamados.find(
                c =>
                    Number(c.id) ===
                    Number(os.chamadoId)
            );


        if (chamado) {

            chamado.status =
                "Em atendimento";
        }
    }


    salvarDados(dados);


    abrirExecucaoOSMobile(id);

    atualizarDashboardAdmin();

    atualizarPortalTecnico(
        obterSessao()?.nome ||
        TÉCNICO_LOGADO
    );
}


function finalizarOSSelecionada() {

    const id =
        obterOSAbertaNoModal();


    if (!id) {
        return;
    }


    const dados = getDados();


    const os =
        dados.ordensServico.find(
            item =>
                Number(item.id) ===
                Number(id)
        );


    if (!os) {
        return;
    }


    const diagnostico =
        obterElemento(
            "exec-input-diag"
        )?.value.trim() || "";


    const materiais =
        obterElemento(
            "exec-input-materiais"
        )?.value.trim() || "";


    if (!diagnostico) {

        alert(
            "Descreva o serviço realizado antes de finalizar a OS."
        );

        return;
    }


    os.diagnostico =
        diagnostico;


    os.materiais =
        materiais;


    os.status =
        "Concluída";


    os.concluidaEm =
        new Date().toISOString();


    if (os.chamadoId) {

        const chamado =
            dados.chamados.find(
                c =>
                    Number(c.id) ===
                    Number(os.chamadoId)
            );


        if (chamado) {

            chamado.status =
                "Concluído";


            chamado.laudoTecnico =
                diagnostico;


            chamado.materiaisUsados =
                materiais;
        }
    }


    salvarDados(dados);


    fecharModal(
        "modal-execucao-os"
    );


    renderizarTabelaOSAdmin();

    renderizarTabelaChamadosAdmin();

    atualizarDashboardAdmin();


    const sessao =
        obterSessao();


    if (sessao?.role === "tecnico") {

        atualizarPortalTecnico(
            sessao.nome
        );
    }


    alert(
        `Ordem de Serviço #${id} finalizada com sucesso.`
    );
}


/* ==========================================================
   17. PORTAL DO SÍNDICO
   ========================================================== */

function configurarModuloPortalSindico() {

    const form =
        obterElemento(
            "form-sindico-chamado"
        );


    if (form) {

        form.addEventListener(
            "submit",
            event => {

                event.preventDefault();

                criarChamadoSindico();
            }
        );
    }


    const seletor =
        obterElemento(
            "seletor-condominio-sindico"
        );


    if (seletor) {

        seletor.addEventListener(
            "change",
            atualizarPortalSindico
        );
    }
}


function atualizarPortalSindico() {

    const dados =
        getDados();


    const seletor =
        obterElemento(
            "seletor-condominio-sindico"
        );


    if (seletor) {

        const valorAtual =
            seletor.value;


        seletor.innerHTML = "";


        dados.condominios.forEach(
            condominio => {

                const option =
                    document.createElement(
                        "option"
                    );


                option.value =
                    condominio.nome;


                option.textContent =
                    condominio.nome;


                seletor.appendChild(
                    option
                );
            }
        );


        if (
            valorAtual &&
            dados.condominios.some(
                c =>
                    c.nome ===
                    valorAtual
            )
        ) {

            seletor.value =
                valorAtual;

        }
    }


    const condominioSelecionado =
        seletor?.value ||
        dados.condominios[0]?.nome ||
        "";


    definirTexto(
        "input-sind-chamado-cond",
        condominioSelecionado
    );


    const inputCond =
        obterElemento(
            "input-sind-chamado-cond"
        );


    if (inputCond) {

        inputCond.value =
            condominioSelecionado;
    }


    const chamados =
        dados.chamados.filter(
            chamado =>
                chamado.condominio ===
                condominioSelecionado
        );


    atualizarCardsSindico(
        chamados
    );


    renderizarChamadosSindico(
        chamados
    );
}


function atualizarCardsSindico(
    chamados
) {

    const total =
        chamados.length;


    const andamento =
        chamados.filter(
            chamado =>
                chamado.status === "Agendado" ||
                chamado.status === "Em atendimento"
        ).length;


    const concluidos =
        chamados.filter(
            chamado =>
                chamado.status === "Concluído"
        ).length;


    definirTexto(
        "sind-card-total",
        total
    );


    definirTexto(
        "sind-card-andamento",
        andamento
    );


    definirTexto(
        "sind-card-concluidos",
        concluidos
    );
}


function criarChamadoSindico() {

    const form =
        obterElemento(
            "form-sindico-chamado"
        );


    const condominio =
        obterElemento(
            "input-sind-chamado-cond"
        )?.value.trim() || "";


    const local =
        obterElemento(
            "input-sind-chamado-local"
        )?.value.trim() || "";


    const categoria =
        obterElemento(
            "input-sind-chamado-cat"
        )?.value || "Outros";


    const problema =
        obterElemento(
            "input-sind-chamado-desc"
        )?.value.trim() || "";


    if (!condominio) {

        alert(
            "Não foi possível identificar o condomínio."
        );

        return;
    }


    if (!local) {

        alert(
            "Informe o local exato do problema."
        );

        return;
    }


    if (!problema) {

        alert(
            "Descreva o problema."
        );

        return;
    }


    const dados =
        getDados();


    const novoId =
        gerarNovoId(
            dados.chamados,
            101
        );


    const agora =
        new Date();


    const novoChamado = {

        id: novoId,

        condominio:
            condominio,

        local:
            local,

        categoria:
            categoria,

        problema:
            problema,

        prioridade:
            "Normal",

        status:
            "Novo",

        data:
            agora.toLocaleDateString(
                "pt-BR"
            ),

        dataISO:
            hojeISO(),

        criadoEm:
            agora.toISOString(),

        laudoTecnico:
            "",

        materiaisUsados:
            ""
    };


    dados.chamados.push(
        novoChamado
    );


    salvarDados(dados);


    if (form) {
        form.reset();
    }


    atualizarPortalSindico();


    alert(
        `Chamado #${novoId} enviado com sucesso.\n\nA empresa de manutenção recebeu a solicitação.`
    );


    irParaTela(
        "sindico-meus-chamados"
    );
}


/* ==========================================================
   18. TABELA DE CHAMADOS DO SÍNDICO
   ========================================================== */

function renderizarChamadosSindico(
    chamados
) {

    const tbody =
        document.querySelector(
            "#tabela-sindico-todos tbody"
        );


    if (!tbody) {
        return;
    }


    tbody.innerHTML = "";


    const lista =
        [...chamados].sort(
            (a, b) =>
                Number(b.id) -
                Number(a.id)
        );


    if (lista.length === 0) {

        tbody.innerHTML = `

            <tr>

                <td colspan="6">

                    <div class="empty-state">

                        <span class="material-symbols-outlined">
                            inbox
                        </span>

                        <h3>Nenhum chamado aberto</h3>

                        <p>
                            Quando você registrar uma ocorrência,
                            ela aparecerá nesta lista.
                        </p>

                    </div>

                </td>

            </tr>

        `;

        return;
    }


    lista.forEach(chamado => {

        const badge =
            classeStatusChamado(
                chamado.status
            );


        tbody.innerHTML += `

            <tr>

                <td>
                    <strong>
                        #${escaparHTML(chamado.id)}
                    </strong>
                </td>

                <td>
                    ${escaparHTML(
                        chamado.local || "-"
                    )}
                </td>

                <td>
                    ${escaparHTML(
                        chamado.problema
                    )}
                </td>

                <td>
                    ${escaparHTML(
                        chamado.data
                    )}
                </td>

                <td>

                    <span class="badge ${badge}">
                        ${escaparHTML(
                            chamado.status
                        )}
                    </span>

                </td>

                <td style="text-align:right;">

                    <button
                        type="button"
                        class="btn btn-primary"
                        onclick="abrirAcompanhamentoSindico(${Number(chamado.id)})"
                    >
                        Visualizar
                    </button>

                </td>

            </tr>

        `;
    });
}


/* ==========================================================
   19. ACOMPANHAMENTO DO CHAMADO
   ========================================================== */

window.abrirAcompanhamentoSindico = function(id) {

    const dados =
        getDados();


    const chamado =
        dados.chamados.find(
            item =>
                Number(item.id) ===
                Number(id)
        );


    if (!chamado) {
        return;
    }


    definirTexto(
        "sind-acomp-titulo",
        `Chamado #${chamado.id}`
    );


    definirTexto(
        "sind-acomp-problema",
        chamado.problema
    );


    definirTexto(
        "sind-acomp-local",
        `Local: ${chamado.local}`
    );


    const timeline =
        obterElemento(
            "sind-acomp-timeline"
        );


    if (timeline) {

        timeline.innerHTML =
            gerarTimelineSindico(
                chamado
            );
    }


    const laudoBox =
        obterElemento(
            "sind-acomp-laudo-box"
        );


    if (laudoBox) {

        if (
            chamado.status ===
            "Concluído"
        ) {

            laudoBox.classList.remove(
                "hidden"
            );


            definirTexto(
                "sind-acomp-laudo-txt",
                chamado.laudoTecnico ||
                "Serviço executado."
            );


            definirTexto(
                "sind-acomp-laudo-mat",
                chamado.materiaisUsados ||
                "Nenhum material utilizado."
            );

        } else {

            laudoBox.classList.add(
                "hidden"
            );
        }
    }


    abrirModal(
        "modal-sindico-acompanhamento"
    );
};


function gerarTimelineSindico(
    chamado
) {

    const status =
        chamado.status;


    let etapas = [

        {
            titulo: "Solicitação aberta",
            concluida: true,
            atual: status === "Novo"
        },

        {
            titulo: "Recebido e programado",
            concluida:
                status === "Agendado" ||
                status === "Em atendimento" ||
                status === "Concluído",

            atual:
                status === "Agendado"
        },

        {
            titulo: "Técnico em atendimento",
            concluida:
                status === "Concluído",

            atual:
                status === "Em atendimento"
        },

        {
            titulo: "Serviço concluído",
            concluida:
                status === "Concluído",

            atual: false
        }
    ];


    return etapas
        .map(etapa => {

            let cor =
                "#94a3b8";


            let icone =
                "radio_button_unchecked";


            let peso =
                "400";


            if (etapa.concluida) {

                cor =
                    "#16a34a";

                icone =
                    "check_circle";

                peso =
                    "600";

            } else if (etapa.atual) {

                cor =
                    "var(--primary-color)";

                icone =
                    "radio_button_checked";

                peso =
                    "600";
            }


            return `

                <div
                    style="
                        display:flex;
                        align-items:center;
                        gap:8px;
                        color:${cor};
                        font-weight:${peso};
                    "
                >

                    <span class="material-symbols-outlined">
                        ${icone}
                    </span>

                    ${etapa.titulo}

                </div>

            `;
        })
        .join("");
}


/* ==========================================================
   20. CONDOMÍNIOS
   ========================================================== */

function renderizarTabelaCondominios() {

    const dados =
        getDados();


    const tbody =
        document.querySelector(
            "#tabela-condominios tbody"
        );


    if (!tbody) {
        return;
    }


    tbody.innerHTML = "";


    if (
        dados.condominios.length ===
        0
    ) {

        tbody.innerHTML = `

            <tr>

                <td colspan="4">

                    <div class="empty-state">

                        <span class="material-symbols-outlined">
                            apartment
                        </span>

                        <h3>Nenhum condomínio cadastrado</h3>

                    </div>

                </td>

            </tr>

        `;

        return;
    }


    dados.condominios.forEach(
        condominio => {

            tbody.innerHTML += `

                <tr>

                    <td>
                        <strong>
                            ${escaparHTML(
                                condominio.nome
                            )}
                        </strong>
                    </td>

                    <td>
                        ${escaparHTML(
                            condominio.endereco
                        )}
                    </td>

                    <td>
                        ${escaparHTML(
                            condominio.sindico
                        )}
                    </td>

                    <td>

                        <span class="badge badge-status-ativo">
                            ${escaparHTML(
                                condominio.status ||
                                "Ativo"
                            )}
                        </span>

                    </td>

                </tr>

            `;
        }
    );
}


/* ==========================================================
   21. EQUIPAMENTOS
   ========================================================== */

function renderizarTabelaEquipamentos() {

    const dados =
        getDados();


    const tbody =
        document.querySelector(
            "#tabela-equipamentos tbody"
        );


    if (!tbody) {
        return;
    }


    tbody.innerHTML = "";


    if (
        dados.equipamentos.length ===
        0
    ) {

        tbody.innerHTML = `

            <tr>

                <td colspan="5">

                    <div class="empty-state">

                        <span class="material-symbols-outlined">
                            construction
                        </span>

                        <h3>Nenhum equipamento cadastrado</h3>

                        <p>
                            O cadastro de equipamentos poderá ser expandido
                            nas próximas versões.
                        </p>

                    </div>

                </td>

            </tr>

        `;

        return;
    }


    dados.equipamentos.forEach(
        equipamento => {

            tbody.innerHTML += `

                <tr>

                    <td>
                        <strong>
                            ${escaparHTML(
                                equipamento.codigo ||
                                equipamento.id
                            )}
                        </strong>
                    </td>

                    <td>
                        ${escaparHTML(
                            equipamento.nome
                        )}
                    </td>

                    <td>
                        ${escaparHTML(
                            equipamento.condominio
                        )}
                    </td>

                    <td>
                        ${escaparHTML(
                            equipamento.categoria
                        )}
                    </td>

                    <td>

                        <span class="badge badge-status-ativo">
                            ${escaparHTML(
                                equipamento.status ||
                                "Ativo"
                            )}
                        </span>

                    </td>

                </tr>

            `;
        }
    );
}


/* ==========================================================
   22. AGENDA
   ========================================================== */

function renderizarAgendaRotas() {

    const dados =
        getDados();


    const container =
        obterElemento(
            "agenda-horarios-container"
        );


    if (!container) {
        return;
    }


    let ordens =
        [...dados.ordensServico];


    ordens =
        ordens.filter(
            os =>
                os.status !==
                "Concluída"
        );


    ordens.sort(
        (a, b) => {

            const dataA =
                `${a.dataFormatoEN || ""} ${a.hora || ""}`;

            const dataB =
                `${b.dataFormatoEN || ""} ${b.hora || ""}`;

            return dataA.localeCompare(
                dataB
            );
        }
    );


    container.innerHTML = "";


    if (ordens.length === 0) {

        container.innerHTML = `

            <div class="empty-state">

                <span class="material-symbols-outlined">
                    event
                </span>

                <h3>Nenhum atendimento programado</h3>

                <p>
                    As OS agendadas aparecerão nesta área.
                </p>

            </div>

        `;

        return;
    }


    ordens.forEach(os => {

        container.innerHTML += `

            <div class="timeline-item">

                <div class="timeline-dot">

                    <span class="material-symbols-outlined">
                        schedule
                    </span>

                </div>


                <div class="timeline-content">

                    <div class="timeline-header">

                        <span>

                            ${escaparHTML(
                                os.data ||
                                formatarData(
                                    os.dataFormatoEN
                                )
                            )}

                            às

                            ${escaparHTML(
                                os.hora ||
                                "-"
                            )}

                        </span>


                        <span class="badge ${classeStatusOS(os.status)}">

                            ${escaparHTML(
                                os.tecnico ||
                                "-"
                            )}

                        </span>

                    </div>


                    <div
                        style="
                            font-size:13px;
                            font-weight:700;
                            margin-bottom:3px;
                        "
                    >
                        ${escaparHTML(
                            os.condominio
                        )}
                    </div>


                    <div
                        style="
                            font-size:11px;
                            color:var(--text-muted);
                        "
                    >
                        OS #${escaparHTML(os.id)}
                        —
                        ${escaparHTML(
                            os.problemaOriginal ||
                            os.servico ||
                            "Serviço"
                        )}
                    </div>

                </div>

            </div>

        `;
    });
}


/* ==========================================================
   23. CONFIGURAÇÕES
   ========================================================== */

function configurarTelaConfiguracoesWhiteLabel() {

    const form =
        obterElemento(
            "form-configuracoes"
        );


    const inputLogo =
        obterElemento(
            "input-config-logo"
        );


    if (inputLogo) {

        inputLogo.addEventListener(
            "change",
            function(event) {

                const arquivo =
                    event.target.files?.[0];


                if (!arquivo) {
                    return;
                }


                if (
                    !arquivo.type.startsWith(
                        "image/"
                    )
                ) {

                    alert(
                        "Selecione um arquivo de imagem."
                    );

                    inputLogo.value = "";

                    return;
                }


                if (
                    arquivo.size >
                    2 * 1024 * 1024
                ) {

                    alert(
                        "A imagem deve ter no máximo 2 MB."
                    );

                    inputLogo.value = "";

                    return;
                }


                const reader =
                    new FileReader();


                reader.onload = function(
                    readerEvent
                ) {

                    inputLogo.dataset.base64 =
                        readerEvent.target.result;
                };


                reader.readAsDataURL(
                    arquivo
                );
            }
        );
    }


    if (form) {

        form.addEventListener(
            "submit",
            function(event) {

                event.preventDefault();

                salvarConfiguracoes();
            }
        );
    }


    carregarConfiguracoes();
}


function carregarConfiguracoes() {

    const dados =
        getDados();


    const configuracoes =
        dados.settings;


    const inputSistema =
        obterElemento(
            "input-config-system"
        );


    const inputEmpresa =
        obterElemento(
            "input-config-empresa"
        );


    const inputCor =
        obterElemento(
            "input-config-color"
        );


    if (inputSistema) {

        inputSistema.value =
            configuracoes.systemName || "";
    }


    if (inputEmpresa) {

        inputEmpresa.value =
            configuracoes.companyName || "";
    }


    if (inputCor) {

        inputCor.value =
            configuracoes.primaryColor ||
            "#2563eb";
    }


    const inputLogo =
        obterElemento(
            "input-config-logo"
        );


    if (
        inputLogo &&
        configuracoes.logoBase64
    ) {

        inputLogo.dataset.base64 =
            configuracoes.logoBase64;
    }
}


function salvarConfiguracoes() {

    const dados =
        getDados();


    const systemName =
        obterElemento(
            "input-config-system"
        )?.value.trim() || "";


    const companyName =
        obterElemento(
            "input-config-empresa"
        )?.value.trim() || "";


    const primaryColor =
        obterElemento(
            "input-config-color"
        )?.value || "#2563eb";


    const inputLogo =
        obterElemento(
            "input-config-logo"
        );


    if (!systemName) {

        alert(
            "Informe o nome do sistema."
        );

        return;
    }


    if (!companyName) {

        alert(
            "Informe o nome da empresa."
        );

        return;
    }


    dados.settings.systemName =
        systemName;


    dados.settings.companyName =
        companyName;


    dados.settings.primaryColor =
        primaryColor;


    if (
        inputLogo?.dataset?.base64
    ) {

        dados.settings.logoBase64 =
            inputLogo.dataset.base64;
    }


    salvarDados(dados);


    aplicarConfiguracoesVisuaisInternas();

    aplicarWhiteLabelNoLogin();


    alert(
        "Personalização salva com sucesso."
    );
}


/* ==========================================================
   24. MODAIS
   ========================================================== */

function abrirModal(id) {

    const modal =
        obterElemento(id);


    if (!modal) {
        return;
    }


    modal.classList.remove(
        "hidden"
    );


    document.body.classList.add(
        "modal-open"
    );
}


window.abrirModal = abrirModal;


function fecharModal(id) {

    const modal =
        obterElemento(id);


    if (!modal) {
        return;
    }


    modal.classList.add(
        "hidden"
    );


    const modaisAbertos =
        document.querySelectorAll(
            ".modal-overlay:not(.hidden)"
        );


    if (modaisAbertos.length === 0) {

        document.body.classList.remove(
            "modal-open"
        );
    }
}


window.fecharModal = fecharModal;


function configurarFechamentoModais() {

    document
        .querySelectorAll(
            ".modal-overlay"
        )
        .forEach(modal => {

            modal.addEventListener(
                "click",
                function(event) {

                    if (
                        event.target ===
                        modal
                    ) {

                        modal.classList.add(
                            "hidden"
                        );
                    }
                }
            );
        });


    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key !==
                "Escape"
            ) {
                return;
            }


            document
                .querySelectorAll(
                    ".modal-overlay:not(.hidden)"
                )
                .forEach(modal => {

                    modal.classList.add(
                        "hidden"
                    );
                });


            document.body.classList.remove(
                "modal-open"
            );
        }
    );
}


/* ==========================================================
   25. ATUALIZAÇÃO GLOBAL
   ========================================================== */

window.atualizarSistema = function() {

    const sessao =
        obterSessao();


    if (!sessao) {
        return;
    }


    aplicarConfiguracoesVisuaisInternas();


    if (sessao.role === "admin") {

        atualizarDashboardAdmin();

        renderizarTabelaChamadosAdmin();

        renderizarTabelaOSAdmin();

        renderizarAgendaRotas();

        renderizarTabelaCondominios();

        renderizarTabelaEquipamentos();
    }


    if (sessao.role === "sindico") {

        atualizarPortalSindico();
    }


    if (sessao.role === "tecnico") {

        atualizarPortalTecnico(
            sessao.nome
        );
    }
};


/* ==========================================================
   26. COMPATIBILIDADE COM HTML INLINE
   ========================================================== */

window.filtrarChamados =
    window.filtrarChamados;

window.filtrarOS =
    window.filtrarOS;

window.mudarFiltroTecnico =
    window.mudarFiltroTecnico;

window.abrirAdminChamado =
    window.abrirAdminChamado;

window.converterChamadoParaOS =
    window.converterChamadoParaOS;

window.abrirVisualizacaoOS =
    window.abrirVisualizacaoOS;

window.abrirExecucaoOSMobile =
    window.abrirExecucaoOSMobile;

window.abrirAcompanhamentoSindico =
    window.abrirAcompanhamentoSindico;


/* ==========================================================
   FIM DO APP.JS
   ========================================================== */


/* ==========================================================
   ICONES.JS
   Ícones embutidos (SVG). Substituem a fonte externa
   "Material Symbols", então o sistema não depende de internet
   para exibir os ícones.

   Como usar no HTML:
     <span class="material-symbols-outlined">build</span>
   O nome dentro do span escolhe o ícone. Ícones criados depois
   (por exemplo, dentro de tabelas geradas pelo app.js) também
   são convertidos automaticamente.
   ========================================================== */

(function () {

    const CALENDARIO =
        '<rect x="3" y="5" width="18" height="16" rx="2"/>' +
        '<path d="M16 3v4M8 3v4M3 11h18"/>';

    const CAMERA =
        '<path d="M4 8h3l2-3h6l2 3h3v11H4z"/>' +
        '<circle cx="12" cy="13" r="3.5"/>';

    const PRANCHETA =
        '<rect x="5" y="4" width="14" height="17" rx="2"/>' +
        '<path d="M9 4h6v3H9z"/>';

    const ICONES = {

        add: '<path d="M12 5v14M5 12h14"/>',

        add_circle:
            '<circle cx="12" cy="12" r="9"/>' +
            '<path d="M12 8v8M8 12h8"/>',

        add_a_photo: CAMERA + '<path d="M12 11.5v3M10.5 13h3"/>',

        photo_camera: CAMERA,

        apartment:
            '<path d="M4 21V5l8-2v18"/>' +
            '<path d="M12 8h8v13"/>' +
            '<path d="M8 9h.01M8 13h.01M8 17h.01M16 12h.01M16 16h.01"/>' +
            '<path d="M3 21h18"/>',

        assignment:
            PRANCHETA + '<path d="M9 12h6M9 16h6"/>',

        assignment_turned_in:
            PRANCHETA + '<path d="M9 14l2 2 4-4"/>',

        build:
            '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>',

        calendar_month: CALENDARIO,

        today: CALENDARIO + '<path d="M8 15h3v3H8z"/>',

        event: CALENDARIO,

        event_available: CALENDARIO + '<path d="M9 16l2 2 4-4"/>',

        chevron_left: '<path d="M15 6l-6 6 6 6"/>',

        chevron_right: '<path d="M9 6l6 6-6 6"/>',

        close: '<path d="M6 6l12 12M18 6L6 18"/>',

        confirmation_number:
            '<path d="M3 6h18v3a2 2 0 0 0 0 6v3H3v-3a2 2 0 0 0 0-6z"/>' +
            '<path d="M13 8v1.5M13 11.25v1.5M13 14.5V16"/>',

        construction:
            '<path d="M4 20h16"/>' +
            '<path d="M6 20l2-9h8l2 9"/>' +
            '<path d="M9 11l1-6h4l1 6"/>',

        dashboard:
            '<rect x="3" y="3" width="7" height="9" rx="1"/>' +
            '<rect x="14" y="3" width="7" height="5" rx="1"/>' +
            '<rect x="14" y="12" width="7" height="9" rx="1"/>' +
            '<rect x="3" y="16" width="7" height="5" rx="1"/>',

        engineering:
            '<circle cx="12" cy="9" r="3"/>' +
            '<path d="M6 20a6 6 0 0 1 12 0"/>' +
            '<path d="M8.5 6.5h7"/>',

        groups:
            '<circle cx="9" cy="8" r="3"/>' +
            '<path d="M3 20a6 6 0 0 1 12 0"/>' +
            '<circle cx="17" cy="9" r="2.5"/>' +
            '<path d="M17 14a4.5 4.5 0 0 1 4.5 4.5"/>',

        help:
            '<circle cx="12" cy="12" r="9"/>' +
            '<path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 .9-1 1.7"/>' +
            '<path d="M12 17h.01"/>',

        home:
            '<path d="M3 11l9-8 9 8"/>' +
            '<path d="M5 10v10h5v-6h4v6h5V10"/>',

        inbox:
            '<path d="M3 13l3-8h12l3 8v6H3z"/>' +
            '<path d="M3 13h5l1 3h6l1-3h5"/>',

        info:
            '<circle cx="12" cy="12" r="9"/>' +
            '<path d="M12 11v6M12 7.5h.01"/>',

        list_alt:
            '<rect x="3" y="4" width="18" height="16" rx="2"/>' +
            '<path d="M8 9h8M8 13h8M8 17h5"/>',

        lock:
            '<rect x="5" y="11" width="14" height="10" rx="2"/>' +
            '<path d="M8 11V8a4 4 0 0 1 8 0v3"/>',

        logout:
            '<path d="M9 21H5V3h4"/>' +
            '<path d="M16 17l5-5-5-5M21 12H9"/>',

        menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',

        notifications:
            '<path d="M6 16v-5a6 6 0 0 1 12 0v5l2 2H4z"/>' +
            '<path d="M10 21h4"/>',

        play_arrow: '<path d="M7 4l13 8-13 8z"/>',

        precision_manufacturing:
            '<circle cx="12" cy="12" r="4"/>' +
            '<path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9L7 7M17 17l2.1 2.1M19.1 4.9L17 7M7 17l-2.1 2.1"/>',

        priority_high: '<path d="M12 4v10M12 19h.01"/>',

        save:
            '<path d="M5 3h11l4 4v14H5z"/>' +
            '<path d="M8 3v5h7V3M8 21v-7h8v7"/>',

        schedule:
            '<circle cx="12" cy="12" r="9"/>' +
            '<path d="M12 7v5l3 2"/>',

        search:
            '<circle cx="11" cy="11" r="7"/>' +
            '<path d="M20 20l-4-4"/>',

        send:
            '<path d="M22 2L11 13"/>' +
            '<path d="M22 2l-7 20-4-9-9-4z"/>',

        settings:
            '<path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0"/>' +
            '<circle cx="16" cy="6" r="2"/>' +
            '<circle cx="10" cy="12" r="2"/>' +
            '<circle cx="18" cy="18" r="2"/>',

        task_alt:
            '<circle cx="12" cy="12" r="9"/>' +
            '<path d="M8 12l3 3 5-6"/>'
    };

    const ICONE_PADRAO = '<circle cx="12" cy="12" r="9"/>';


    function montarSVG(conteudo) {
        return (
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" ' +
            'width="1em" height="1em" fill="none" stroke="currentColor" ' +
            'stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" ' +
            'aria-hidden="true" focusable="false">' + conteudo + '</svg>'
        );
    }


    function converterIcone(elemento) {

        if (elemento.querySelector("svg")) {
            return;
        }

        const nome = elemento.textContent.trim();

        if (!nome) {
            return;
        }

        elemento.setAttribute("data-icone", nome);
        elemento.setAttribute("aria-hidden", "true");
        elemento.innerHTML = montarSVG(ICONES[nome] || ICONE_PADRAO);
    }


    function converterTodos(raiz) {

        const base = raiz && raiz.querySelectorAll ? raiz : document;

        if (
            base.matches &&
            base.matches(".material-symbols-outlined")
        ) {
            converterIcone(base);
        }

        base
            .querySelectorAll(".material-symbols-outlined")
            .forEach(converterIcone);
    }


    document.addEventListener("DOMContentLoaded", () => {

        converterTodos(document);

        /* Ícones criados depois pelo app.js (tabelas, cards, modais) */
        const observador = new MutationObserver(mutacoes => {

            mutacoes.forEach(mutacao => {

                mutacao.addedNodes.forEach(no => {
                    if (no.nodeType === 1) {
                        converterTodos(no);
                    }
                });

                /* Caso o app.js troque o texto de um ícone existente */
                if (
                    mutacao.type === "childList" &&
                    mutacao.target.nodeType === 1 &&
                    mutacao.target.classList.contains("material-symbols-outlined")
                ) {
                    converterIcone(mutacao.target);
                }
            });
        });

        observador.observe(document.body, {
            childList: true,
            subtree: true
        });
    });

})();
