document.addEventListener('DOMContentLoaded', () => {
    inicializarSistema();
    configurarNavegacao();
    configurarMenuMobile();
    configurarTelaConfiguracoes();
    configurarModuloChamados();
});

// ==========================================
// INICIALIZAÇÃO E BANCO DE DADOS
// ==========================================
function inicializarSistema() {
    if (!localStorage.getItem('mp_data')) {
        // Se estiver usando o data.js externo, e ele existir:
        if (typeof mockData !== 'undefined') {
            localStorage.setItem('mp_data', JSON.stringify(mockData));
        } else {
            // Um banco de dados vazio como fallback
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

function getDados() {
    return JSON.parse(localStorage.getItem('mp_data'));
}

function salvarDados(dados) {
    localStorage.setItem('mp_data', JSON.stringify(dados));
    atualizarDashboard(); // Atualiza dashboard sempre que salvar dados
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
    const pageTitle = document.getElementById('page-title');

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const targetPage = item.getAttribute('data-page');

            navItems.forEach(nav => nav.classList.remove('active'));
            pageViews.forEach(page => page.classList.add('hidden'));

            item.classList.add('active');
            document.getElementById(`page-${targetPage}`).classList.remove('hidden');

            pageTitle.textContent = item.textContent.trim();
            document.getElementById('sidebar').classList.remove('open');
            
            // Se abrir chamados, renderiza a tabela novamente para garantir
            if(targetPage === 'chamados') renderizarTabelaChamados();
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
    const totalAbertas = dados.ordensServico.filter(os => os.status === 'Aberta').length;
    const totalAndamento = dados.ordensServico.filter(os => os.status === 'Em andamento').length;

    document.getElementById('count-os').textContent = totalAbertas;
    document.getElementById('count-andamento').textContent = totalAndamento;
}

function configurarTelaConfiguracoes() {
    const dados = getDados();
    
    document.getElementById('input-company-name').value = dados.settings.companyName;
    document.getElementById('input-primary-color').value = dados.settings.primaryColor;

    document.getElementById('btn-save-settings').addEventListener('click', () => {
        const newName = document.getElementById('input-company-name').value;
        const newColor = document.getElementById('input-primary-color').value;

        dados.settings.companyName = newName;
        dados.settings.primaryColor = newColor;

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
    const btnAbrir = document.getElementById('btn-abrir-modal-chamado');
    const btnFechar = document.getElementById('btn-fechar-modal-chamado');
    const btnCancelar = document.getElementById('btn-cancelar-chamado');
    const formNovo = document.getElementById('form-novo-chamado');

    btnAbrir.addEventListener('click', () => modalNovo.classList.remove('hidden'));

    const fecharModal = () => {
        modalNovo.classList.add('hidden');
        formNovo.reset();
    };

    btnFechar.addEventListener('click', fecharModal);
    btnCancelar.addEventListener('click', (e) => {
        e.preventDefault();
        fecharModal();
    });

    formNovo.addEventListener('submit', (e) => {
        e.preventDefault(); 
        
        const condominio = document.getElementById('input-chamado-condominio').value;
        const problema = document.getElementById('input-chamado-problema').value;
        const prioridade = document.getElementById('input-chamado-prioridade').value;

        const dados = getDados();
        
        let novoId = 1;
        if (dados.chamados.length > 0) {
            const ids = dados.chamados.map(c => c.id);
            novoId = Math.max(...ids) + 1;
        }
        
        dados.chamados.push({
            id: novoId,
            condominio: condominio,
            problema: problema,
            prioridade: prioridade,
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

    const chamadosExibicao = [...dados.chamados].reverse();

    chamadosExibicao.forEach(chamado => {
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