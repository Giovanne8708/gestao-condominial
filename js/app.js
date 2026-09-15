document.addEventListener('DOMContentLoaded', () => {
    inicializarSistema();
    configurarNavegacao();
    configurarMenuMobile();
    configurarTelaConfiguracoes();
    configurarModuloChamados();
    configurarModuloOS();
    configurarModuloTecnico(); // Novo Módulo
});

// ==========================================
// INICIALIZAÇÃO E BANCO DE DADOS
// ==========================================
function inicializarSistema() {
    if (!localStorage.getItem('mp_data')) {
        if (typeof mockData !== 'undefined') {
            localStorage.setItem('mp_data', JSON.stringify(mockData));
        } else {
            const emptyData = {
                settings: { companyName: "Manutenção Pro", primaryColor: "#2563eb" },
                chamados: [],
                ordensServico: []
            };
            localStorage.setItem('mp_data', JSON.stringify(emptyData));
        }
    }
    
    const dados = getDados();
    let precisaSalvar = false;
    if(!dados.chamados) { dados.chamados = []; precisaSalvar = true; }
    if(!dados.ordensServico) { dados.ordensServico = []; precisaSalvar = true; }
    if(precisaSalvar) salvarDados(dados);

    aplicarConfiguracoesVisuais();
    atualizarDashboard();
}

function getDados() { return JSON.parse(localStorage.getItem('mp_data')); }
function salvarDados(dados) { 
    localStorage.setItem('mp_data', JSON.stringify(dados)); 
    atualizarDashboard();
}

function aplicarConfiguracoesVisuais() {
    const dados = getDados();
    const settings = dados.settings;
    document.documentElement.style.setProperty('--primary-color', settings.primaryColor);
    document.getElementById('company-name-display').textContent = settings.companyName;
    document.title = `${settings.companyName} | Sistema de Gestão`;
    document.getElementById('company-logo-placeholder').textContent = settings.companyName.substring(0, 2).toUpperCase();
}

// ==========================================
// NAVEGAÇÃO E LAYOUT
// ==========================================
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
            document.getElementById(`page-${targetPage}`).classList.remove('hidden');
            document.getElementById('sidebar').classList.remove('open');
            
            if(targetPage === 'chamados') renderizarTabelaChamados();
            if(targetPage === 'os') renderizarTabelaOS();
            if(targetPage === 'tecnico') renderizarAgendaTecnico(); // Carrega tela do técnico
        });
    });
}

function configurarMenuMobile() {
    const btn = document.getElementById('mobile-menu-btn');
    const sidebar = document.getElementById('sidebar');
    btn.addEventListener('click', () => sidebar.classList.toggle('open'));
}

function atualizarDashboard() {
    const dados = getDados();
    if(!dados.ordensServico) return;

    const totalAbertas = dados.ordensServico.filter(os => os.status === 'Aberta').length;
    const totalAndamento = dados.ordensServico.filter(os => os.status === 'Em andamento').length;
    const totalAtrasadas = dados.ordensServico.filter(os => os.status === 'Atrasada').length;

    document.getElementById('count-os').textContent = totalAbertas;
    document.getElementById('count-andamento').textContent = totalAndamento;
    document.getElementById('count-atrasadas').textContent = totalAtrasadas;
}

function configurarTelaConfiguracoes() {
    const dados = getDados();
    document.getElementById('input-company-name').value = dados.settings.companyName;
    document.getElementById('input-primary-color').value = dados.settings.primaryColor;

    document.getElementById('btn-save-settings').addEventListener('click', () => {
        dados.settings.companyName = document.getElementById('input-company-name').value;
        dados.settings.primaryColor = document.getElementById('input-primary-color').value;
        salvarDados(dados);
        aplicarConfiguracoesVisuais();
        alert("Configurações salvas com sucesso!");
    });
}

