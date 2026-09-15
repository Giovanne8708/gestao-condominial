document.addEventListener('DOMContentLoaded', () => {
    inicializarSistema();
    configurarNavegacao();
    configurarMenuMobile();
    configurarTelaConfiguracoes();
    configurarModuloChamados();
    configurarModuloOS();
    configurarModuloTecnico();
    configurarModuloAgenda(); // Novo Módulo
});

// ==========================================
// INICIALIZAÇÃO E BANCO DE DADOS
// ==========================================
function inicializarSistema() {
    if (!localStorage.getItem('mp_data')) {
        const emptyData = {
            settings: { companyName: "Manutenção Pro", primaryColor: "#2563eb" },
            chamados: [], ordensServico: []
        };
        localStorage.setItem('mp_data', JSON.stringify(emptyData));
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
function salvarDados(dados) { localStorage.setItem('mp_data', JSON.stringify(dados)); atualizarDashboard(); }

function aplicarConfiguracoesVisuais() {
    const settings = getDados().settings;
    document.documentElement.style.setProperty('--primary-color', settings.primaryColor);
    document.getElementById('company-name-display').textContent = settings.companyName;
    document.title = `${settings.companyName} | Sistema de Gestão`;
    document.getElementById('company-logo-placeholder').textContent = settings.companyName.substring(0, 2).toUpperCase();
}

// ==========================================
// NAVEGAÇÃO
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
            if(targetPage === 'tecnico') renderizarAgendaTecnico(); 
            if(targetPage === 'agenda') renderizarAgendaRotas(); 
        });
    });
}
function configurarMenuMobile() {
    document.getElementById('mobile-menu-btn').addEventListener('click', () => {
        document.getElementById('sidebar').classList.toggle('open');
    });
}
function atualizarDashboard() {
    const ordens = getDados().ordensServico || [];
    document.getElementById('count-os').textContent = ordens.filter(os => os.status === 'Aberta').length;
    document.getElementById('count-andamento').textContent = ordens.filter(os => os.status === 'Em andamento').length;
    document.getElementById('count-atrasadas').textContent = ordens.filter(os => os.status === 'Atrasada').length;
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
// CHAMADOS
// ==========================================
function configurarModuloChamados() {
    const modalNovo = document.getElementById('modal-novo-chamado');
    const formNovo = document.getElementById('form-novo-chamado');
    const fecharModal = () => { modalNovo.classList.add('hidden'); formNovo.reset(); };

    document.getElementById('btn-abrir-modal-chamado').addEventListener('click', () => modalNovo.classList.remove('hidden'));
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
        salvarDados(dados); renderizarTabelaChamados(); fecharModal();
    });
}

