// Variável Global para simular o Técnico logado
const TÉCNICO_LOGADO = "João Silva";
let osTecnicoAberta = null; // Armazena a OS que o técnico abriu no celular

document.addEventListener('DOMContentLoaded', () => {
    inicializarSistema();
    configurarNavegacao();
    configurarMenuMobile();
    configurarSeletorPerfil();
    configurarModuloPortalSindico();
    configurarModuloChamados();
    configurarModuloOS();
    configurarModuloAgendaRotas();
});

window.irParaTela = function(tela) {
    const link = document.querySelector(`.nav-item[data-page="${tela}"]`);
    if(link) link.click();
};

function inicializarSistema() {
    if (!localStorage.getItem('mp_data')) {
        const emptyData = {
            settings: { companyName: "Manutenção Pro", primaryColor: "#1e40af" },
            chamados: [
                { id: 101, condominio: "Residencial Jardim das Palmeiras", local: "Piscina", categoria: "Bombas", problema: "Bomba fazendo barulho", prioridade: "Alta", status: "Novo", data: new Date().toLocaleDateString('pt-BR') }
            ], 
            ordensServico: [
                { id: 1048, chamadoId: null, condominio: "Residencial Jardim das Palmeiras", servico: "Manutenção da bomba principal", dataFormatoEN: new Date().toISOString().split('T')[0], data: new Date().toLocaleDateString('pt-BR'), hora: "14:00", tecnico: TÉCNICO_LOGADO, status: "Agendada", diagnostico: "", materiais: "" },
                { id: 1051, chamadoId: null, condominio: "Condomínio Solar", servico: "Inspeção elétrica", dataFormatoEN: new Date().toISOString().split('T')[0], data: new Date().toLocaleDateString('pt-BR'), hora: "16:00", tecnico: TÉCNICO_LOGADO, status: "Em andamento", diagnostico: "", materiais: "" }
            ], 
            condominios: [
                { id: 1, nome: "Residencial Jardim das Palmeiras", endereco: "Av. Beira Rio, 1000", sindico: "João Siqueira", telefone: "(81) 99888-7766", email: "joao.sindico@email.com", status: "Ativo" },
                { id: 2, nome: "Condomínio Solar", endereco: "Rua das Flores, 45", sindico: "Carlos Alberto", telefone: "(81) 99777-6655", email: "carlos@solar.com", status: "Ativo" }
            ], 
            equipamentos: [], preventivas: [], documentos: [], materiais: []
        };
        localStorage.setItem('mp_data', JSON.stringify(emptyData));
    }
    aplicarConfiguracoesVisuais();
}

function getDados() { return JSON.parse(localStorage.getItem('mp_data')); }
function salvarDados(dados) { localStorage.setItem('mp_data', JSON.stringify(dados)); }

function aplicarConfiguracoesVisuais() {
    const dados = getDados();
    if(!dados || !dados.settings) return;
    document.documentElement.style.setProperty('--primary-color', dados.settings.primaryColor);
    const displayNome = document.getElementById('company-name-display');
    if(displayNome) displayNome.textContent = dados.settings.companyName;
    document.title = `${dados.settings.companyName} | Sistema de Gestão`;
}

function configurarSeletorPerfil() {
    const seletor = document.getElementById('seletor-perfil-usuario');
    if(!seletor) return;
    seletor.addEventListener('change', (e) => {
        aplicarRegraPerfil(e.target.value);
    });
}

function aplicarRegraPerfil(perfil) {
    const menuAdmin = document.getElementById('menu-admin');
    const menuSindico = document.getElementById('menu-sindico');
    const menuTecnico = document.getElementById('menu-tecnico');

    menuAdmin.classList.add('hidden');
    menuSindico.classList.add('hidden');
    menuTecnico.classList.add('hidden');

    if (perfil === 'sindico') {
        menuSindico.classList.remove('hidden');
        irParaTela('sindico-inicio');
        atualizarPortalSindico();
    } else if (perfil === 'tecnico') {
        menuTecnico.classList.remove('hidden');
        irParaTela('tecnico-inicio');
        atualizarPortalTecnico();
    } else {
        menuAdmin.classList.remove('hidden');
        irParaTela('dashboard');
    }
}