// ==========================================
// MÓDULO DE CHAMADOS
// ==========================================
function configurarModuloChamados() {
    const modalNovo = document.getElementById('modal-novo-chamado');
    const formNovo = document.getElementById('form-novo-chamado');

    document.getElementById('btn-abrir-modal-chamado').addEventListener('click', () => modalNovo.classList.remove('hidden'));

    const fecharModal = () => { modalNovo.classList.add('hidden'); formNovo.reset(); };

    document.getElementById('btn-fechar-modal-chamado').addEventListener('click', fecharModal);
    document.getElementById('btn-cancelar-chamado').addEventListener('click', (e) => { e.preventDefault(); fecharModal(); });

    formNovo.addEventListener('submit', (e) => {
        e.preventDefault(); 
        const dados = getDados();
        const novoId = dados.chamados.length > 0 ? Math.max(...dados.chamados.map(c => c.id)) + 1 : 1;
        
        dados.chamados.push({
            id: novoId,
            condominio: document.getElementById('input-chamado-condominio').value,
            problema: document.getElementById('input-chamado-problema').value,
            prioridade: document.getElementById('input-chamado-prioridade').value,
            status: "Novo" 
        });

        salvarDados(dados);
        renderizarTabelaChamados();
        fecharModal();
    });
}

function renderizarTabelaChamados() {
    const dados = getDados();
    const tbody = document.querySelector('#tabela-chamados tbody');
    if(!tbody) return;
    
    tbody.innerHTML = ''; 
    if (dados.chamados.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color: var(--text-muted);">Nenhum chamado registrado.</td></tr>`;
        return;
    }

    [...dados.chamados].reverse().forEach(chamado => {
        const tr = document.createElement('tr');
        let badgeStatus = 'badge-status-novo';
        if (chamado.status === 'Em análise') badgeStatus = 'badge-status-analise';
        if (chamado.status === 'Convertido em OS') badgeStatus = 'badge-status-aprovado';
        
        let badgePrioridade = 'badge-prio-normal';
        if (chamado.prioridade === 'Alta') badgePrioridade = 'badge-prio-alta';
        if (chamado.prioridade === 'Urgente') badgePrioridade = 'badge-prio-urgente';

        tr.innerHTML = `
            <td>#${chamado.id}</td>
            <td><strong>${chamado.condominio}</strong></td>
            <td>${chamado.problema}</td>
            <td><span class="badge ${badgePrioridade}">${chamado.prioridade}</span></td>
            <td><span class="badge ${badgeStatus}">${chamado.status}</span></td>
            <td style="text-align: right;"><button class="icon-btn"><span class="material-symbols-outlined">visibility</span></button></td>
        `;
        tbody.appendChild(tr);
    });
}

// ==========================================
// MÓDULO DE ORDENS DE SERVIÇO (OS)
// ==========================================
function configurarModuloOS() {
    const modalOS = document.getElementById('modal-nova-os');
    const formOS = document.getElementById('form-nova-os');
    const selectChamado = document.getElementById('input-os-chamado');
    const inputCondominio = document.getElementById('input-os-condominio');
    const inputServico = document.getElementById('input-os-servico');

    document.getElementById('btn-abrir-modal-os').addEventListener('click', () => {
        const dados = getDados();
        selectChamado.innerHTML = '<option value="">Nenhum (Criar OS Avulsa)</option>';
        
        const chamadosAbertos = dados.chamados.filter(c => c.status !== 'Convertido em OS');
        chamadosAbertos.forEach(c => {
            const option = document.createElement('option');
            option.value = c.id;
            option.textContent = `#${c.id} - ${c.condominio} (${c.problema.substring(0, 30)}...)`;
            selectChamado.appendChild(option);
        });
        modalOS.classList.remove('hidden');
    });

    selectChamado.addEventListener('change', (e) => {
        const chamadoId = e.target.value;
        if(chamadoId) {
            const chamado = getDados().chamados.find(c => c.id == chamadoId);
            if(chamado) {
                inputCondominio.value = chamado.condominio;
                inputServico.value = chamado.problema;
            }
        } else {
            inputCondominio.value = '';
            inputServico.value = '';
        }
    });

    const fecharModal = () => { modalOS.classList.add('hidden'); formOS.reset(); };
    document.getElementById('btn-fechar-modal-os').addEventListener('click', fecharModal);
    document.getElementById('btn-cancelar-os').addEventListener('click', (e) => { e.preventDefault(); fecharModal(); });

    formOS.addEventListener('submit', (e) => {
        e.preventDefault(); 
        const dados = getDados();
        if (!dados.ordensServico) dados.ordensServico = [];
        
        let novoId = 1001;
        if (dados.ordensServico.length > 0) novoId = Math.max(...dados.ordensServico.map(os => os.id)) + 1;
        
        const chamadoIdVinculado = selectChamado.value;
        dados.ordensServico.push({
            id: novoId,
            chamadoId: chamadoIdVinculado || null,
            condominio: inputCondominio.value,
            servico: inputServico.value,
            tecnico: document.getElementById('input-os-tecnico').value,
            status: document.getElementById('input-os-status').value,
            diagnostico: ""
        });

        if(chamadoIdVinculado) {
            const index = dados.chamados.findIndex(c => c.id == chamadoIdVinculado);
            if(index !== -1) dados.chamados[index].status = 'Convertido em OS';
        }

        salvarDados(dados);
        renderizarTabelaOS();
        renderizarTabelaChamados();
        fecharModal();
    });
}

