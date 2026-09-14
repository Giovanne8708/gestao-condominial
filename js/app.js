document.addEventListener('DOMContentLoaded', () => {
    inicializarSistema();
    configurarNavegacao();
    configurarMenuMobile();
    configurarTelaConfiguracoes();
});

// Inicialização e banco de dados (localStorage)
function inicializarSistema() {
    // Verifica se já existem dados no localStorage
    if (!localStorage.getItem('mp_data')) {
        // Se não existir, salva os dados do data.js
        localStorage.setItem('mp_data', JSON.stringify(mockData));
    }
    
    aplicarConfiguracoesVisuais();
    atualizarDashboard();
}

function getDados() {
    return JSON.parse(localStorage.getItem('mp_data'));
}

function salvarDados(dados) {
    localStorage.setItem('mp_data', JSON.stringify(dados));
}

// Aplicar Regra de Personalização (Nome e Cor)
function aplicarConfiguracoesVisuais() {
    const dados = getDados();
    const settings = dados.settings;

    // Atualiza CSS Variable de cor
    document.documentElement.style.setProperty('--primary-color', settings.primaryColor);
    
    // Atualiza nome nos cabeçalhos
    document.getElementById('company-name-display').textContent = settings.companyName;
    document.title = `${settings.companyName} | Sistema de Gestão`;

    // Atualiza a sigla na logo (primeiras duas letras)
    const sigla = settings.companyName.substring(0, 2).toUpperCase();
    document.getElementById('company-logo-placeholder').textContent = sigla;
}

// Navegação entre telas (Single Page Application)
function configurarNavegacao() {
    const navItems = document.querySelectorAll('.nav-item');
    const pageViews = document.querySelectorAll('.page-view');
    const pageTitle = document.getElementById('page-title');

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const targetPage = item.getAttribute('data-page');

            // Remove active de todos os links e views
            navItems.forEach(nav => nav.classList.remove('active'));
            pageViews.forEach(page => page.classList.add('hidden'));

            // Ativa o link clicado e mostra a view
            item.classList.add('active');
            document.getElementById(`page-${targetPage}`).classList.remove('hidden');

            // Atualiza o título do header
            pageTitle.textContent = item.textContent.trim();

            // Fecha o menu no mobile ao clicar
            document.getElementById('sidebar').classList.remove('open');
        });
    });
}

// Mobile Menu (Regra 32)
function configurarMenuMobile() {
    const btn = document.getElementById('mobile-menu-btn');
    const sidebar = document.getElementById('sidebar');

    btn.addEventListener('click', () => {
        sidebar.classList.toggle('open');
    });
}

// Lógica da tela de Dashboard
function atualizarDashboard() {
    const dados = getDados();
    
    // Lógica simples de contagem
    const totalAbertas = dados.ordensServico.filter(os => os.status === 'Aberta').length;
    const totalAndamento = dados.ordensServico.filter(os => os.status === 'Em andamento').length;

    document.getElementById('count-os').textContent = totalAbertas;
    document.getElementById('count-andamento').textContent = totalAndamento;
}

// Lógica da tela de Configurações
function configurarTelaConfiguracoes() {
    const dados = getDados();
    
    // Preenche os campos com os dados atuais
    document.getElementById('input-company-name').value = dados.settings.companyName;
    document.getElementById('input-primary-color').value = dados.settings.primaryColor;

    // Salvar
    document.getElementById('btn-save-settings').addEventListener('click', () => {
        const newName = document.getElementById('input-company-name').value;
        const newColor = document.getElementById('input-primary-color').value;

        // Atualiza objeto
        dados.settings.companyName = newName;
        dados.settings.primaryColor = newColor;

        // Salva e aplica
        salvarDados(dados);
        aplicarConfiguracoesVisuais();
        
        alert("Configurações salvas com sucesso!");
    });
}