function configurarNavegacao() {
    const navItems = document.querySelectorAll('.nav-item');
    const pageViews = document.querySelectorAll('.page-view');

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const targetPage = item.getAttribute('data-page');

            navItems.forEach(nav => nav.classList.remove('active'));
            pageViews.forEach(page => page.classList.add('hidden'));

            item.classList.add('active');
            const paginaAlvo = document.getElementById(`page-${targetPage}`);
            if(paginaAlvo) paginaAlvo.classList.remove('hidden');
            
            const sidebar = document.getElementById('sidebar');
            if(sidebar) sidebar.classList.remove('open');
            
            if(['tecnico-inicio', 'tecnico-os'].includes(targetPage)) {
                atualizarPortalTecnico();
            }
        });
    });
}

function configurarMenuMobile() {
    const btn = document.getElementById('mobile-menu-btn');
    if(btn) btn.addEventListener('click', () => document.getElementById('sidebar').classList.toggle('open'));
}

// =======================================================
// PORTAL DO TÉCNICO (MOBILE-FIRST)
// =======================================================
function atualizarPortalTecnico() {
    const dados = getDados();
    const hojeIso = new Date().toISOString().split('T')[0];
    
    // Puxar apenas OS do técnico logado
    const ordens = dados.ordensServico.filter(os => os.tecnico === TÉCNICO_LOGADO);

    // Cálculos da Tela Início
    const osHoje = ordens.filter(os => os.dataFormatoEN === hojeIso && os.status !== 'Concluída');
    const osAndamento = ordens.filter(os => os.status === 'Em andamento');
    const osConcluidas = ordens.filter(os => os.status === 'Concluída');

    if(document.getElementById('tec-count-hoje')) document.getElementById('tec-count-hoje').textContent = osHoje.length;
    if(document.getElementById('tec-count-andamento')) document.getElementById('tec-count-andamento').textContent = osAndamento.length;
    if(document.getElementById('tec-count-concluidas')) document.getElementById('tec-count-concluidas').textContent = osConcluidas.length;

    // Lógica do Próximo Atendimento (A mais próxima que não está concluída)
    const proximoContainer = document.getElementById('tec-proximo-atendimento');
    if(proximoContainer) {
        proximoContainer.innerHTML = '';
        
        let proximas = ordens.filter(os => os.status !== 'Concluída').sort((a,b) => {
            const dataA = a.dataFormatoEN + " " + (a.hora || '00:00');
            const dataB = b.dataFormatoEN + " " + (b.hora || '00:00');
            return dataA.localeCompare(dataB);
        });

        if(proximas.length > 0) {
            const prox = proximas[0];
            let badge = prox.status === 'Em andamento' ? 'badge-status-andamento' : 'badge-status-aberta';
            
            proximoContainer.innerHTML = `
                <div class="card clickable-card" style="border-left: 6px solid var(--primary-color); padding: 18px;" onclick="abrirExecucaoOSTecnico(${prox.id})">
                    <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom: 12px;">
                        <span style="font-size:24px; font-weight:700; color:var(--primary-color);">${prox.hora || '08:00'}</span>
                        <span class="badge ${badge}">${prox.status}</span>
                    </div>
                    <p style="font-size:16px; font-weight:700; color:var(--text-main); margin-bottom:2px;">${prox.condominio}</p>
                    <p style="font-size:14px; color:var(--text-muted); margin-bottom: 16px;">${prox.servico}</p>
                    <button class="btn btn-primary btn-block" style="margin-bottom:0;">VER OS</button>
                </div>
            `;
        } else {
            proximoContainer.innerHTML = `
                <div class="card" style="text-align:center; padding: 24px;">
                    <span class="material-symbols-outlined text-success" style="font-size: 32px; margin-bottom:8px;">task_alt</span>
                    <p style="color:var(--text-main); font-weight:600;">Você não possui pendências.</p>
                    <p style="font-size:13px; color:var(--text-muted);">Bom trabalho hoje!</p>
                </div>
            `;
        }
    }

    // Processa a renderização da aba "Minhas OS" com o filtro atual ativo
    const btnAtivo = document.querySelector('#page-tecnico-os .filter-tab.active');
    const filtro = btnAtivo ? btnAtivo.textContent.trim() : 'Hoje';
    renderizarListaOSTecnico(filtro);
}