function renderizarTabelaOS() {
    const dados = getDados();
    const tbody = document.querySelector('#tabela-os tbody');
    if(!tbody) return;
    
    tbody.innerHTML = ''; 
    if (!dados.ordensServico || dados.ordensServico.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color: var(--text-muted);">Nenhuma OS registrada.</td></tr>`;
        return;
    }

    [...dados.ordensServico].reverse().forEach(os => {
        const tr = document.createElement('tr');
        
        let badgeStatus = 'badge-status-aberta';
        if (os.status === 'Agendada') badgeStatus = 'badge-status-agendada'; 
        if (os.status === 'Em andamento') badgeStatus = 'badge-status-andamento'; 
        if (os.status === 'Concluída') badgeStatus = 'badge-status-concluida'; 
        if (os.status === 'Atrasada') badgeStatus = 'badge-status-atrasada'; 

        const linkChamado = os.chamadoId ? `<br><small style="color:var(--text-muted);">Ref: Chamado #${os.chamadoId}</small>` : '';

        tr.innerHTML = `
            <td>#${os.id}</td>
            <td><strong>${os.condominio}</strong></td>
            <td>${os.servico} ${linkChamado}</td>
            <td>${os.tecnico}</td>
            <td><span class="badge ${badgeStatus}">${os.status}</span></td>
            <td style="text-align: right;"><button class="icon-btn"><span class="material-symbols-outlined">visibility</span></button></td>
        `;
        tbody.appendChild(tr);
    });
}

// ==========================================
// MÓDULO DO TÉCNICO (Mobile view / Interação)
// ==========================================
function configurarModuloTecnico() {
    const selectTecnico = document.getElementById('simulador-tecnico');
    
    // Quando alterar o técnico no dropdown, re-renderiza a lista de cards
    selectTecnico.addEventListener('change', renderizarAgendaTecnico);

    // Modal de Execução
    const modalExec = document.getElementById('modal-executar-os');
    const btnFechar = document.getElementById('btn-fechar-modal-exec');
    const btnIniciar = document.getElementById('btn-iniciar-servico');
    const btnFinalizar = document.getElementById('btn-finalizar-servico');

    const fecharModalExec = () => { modalExec.classList.add('hidden'); };
    btnFechar.addEventListener('click', fecharModalExec);

    // Lógica para INICIAR serviço
    btnIniciar.addEventListener('click', () => {
        atualizarStatusOSTecnico('Em andamento');
    });

    // Lógica para FINALIZAR serviço
    btnFinalizar.addEventListener('click', () => {
        const diagnostico = document.getElementById('exec-os-diagnostico').value;
        if(diagnostico.trim() === '') {
            alert('Por favor, preencha o campo de diagnóstico/serviço realizado antes de finalizar.');
            return;
        }
        atualizarStatusOSTecnico('Concluída', diagnostico);
        fecharModalExec();
    });
}

