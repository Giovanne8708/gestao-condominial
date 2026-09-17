const TÉCNICO_LOGADO = "João Silva";

document.addEventListener('DOMContentLoaded', () => {
    inicializarSistema();
    configurarNavegacao();
    configurarMenuMobile();
    configurarSeletorPerfil();
    configurarTelaConfiguracoesWhiteLabel(); // Novo módulo de configs
});

window.irParaTela = function(tela) {
    const link = document.querySelector(`.nav-item[data-page="${tela}"]`);
    if(link) link.click();
};

function inicializarSistema() {
    if (!localStorage.getItem('mp_data')) {
        const emptyData = {
            settings: { 
                systemName: "Gestão de Manutenção",
                companyName: "Sua Empresa", 
                primaryColor: "#1e40af",
                logoBase64: "",
                cnpj: "",
                telefone: "",
                email: "",
                endereco: ""
            },
            chamados: [], ordensServico: [], condominios: [], equipamentos: [], preventivas: [], documentos: [], materiais: []
        };
        localStorage.setItem('mp_data', JSON.stringify(emptyData));
    }
    aplicarConfiguracoesVisuais();
}

function getDados() { return JSON.parse(localStorage.getItem('mp_data')); }
function salvarDados(dados) { localStorage.setItem('mp_data', JSON.stringify(dados)); }

// ==========================================================
// APLICAÇÃO DINÂMICA DA IDENTIDADE VISUAL E WHITE-LABEL
// ==========================================================
function aplicarConfiguracoesVisuais() {
    const dados = getDados();
    if(!dados || !dados.settings) return;
    
    const s = dados.settings;
    
    // Aplica cor principal discreta
    document.documentElement.style.setProperty('--primary-color', s.primaryColor || '#1e40af');
    
    // Atualiza Textos
    const displayEmpresa = document.getElementById('company-name-display');
    const displaySistema = document.getElementById('system-name-display');
    if(displayEmpresa) displayEmpresa.textContent = s.companyName || "Sua Empresa";
    if(displaySistema) displaySistema.textContent = s.systemName || "Gestão de Manutenção";
    
    // Atualiza Título do Navegador
    document.title = `${s.companyName || "Empresa"} | ${s.systemName || "Sistema"}`;

    // Aplica o Logo da Empresa ou o Espaço Discreto
    const logoImg = document.getElementById('company-logo-img');
    const logoPlaceholder = document.getElementById('company-logo-placeholder');
    
    if(logoImg && logoPlaceholder) {
        if(s.logoBase64 && s.logoBase64.trim() !== '') {
            logoImg.src = s.logoBase64;
            logoImg.classList.remove('hidden');
            logoPlaceholder.classList.add('hidden');
        } else {
            logoImg.classList.add('hidden');
            logoPlaceholder.classList.remove('hidden');
        }
    }
}

// ==========================================================
// FORMULÁRIO DE CONFIGURAÇÕES (UPLOAD LOGO E DADOS)
// ==========================================================
function configurarTelaConfiguracoesWhiteLabel() {
    const form = document.getElementById('form-configuracoes');
    if(!form) return;
    
    const dados = getDados();
    const s = dados.settings;
    
    // Carrega dados existentes para o form
    document.getElementById('input-config-system').value = s.systemName || '';
    document.getElementById('input-config-empresa').value = s.companyName || '';
    document.getElementById('input-config-color').value = s.primaryColor || '#1e40af';
    document.getElementById('input-config-cnpj').value = s.cnpj || '';
    document.getElementById('input-config-telefone').value = s.telefone || '';
    document.getElementById('input-config-email').value = s.email || '';
    document.getElementById('input-config-endereco').value = s.endereco || '';
    
    // Pre-carrega a miniatura do logo se existir
    const previewBox = document.getElementById('config-logo-preview');
    const inputFile = document.getElementById('input-config-logo');
    
    if(s.logoBase64) {
        previewBox.innerHTML = `<img src="${s.logoBase64}">`;
        inputFile.dataset.base64 = s.logoBase64; // Mantem guardado caso não seja alterado
    }

    // Listener para o Upload Real do Arquivo (Converte Imagem > Base64)
    inputFile.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if(file) {
            if(file.size > 2 * 1024 * 1024) { // Limite de 2MB
                alert("A imagem do logo é muito pesada. Por favor, escolha um arquivo menor que 2MB.");
                inputFile.value = '';
                return;
            }
            const reader = new FileReader();
            reader.onload = function(event) {
                const b64 = event.target.result;
                previewBox.innerHTML = `<img src="${b64}">`;
                inputFile.dataset.base64 = b64;
            };
            reader.readAsDataURL(file);
        }
    });

    // Salvar as configurações
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        if(!form.checkValidity()) {
            alert("Não foi possível salvar a personalização. Verifique se os campos obrigatórios (Nome, Cor) estão preenchidos.");
            return;
        }

        const configSalvar = getDados();
        
        configSalvar.settings.systemName = document.getElementById('input-config-system').value;
        configSalvar.settings.companyName = document.getElementById('input-config-empresa').value;
        configSalvar.settings.primaryColor = document.getElementById('input-config-color').value;
        configSalvar.settings.cnpj = document.getElementById('input-config-cnpj').value;
        configSalvar.settings.telefone = document.getElementById('input-config-telefone').value;
        configSalvar.settings.email = document.getElementById('input-config-email').value;
        configSalvar.settings.endereco = document.getElementById('input-config-endereco').value;
        
        if(inputFile.dataset.base64) {
            configSalvar.settings.logoBase64 = inputFile.dataset.base64;
        }
        
        salvarDados(configSalvar);
        aplicarConfiguracoesVisuais();
        
        alert("Identidade visual e configurações da empresa aplicadas com sucesso!");
    });
}

// ==========================================================
// MÓDULOS DE NAVEGAÇÃO E PERFIL (MANTIDOS)
// ==========================================================
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
        menuSindico.classList.remove('hidden'); irParaTela('sindico-inicio');
    } else if (perfil === 'tecnico') {
        menuTecnico.classList.remove('hidden'); irParaTela('tecnico-inicio');
    } else {
        menuAdmin.classList.remove('hidden'); irParaTela('dashboard');
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
        });
    });
}

function configurarMenuMobile() {
    const btn = document.getElementById('mobile-menu-btn');
    if(btn) btn.addEventListener('click', () => document.getElementById('sidebar').classList.toggle('open'));
}

// Funções Dummy para evitar erros das chamadas nativas em DOMContentLoaded
function configurarModuloPortalSindico(){}
function configurarModuloChamados(){}
function configurarModuloOS(){}
function configurarModuloAgendaRotas(){}
function configurarModuloCondominios(){}
function configurarModuloEquipamentos(){}
function configurarModuloPreventivas(){}
function configurarModuloMateriais(){}
function configurarModuloDocumentos(){}