window.mudarFiltroTecnico = function(filtro) {
    // Muda a aba se não estiver nela
    irParaTela('tecnico-os');

    // Atualiza botões
    const abas = document.querySelectorAll('#page-tecnico-os .filter-tab');
    abas.forEach(t => {
        t.classList.remove('active');
        if(t.textContent.trim() === filtro || 
          (filtro === 'Em andamento' && t.textContent.trim() === 'Andamento') ||
          (filtro === 'Concluída' && t.textContent.trim() === 'Concluídas')
        ) {
            t.classList.add('active');
        }
    });

    renderizarListaOSTecnico(filtro);
};

function renderizarListaOSTecnico(filtro) {
    const dados = getDados();
    const container = document.getElementById('container-tec-lista-os');
    if(!container) return;

    const hojeIso = new Date().toISOString().split('T')[0];
    let ordens = dados.ordensServico.filter(os => os.tecnico === TÉCNICO_LOGADO);

    if (filtro === 'Hoje') {
        ordens = ordens.filter(os => os.dataFormatoEN === hojeIso);
    } else if (filtro === 'Próximas') {
        ordens = ordens.filter(os => os.dataFormatoEN > hojeIso && os.status !== 'Concluída');
    } else if (filtro === 'Em andamento') {
        ordens = ordens.filter(os => os.status === 'Em andamento');
    } else if (filtro === 'Concluída') {
        ordens = ordens.filter(os => os.status === 'Concluída');
    }

    container.innerHTML = '';

    if(ordens.length === 0) {
        container.innerHTML = `<p style="text-align:center; color:var(--text-muted); margin-top:20px;">Nenhuma OS encontrada para este filtro.</p>`;
        return;
    }

    ordens.sort((a,b) => (a.dataFormatoEN + a.hora).localeCompare(b.dataFormatoEN + b.hora));

    ordens.forEach(os => {
        let badge = 'badge-status-aberta';
        if(os.status === 'Concluída') badge = 'badge-status-concluida';
        if(os.status === 'Em andamento') badge = 'badge-status-andamento';
        if(os.status === 'Atrasada') badge = 'badge-status-atrasada';

        container.innerHTML += `
            <div class="task-card" onclick="abrirExecucaoOSTecnico(${os.id})" style="cursor:pointer;">
                <div class="task-header">
                    <span class="task-id">OS #${os.id}</span>
                    <span class="badge ${badge}">${os.status}</span>
                </div>
                <div class="task-info">
                    <p style="font-size:12px; color:var(--text-muted); margin-bottom:2px;">${os.data} às ${os.hora || '08:00'}</p>
                    <p class="title">${os.condominio}</p>
                    <p class="desc">${os.servico}</p>
                </div>
            </div>
        `;
    });
}