function atualizarStatusOSTecnico(novoStatus, diagnostico = "") {
    const osId = document.getElementById('exec-os-id').value;
    const dados = getDados();
    
    const osIndex = dados.ordensServico.findIndex(os => os.id == osId);
    if(osIndex !== -1) {
        dados.ordensServico[osIndex].status = novoStatus;
        if(diagnostico !== "") {
            dados.ordensServico[osIndex].diagnostico = diagnostico;
        }
        salvarDados(dados);
        renderizarAgendaTecnico();
        
        // Atualiza botões no modal imediatamente se apenas Iniciar
        if(novoStatus === 'Em andamento') {
            document.getElementById('btn-iniciar-servico').style.display = 'none';
        }
    }
}

// Função global para ser chamada pelo HTML gerado via JS
window.abrirModalExecutarOS = function(osId) {
    const os = getDados().ordensServico.find(o => o.id == osId);
    if(!os) return;

    document.getElementById('exec-os-id').value = os.id;
    document.getElementById('exec-os-title').textContent = `OS #${os.id} - ${os.condominio}`;
    document.getElementById('exec-os-servico').textContent = os.servico;
    document.getElementById('exec-os-diagnostico').value = os.diagnostico || "";

    // Esconde o botão de Iniciar se já estiver em andamento ou concluída
    const btnIniciar = document.getElementById('btn-iniciar-servico');
    const btnFinalizar = document.getElementById('btn-finalizar-servico');
    const inputDiag = document.getElementById('exec-os-diagnostico');

    if(os.status === 'Concluída') {
        btnIniciar.style.display = 'none';
        btnFinalizar.style.display = 'none';
        inputDiag.disabled = true;
    } else if (os.status === 'Em andamento') {
        btnIniciar.style.display = 'none';
        btnFinalizar.style.display = 'block';
        inputDiag.disabled = false;
    } else {
        // Aberta / Agendada
        btnIniciar.style.display = 'block';
        btnFinalizar.style.display = 'block';
        inputDiag.disabled = false;
    }

    document.getElementById('modal-executar-os').classList.remove('hidden');
};

function renderizarAgendaTecnico() {
    const dados = getDados();
    const container = document.getElementById('lista-os-tecnico');
    if(!container) return;
    container.innerHTML = '';

    const tecnicoFiltro = document.getElementById('simulador-tecnico').value;

    let ordens = dados.ordensServico || [];
    
    // Filtra pelo técnico se não for "Todos"
    if(tecnicoFiltro !== 'Todos') {
        ordens = ordens.filter(os => os.tecnico === tecnicoFiltro);
    }

    if (ordens.length === 0) {
        container.innerHTML = `<p style="color: var(--text-muted); width: 100%;">Nenhuma OS designada para este filtro.</p>`;
        return;
    }

    ordens.forEach(os => {
        // Cores dos status para o Card
        let badgeStatus = 'badge-status-aberta';
        if (os.status === 'Agendada') badgeStatus = 'badge-status-agendada'; 
        if (os.status === 'Em andamento') badgeStatus = 'badge-status-andamento'; 
        if (os.status === 'Concluída') badgeStatus = 'badge-status-concluida'; 

        const card = document.createElement('div');
        card.className = 'task-card';
        card.innerHTML = `
            <div class="task-header">
                <span class="task-id">OS #${os.id}</span>
                <span class="badge ${badgeStatus}">${os.status}</span>
            </div>
            <div class="task-info">
                <p class="title">${os.condominio}</p>
                <p class="desc">${os.servico}</p>
            </div>
            <div class="task-footer">
                <button class="btn btn-primary" style="width: 100%;" onclick="abrirModalExecutarOS(${os.id})">
                    Visualizar e Executar
                </button>
            </div>
        `;
        container.appendChild(card);
    });
}