function renderizarTabelaChamados() {
    const dados = getDados();
    const tbody = document.querySelector('#tabela-chamados tbody');
    if(!tbody) return;
    
    tbody.innerHTML = ''; 
    if (dados.chamados.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color: var(--text-muted);">Nenhum chamado.</td></tr>`;
        return;
    }

    [...dados.chamados].reverse().forEach(chamado => {
        const tr = document.createElement('tr');
        let badgeStatus = chamado.status === 'Convertido em OS' ? 'badge-status-aprovado' : (chamado.status === 'Em análise' ? 'badge-status-analise' : 'badge-status-novo');
        let badgePrioridade = chamado.prioridade === 'Urgente' ? 'badge-prio-urgente' : (chamado.prioridade === 'Alta' ? 'badge-prio-alta' : 'badge-prio-normal');

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
// ORDENS DE SERVIÇO
// ==========================================
function configurarModuloOS() {
    const modalOS = document.getElementById('modal-nova-os');
    const formOS = document.getElementById('form-nova-os');
    const selectChamado = document.getElementById('input-os-chamado');
    const fecharModal = () => { modalOS.classList.add('hidden'); formOS.reset(); };

    // Seta data de hoje por padrão ao abrir
    document.getElementById('btn-abrir-modal-os').addEventListener('click', () => {
        const dados = getDados();
        selectChamado.innerHTML = '<option value="">Nenhum (Criar OS Avulsa)</option>';
        dados.chamados.filter(c => c.status !== 'Convertido em OS').forEach(c => {
            const opt = document.createElement('option');
            opt.value = c.id; opt.textContent = `#${c.id} - ${c.condominio}`;
            selectChamado.appendChild(opt);
        });
        
        // Pega data de hoje (Formato YYYY-MM-DD para o input HTML)
        document.getElementById('input-os-data').value = new Date().toISOString().split('T')[0];
        document.getElementById('input-os-hora').value = "08:00";

        modalOS.classList.remove('hidden');
    });

    selectChamado.addEventListener('change', (e) => {
        const chamado = getDados().chamados.find(c => c.id == e.target.value);
        if(chamado) {
            document.getElementById('input-os-condominio').value = chamado.condominio;
            document.getElementById('input-os-servico').value = chamado.problema;
        } else {
            document.getElementById('input-os-condominio').value = '';
            document.getElementById('input-os-servico').value = '';
        }
    });

    document.getElementById('btn-fechar-modal-os').addEventListener('click', fecharModal);
    document.getElementById('btn-cancelar-os').addEventListener('click', (e) => { e.preventDefault(); fecharModal(); });

    formOS.addEventListener('submit', (e) => {
        e.preventDefault(); 
        const dados = getDados();
        let novoId = dados.ordensServico.length > 0 ? Math.max(...dados.ordensServico.map(os => os.id)) + 1 : 1001;
        const chamadoIdVinculado = selectChamado.value;

        // Formata a data para exibir bonito (DD/MM/YYYY)
        const dataBruta = document.getElementById('input-os-data').value;
        const dataFormatada = dataBruta.split('-').reverse().join('/');

        dados.ordensServico.push({
            id: novoId,
            chamadoId: chamadoIdVinculado || null,
            condominio: document.getElementById('input-os-condominio').value,
            servico: document.getElementById('input-os-servico').value,
            dataFormatoEN: dataBruta, // Salva para filtro
            data: dataFormatada,
            hora: document.getElementById('input-os-hora').value,
            tecnico: document.getElementById('input-os-tecnico').value,
            status: document.getElementById('input-os-status').value,
            diagnostico: ""
        });

        if(chamadoIdVinculado) {
            const index = dados.chamados.findIndex(c => c.id == chamadoIdVinculado);
            if(index !== -1) dados.chamados[index].status = 'Convertido em OS';
        }

        salvarDados(dados); renderizarTabelaOS(); renderizarTabelaChamados(); fecharModal();
    });
}

function renderizarTabelaOS() {
    const dados = getDados();
    const tbody = document.querySelector('#tabela-os tbody');
    if(!tbody) return;
    
    tbody.innerHTML = ''; 
    if (dados.ordensServico.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color: var(--text-muted);">Nenhuma OS.</td></tr>`;
        return;
    }

    [...dados.ordensServico].reverse().forEach(os => {
        const tr = document.createElement('tr');
        let badgeStatus = 'badge-status-aberta';
        if (os.status === 'Agendada') badgeStatus = 'badge-status-agendada'; 
        if (os.status === 'Em andamento') badgeStatus = 'badge-status-andamento'; 
        if (os.status === 'Concluída') badgeStatus = 'badge-status-concluida'; 

        const exibeDataHora = os.data ? `${os.data} às ${os.hora}` : 'Não definida';

        tr.innerHTML = `
            <td>#${os.id}</td>
            <td><strong>${os.condominio}</strong></td>
            <td>${os.servico}</td>
            <td style="color: var(--text-muted); font-size: 13px;">${exibeDataHora}</td>
            <td>${os.tecnico}</td>
            <td><span class="badge ${badgeStatus}">${os.status}</span></td>
            <td style="text-align: right;"><button class="icon-btn"><span class="material-symbols-outlined">visibility</span></button></td>
        `;
        tbody.appendChild(tr);
    });
}

// ==========================================
// TÉCNICO
// ==========================================
function configurarModuloTecnico() {
    document.getElementById('simulador-tecnico').addEventListener('change', renderizarAgendaTecnico);
    document.getElementById('btn-fechar-modal-exec').addEventListener('click', () => document.getElementById('modal-executar-os').classList.add('hidden'));

    document.getElementById('btn-iniciar-servico').addEventListener('click', () => { atualizarStatusOSTecnico('Em andamento'); });
    document.getElementById('btn-finalizar-servico').addEventListener('click', () => {
        const diag = document.getElementById('exec-os-diagnostico').value;
        if(diag.trim() === '') { alert('Preencha o diagnóstico.'); return; }
        atualizarStatusOSTecnico('Concluída', diag);
        document.getElementById('modal-executar-os').classList.add('hidden');
    });
}
function atualizarStatusOSTecnico(novoStatus, diag = "") {
    const osId = document.getElementById('exec-os-id').value;
    const dados = getDados();
    const index = dados.ordensServico.findIndex(os => os.id == osId);
    if(index !== -1) {
        dados.ordensServico[index].status = novoStatus;
        if(diag) dados.ordensServico[index].diagnostico = diag;
        salvarDados(dados); renderizarAgendaTecnico();
        if(novoStatus === 'Em andamento') document.getElementById('btn-iniciar-servico').style.display = 'none';
    }
}
window.abrirModalExecutarOS = function(osId) {
    const os = getDados().ordensServico.find(o => o.id == osId);
    if(!os) return;
    document.getElementById('exec-os-id').value = os.id;
    document.getElementById('exec-os-title').textContent = `OS #${os.id}`;
    document.getElementById('exec-os-servico').textContent = os.servico;
    document.getElementById('exec-os-diagnostico').value = os.diagnostico || "";

    const btnIn = document.getElementById('btn-iniciar-servico');
    const btnFi = document.getElementById('btn-finalizar-servico');
    const inputDiag = document.getElementById('exec-os-diagnostico');

    if(os.status === 'Concluída') { btnIn.style.display = 'none'; btnFi.style.display = 'none'; inputDiag.disabled = true; } 
    else if (os.status === 'Em andamento') { btnIn.style.display = 'none'; btnFi.style.display = 'block'; inputDiag.disabled = false; } 
    else { btnIn.style.display = 'block'; btnFi.style.display = 'block'; inputDiag.disabled = false; }

    document.getElementById('modal-executar-os').classList.remove('hidden');
};
function renderizarAgendaTecnico() {
    const container = document.getElementById('lista-os-tecnico');
    if(!container) return; container.innerHTML = '';
    const tecnico = document.getElementById('simulador-tecnico').value;
    let ordens = getDados().ordensServico || [];
    if(tecnico !== 'Todos') ordens = ordens.filter(os => os.tecnico === tecnico);

    if (ordens.length === 0) { container.innerHTML = `<p style="color: var(--text-muted);">Nenhuma OS designada.</p>`; return; }
    [...ordens].reverse().forEach(os => {
        const card = document.createElement('div'); card.className = 'task-card';
        let bg = os.status === 'Concluída' ? 'badge-status-concluida' : 'badge-status-aberta';
        card.innerHTML = `
            <div class="task-header">
                <span class="task-id">OS #${os.id}</span>
                <span class="badge ${bg}">${os.status}</span>
            </div>
            <div class="task-info">
                <p class="title">${os.condominio}</p>
                <p class="desc">${os.servico}</p>
            </div>
            <div class="task-footer"><button class="btn btn-primary btn-executar" style="width: 100%;">Executar</button></div>
        `;
        card.querySelector('.btn-executar').addEventListener('click', () => abrirModalExecutarOS(os.id));
        container.appendChild(card);
    });
}

// ==========================================
// AGENDA E ROTAS (NOVO)
// ==========================================
function configurarModuloAgenda() {
    // Inicializa a data com o dia de hoje
    const hojeIso = new Date().toISOString().split('T')[0];
    document.getElementById('filtro-agenda-data').value = hojeIso;

    // Filtros
    document.getElementById('filtro-agenda-data').addEventListener('change', renderizarAgendaRotas);
    document.getElementById('filtro-agenda-tecnico').addEventListener('change', renderizarAgendaRotas);
}

function renderizarAgendaRotas() {
    const container = document.getElementById('timeline-rotas');
    if(!container) return;
    
    container.innerHTML = '';

    const dataFiltro = document.getElementById('filtro-agenda-data').value;
    const tecnicoFiltro = document.getElementById('filtro-agenda-tecnico').value;
    
    let ordens = getDados().ordensServico || [];

    // Filtra pela Data
    if(dataFiltro) {
        ordens = ordens.filter(os => os.dataFormatoEN === dataFiltro);
    }
    // Filtra pelo Técnico
    if(tecnicoFiltro !== 'Todos') {
        ordens = ordens.filter(os => os.tecnico === tecnicoFiltro);
    }

    if(ordens.length === 0) {
        container.innerHTML = `<p style="color: var(--text-muted); padding: 20px;">Nenhuma rota ou serviço agendado para os filtros selecionados.</p>`;
        return;
    }

    // Ordena pela hora (mais cedo primeiro)
    ordens.sort((a, b) => {
        if (!a.hora) return 1;
        if (!b.hora) return -1;
        return a.hora.localeCompare(b.hora);
    });

    let passo = 1;

    ordens.forEach(os => {
        const item = document.createElement('div');
        item.className = 'timeline-item';
        
        // Cor do status
        let colorStatus = 'var(--text-muted)';
        if (os.status === 'Em andamento') colorStatus = '#a16207'; // Amarelo escuro
        if (os.status === 'Concluída') colorStatus = '#15803d'; // Verde

        item.innerHTML = `
            <div class="timeline-dot">${passo}</div>
            <div class="timeline-content">
                <div class="timeline-header">
                    <span class="timeline-time"><span class="material-symbols-outlined" style="font-size:14px; vertical-align:middle;">schedule</span> ${os.hora || 'S/ Hora'}</span>
                    <span class="timeline-status" style="color: ${colorStatus}; font-weight: 600;">${os.status}</span>
                </div>
                <div class="timeline-title">${os.condominio}</div>
                <div class="timeline-desc">OS #${os.id} • ${os.servico}</div>
                <div style="margin-top: 8px; font-size: 13px; color: var(--primary-color); font-weight: 500;">
                    <span class="material-symbols-outlined" style="font-size:14px; vertical-align:middle;">person</span> ${os.tecnico}
                </div>
            </div>
        `;
        container.appendChild(item);
        passo++;
    });
}