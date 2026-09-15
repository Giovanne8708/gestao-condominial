document.addEventListener('DOMContentLoaded', () => {
    inicializarSistema();
    configurarNavegacao();
    configurarMenuMobile();
    configurarTelaConfiguracoes();
    configurarModuloChamados();
    configurarModuloOS(); // Inicializa módulo de OS
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
            
            // Renderiza as tabelas caso tenham novos dados
            if(targetPage === 'chamados') renderizarTabelaChamados();
            if(targetPage === 'os') renderizarTabelaOS();
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
    renderizarTabelaChamados();
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
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color: var(--text-muted);">Nenhum chamado registrado no momento.</td></tr>`;
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
            <td style="text-align: right;">
                <button class="icon-btn" title="Ver Detalhes"><span class="material-symbols-outlined">visibility</span></button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// ==========================================
// MÓDULO DE ORDENS DE SERVIÇO (OS)
// ==========================================
function configurarModuloOS() {
    renderizarTabelaOS();
    const modalOS = document.getElementById('modal-nova-os');
    const formOS = document.getElementById('form-nova-os');

    document.getElementById('btn-abrir-modal-os').addEventListener('click', () => modalOS.classList.remove('hidden'));

    const fecharModal = () => { modalOS.classList.add('hidden'); formOS.reset(); };

    document.getElementById('btn-fechar-modal-os').addEventListener('click', fecharModal);
    document.getElementById('btn-cancelar-os').addEventListener('click', (e) => { e.preventDefault(); fecharModal(); });

    formOS.addEventListener('submit', (e) => {
        e.preventDefault(); 
        const dados = getDados();
        
        // As OS começam do número 1001 para diferenciar dos chamados
        let novoId = 1001;
        if (dados.ordensServico && dados.ordensServico.length > 0) {
            novoId = Math.max(...dados.ordensServico.map(os => os.id)) + 1;
        }
        
        dados.ordensServico.push({
            id: novoId,
            condominio: document.getElementById('input-os-condominio').value,
            servico: document.getElementById('input-os-servico').value,
            tecnico: document.getElementById('input-os-tecnico').value,
            status: document.getElementById('input-os-status').value
        });

        salvarDados(dados);
        renderizarTabelaOS();
        fecharModal();
    });
}

function renderizarTabelaOS() {
    const dados = getDados();
    const tbody = document.querySelector('#tabela-os tbody');
    if(!tbody) return;
    
    tbody.innerHTML = ''; 
    if (!dados.ordensServico || dados.ordensServico.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color: var(--text-muted);">Nenhuma OS registrada no momento.</td></tr>`;
        return;
    }

    [...dados.ordensServico].reverse().forEach(os => {
        const tr = document.createElement('tr');
        
        let badgeStatus = 'badge-status-aberta'; // Cor padrão (Azul)
        if (os.status === 'Agendada') badgeStatus = 'badge-status-agendada'; // Roxo
        if (os.status === 'Em andamento') badgeStatus = 'badge-status-andamento'; // Amarelo
        if (os.status === 'Concluída') badgeStatus = 'badge-status-concluida'; // Verde
        if (os.status === 'Atrasada') badgeStatus = 'badge-status-atrasada'; // Vermelho

        tr.innerHTML = `
            <td>#${os.id}</td>
            <td><strong>${os.condominio}</strong></td>
            <td>${os.servico}</td>
            <td>${os.tecnico}</td>
            <td><span class="badge ${badgeStatus}">${os.status}</span></td>
            <td style="text-align: right;">
                <button class="icon-btn" title="Ver Detalhes"><span class="material-symbols-outlined">visibility</span></button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}