// =======================================================
// FLUXO DE EXECUÇÃO DE OS (MOBILE-FIRST)
// =======================================================
window.abrirExecucaoOSTecnico = function(id) {
    const dados = getDados();
    const os = dados.ordensServico.find(o => o.id == id);
    if(!os) return;

    osTecnicoAberta = os;

    // Puxa endereço do condomínio
    const condObj = dados.condominios.find(c => c.nome === os.condominio);
    const endereco = condObj ? condObj.endereco : 'Endereço não cadastrado';

    document.getElementById('tec-modal-titulo').textContent = `OS #${os.id}`;
    document.getElementById('tec-os-condominio').textContent = os.condominio;
    document.getElementById('tec-os-endereco').textContent = endereco;
    document.getElementById('tec-os-servico').textContent = os.servico;
    document.getElementById('tec-os-horario').textContent = `${os.data} às ${os.hora || '08:00'}`;

    const containerBotoes = document.getElementById('tec-os-botoes-acao');
    containerBotoes.innerHTML = '';

    if (os.status === 'Concluída') {
        containerBotoes.innerHTML = `
            <div style="background:#f0fdf4; padding:16px; border:1px solid #bbf7d0; border-radius:var(--radius); margin-bottom:16px;">
                <p style="color:#166534; font-weight:700; margin-bottom:6px;">Serviço Finalizado</p>
                <p style="font-size:13px; color:var(--text-main);">${os.diagnostico}</p>
            </div>
        `;
    } else if (os.status === 'Em andamento') {
        containerBotoes.innerHTML = `
            <button class="btn btn-ghost btn-block" onclick="alert('Registro de observação gravado com sucesso!')"><span class="material-symbols-outlined">edit_note</span> REGISTRAR OBSERVAÇÃO</button>
            <button class="btn btn-ghost btn-block" onclick="alert('Funcionalidade de câmera iniciada.')"><span class="material-symbols-outlined">photo_camera</span> ADICIONAR FOTO</button>
            <button class="btn btn-ghost btn-block" onclick="alert('Estoque aberto para vínculo.')"><span class="material-symbols-outlined">inventory_2</span> ADICIONAR MATERIAL</button>
            
            <button class="btn btn-success btn-block" style="margin-top: 24px;" onclick="irParaFinalizacaoOSTecnico()">
                <span class="material-symbols-outlined">task_alt</span> FINALIZAR SERVIÇO
            </button>
        `;
    } else {
        // Agendada ou Atrasada
        containerBotoes.innerHTML = `
            <button class="btn btn-primary btn-block" style="height: 54px; font-size: 16px; font-weight:700;" onclick="iniciarOSTecnico(${os.id})">
                <span class="material-symbols-outlined">play_circle</span> INICIAR ATENDIMENTO
            </button>
        `;
    }

    // Resetar visões
    document.getElementById('tec-os-informacoes').classList.remove('hidden');
    document.getElementById('tec-os-finalizacao').classList.add('hidden');

    document.getElementById('modal-execucao-os-tecnico').classList.remove('hidden');
};

window.fecharExecucaoOS = function() {
    document.getElementById('modal-execucao-os-tecnico').classList.add('hidden');
};

window.iniciarOSTecnico = function(id) {
    const dados = getDados();
    const os = dados.ordensServico.find(o => o.id == id);
    if(os) {
        os.status = 'Em andamento';
        salvarDados(dados);
        abrirExecucaoOSTecnico(id); // Recarrega com os novos botões
        atualizarPortalTecnico();
    }
};

window.irParaFinalizacaoOSTecnico = function() {
    document.getElementById('tec-os-informacoes').classList.add('hidden');
    document.getElementById('tec-os-finalizacao').classList.remove('hidden');
};

window.voltarParaInformacoesOS = function() {
    document.getElementById('tec-os-finalizacao').classList.add('hidden');
    document.getElementById('tec-os-informacoes').classList.remove('hidden');
};

window.confirmarConclusaoOS = function() {
    const diag = document.getElementById('tec-input-diag').value;
    if(!diag || diag.trim() === '') {
        alert("Obrigatório: Descreva o serviço realizado / diagnóstico.");
        return;
    }

    const mat = document.getElementById('tec-input-materiais').value;
    const obs = document.getElementById('tec-input-obs').value;

    const dados = getDados();
    const os = dados.ordensServico.find(o => o.id == osTecnicoAberta.id);
    if(os) {
        os.diagnostico = diag + (obs ? `\nObs: ${obs}` : '');
        os.materiais = mat;
        os.status = 'Concluída';
        salvarDados(dados);
        
        fecharExecucaoOS();
        document.getElementById('tec-input-diag').value = '';
        document.getElementById('tec-input-materiais').value = '';
        document.getElementById('tec-input-obs').value = '';
        
        alert("Excelente! Ordem de serviço finalizada e transmitida.");
        atualizarPortalTecnico();
    }
};

// DEMAIS MÓDULOS DE SUPORTE MANTIDOS PARA O ADMIN E SÍNDICO
function configurarModuloChamados() {}
function renderizarTabelaChamados() {}
function configurarModuloOS() {}
function renderizarTabelaOS() {}
function configurarModuloAgendaRotas() {}
function configurarModuloCondominios() {}
function configurarModuloEquipamentos() {}
function configurarModuloPreventivas() {}
function configurarModuloPortalSindico() {}
function atualizarPortalSindico() {}