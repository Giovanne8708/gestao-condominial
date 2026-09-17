const TÉCNICO_LOGADO = "João Silva";

document.addEventListener('DOMContentLoaded', () => {
    inicializarBancoDados();
    verificarSessaoAtiva(); 
    configurarModuloLogin();
    configurarNavegacao();
    configurarMenuMobile();
    
    // Inicialização de todos os Módulos do Sistema
    configurarModuloPortalSindico();
    configurarModuloChamadosAdmin();
    configurarModuloOSAdmin();
    configurarModuloOSTecnico();
    configurarModuloAgendaRotas();
    configurarModuloCondominios();
    configurarModuloEquipamentos();
    configurarModuloMateriais();
    configurarModuloPreventivas();
    configurarModuloDocumentos();
    configurarModuloRelatorios();
    configurarTelaConfiguracoesWhiteLabel();
});

window.irParaTela = function(tela) {
    const link = document.querySelector(`.nav-item[data-page="${tela}"]`);
    if(link) link.click();
};

function inicializarBancoDados() {
    if (!localStorage.getItem('mp_data')) {
        const emptyData = {
            settings: { systemName: "Gestão de Manutenção", companyName: "Sua Empresa", primaryColor: "#1e40af", logoBase64: "" },
            chamados: [{ id: 101, condominio: "Residencial Jardim das Palmeiras", local: "Bloco B - Elevador", categoria: "Elevadores", problema: "Porta travando no 3º andar", prioridade: "Alta", status: "Novo", data: new Date().toLocaleDateString('pt-BR'), laudoTecnico: "", materiaisUsados: "" }], 
            ordensServico: [], 
            condominios: [
                { id: 1, nome: "Residencial Jardim das Palmeiras", endereco: "Av. Beira Rio, 1000", sindico: "João Siqueira", status: "Ativo" },
                { id: 2, nome: "Condomínio Solar", endereco: "Rua das Flores, 45", sindico: "Carlos Alberto", status: "Ativo" }
            ], 
            equipamentos: [], preventivas: [], documentos: [], materiais: []
        };
        localStorage.setItem('mp_data', JSON.stringify(emptyData));
    }
}

function getDados() { return JSON.parse(localStorage.getItem('mp_data')); }
function salvarDados(dados) { localStorage.setItem('mp_data', JSON.stringify(dados)); }

// ==========================================================
// MÓDULO 1: AUTENTICAÇÃO E SESSÃO
// ==========================================================
function verificarSessaoAtiva() {
    const session = JSON.parse(localStorage.getItem('mp_session'));
    if(session) {
        document.getElementById('login-wrapper').classList.add('hidden');
        document.getElementById('sidebar').classList.remove('hidden');
        document.getElementById('main-app').classList.remove('hidden');
        
        aplicarConfiguracoesVisuaisInternas();
        document.getElementById('header-user-name').textContent = session.nome;
        document.getElementById('header-user-avatar').textContent = session.nome.charAt(0).toUpperCase();

        aplicarRegraPerfilSessao(session.role, session.nome);
    } else {
        document.getElementById('login-wrapper').classList.remove('hidden');
        document.getElementById('sidebar').classList.add('hidden');
        document.getElementById('main-app').classList.add('hidden');
        
        aplicarWhiteLabelNoLogin();
    }
}

function configurarModuloLogin() {
    const formLogin = document.getElementById('form-login');
    if(!formLogin) return;
    
    formLogin.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value.trim().toLowerCase();
        
        let role = '', nome = '';
        if(email === 'admin@empresa.com') { role = 'admin'; nome = 'Administrativo'; }
        else if(email === 'tecnico@empresa.com') { role = 'tecnico'; nome = 'João Silva'; }
        else if(email === 'sindico@condominio.com') { role = 'sindico'; nome = 'João Siqueira'; }
        else {
            alert("Credenciais incorretas! Tente os e-mails de demonstração indicados na tela.");
            return;
        }

        const sessaoObj = { email: email, role: role, nome: nome };
        localStorage.setItem('mp_session', JSON.stringify(sessaoObj));
        formLogin.reset();
        verificarSessaoAtiva();
    });
}

window.realizarLogout = function() {
    localStorage.removeItem('mp_session');
    verificarSessaoAtiva();
};

function aplicarRegraPerfilSessao(role, nome) {
    const menuAdmin = document.getElementById('menu-admin');
    const menuSindico = document.getElementById('menu-sindico');
    const menuTecnico = document.getElementById('menu-tecnico');

    menuAdmin.classList.add('hidden'); 
    menuSindico.classList.add('hidden'); 
    menuTecnico.classList.add('hidden');

    if (role === 'sindico') {
        menuSindico.classList.remove('hidden'); 
        document.getElementById('header-user-role').textContent = "Síndico / Cliente";
        const welcomeText = document.getElementById('sindico-welcome-text');
        if(welcomeText) welcomeText.textContent = `Olá, ${nome}.`;
        irParaTela('sindico-inicio'); 
        atualizarPortalSindico();
    } else if (role === 'tecnico') {
        menuTecnico.classList.remove('hidden'); 
        document.getElementById('header-user-role').textContent = "Técnico de Campo";
        const welcomeText = document.getElementById('tec-welcome-text');
        if(welcomeText) welcomeText.textContent = `Olá, ${nome}.`;
        irParaTela('tecnico-inicio'); 
        atualizarPortalTecnico(nome);
    } else {
        menuAdmin.classList.remove('hidden'); 
        document.getElementById('header-user-role').textContent = "Gestor Administrativo";
        irParaTela('dashboard'); 
        atualizarDashboardAdmin();
    }
}

// ==========================================================
// MÓDULO 2: WHITE-LABEL E NAVEGAÇÃO
// ==========================================================
function aplicarWhiteLabelNoLogin() {
    const dados = getDados(); if(!dados || !dados.settings) return; const s = dados.settings;
    document.documentElement.style.setProperty('--primary-color', s.primaryColor || '#1e40af');
    document.title = `Acesso | ${s.systemName || "Gestão"}`;
    if(document.getElementById('login-system-name')) document.getElementById('login-system-name').textContent = s.systemName || "Gestão de Manutenção";
    
    const logoL = document.getElementById('login-logo-img');
    if(logoL && s.logoBase64) {
        logoL.src = s.logoBase64; logoL.classList.remove('hidden');
    }
}

function aplicarConfiguracoesVisuaisInternas() {
    const dados = getDados(); if(!dados || !dados.settings) return; const s = dados.settings;
    document.documentElement.style.setProperty('--primary-color', s.primaryColor || '#1e40af');
    document.title = `${s.companyName || "Empresa"} | ${s.systemName || "Sistema"}`;
    
    if(document.getElementById('company-name-display')) document.getElementById('company-name-display').textContent = s.companyName || "Sua Empresa";
    if(document.getElementById('system-name-display')) document.getElementById('system-name-display').textContent = s.systemName || "Gestão de Manutenção";

    const logoImg = document.getElementById('company-logo-img');
    const logoPlaceholder = document.getElementById('company-logo-placeholder');
    if(logoImg && logoPlaceholder) {
        if(s.logoBase64 && s.logoBase64.trim() !== '') {
            logoImg.src = s.logoBase64; logoImg.classList.remove('hidden'); logoPlaceholder.classList.add('hidden');
        } else {
            logoImg.classList.add('hidden'); logoPlaceholder.classList.remove('hidden');
        }
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
            
            // Dispara funções ao abrir a tela
            if(targetPage === 'dashboard') atualizarDashboardAdmin();
            if(targetPage === 'chamados') renderizarTabelaChamadosAdmin();
            if(targetPage === 'os') renderizarTabelaOSAdmin();
            if(targetPage === 'agenda') renderizarAgendaRotas();
            if(targetPage === 'condominios') renderizarTabelaCondominios();
            if(targetPage === 'equipamentos') renderizarTabelaEquipamentos();
            if(targetPage === 'materiais') renderizarTabelaMateriais();
            if(targetPage === 'preventivas') renderizarTabelaPreventivas();
            if(targetPage === 'documentos') renderizarTabelaDocumentos();
            if(targetPage === 'relatorios') atualizarRelatorios();
            
            if(['sindico-inicio', 'sindico-meus-chamados'].includes(targetPage)) atualizarPortalSindico();
            if(['tecnico-inicio', 'tecnico-os'].includes(targetPage)) atualizarPortalTecnico(JSON.parse(localStorage.getItem('mp_session')).nome);
        });
    });
}

function configurarMenuMobile() {
    const btn = document.getElementById('mobile-menu-btn');
    if(btn) btn.addEventListener('click', () => document.getElementById('sidebar').classList.toggle('open'));
}

// ==========================================================
// MÓDULOS DE CADASTRO GERAIS (ADMIN)
// ==========================================================

// EQUIPAMENTOS
function configurarModuloEquipamentos() {
    const btnAbrir = document.getElementById('btn-abrir-modal-equipamento'); 
    if(!btnAbrir) return;
    const modal = document.getElementById('modal-novo-equipamento'); 
    const form = document.getElementById('form-novo-equipamento');
    const selectCond = document.getElementById('input-equip-condominio');

    btnAbrir.addEventListener('click', () => {
        const dados = getDados(); 
        selectCond.innerHTML = ''; 
        dados.condominios.forEach(c => { selectCond.innerHTML += `<option value="${c.nome}">${c.nome}</option>`; });
        modal.classList.remove('hidden');
    });

    document.getElementById('btn-fechar-modal-equipamento').addEventListener('click', () => modal.classList.add('hidden')); 
    document.getElementById('btn-cancelar-equipamento').addEventListener('click', (e) => { e.preventDefault(); modal.classList.add('hidden'); });
    
    form.addEventListener('submit', (e) => {
        e.preventDefault(); 
        if(!form.checkValidity()) { alert("Preencha todos os campos obrigatórios."); return; }
        const dados = getDados(); 
        const numId = dados.equipamentos.length > 0 ? Math.max(...dados.equipamentos.map(eq => eq.id)) + 1 : 1;
        
        let statusInput = document.getElementById('input-equip-status');
        let statusVal = statusInput ? statusInput.value : "Funcionando";
        
        dados.equipamentos.push({ 
            id: numId, 
            codigo: `EQ-${String(numId).padStart(3,'0')}`, 
            nome: document.getElementById('input-equip-nome').value, 
            categoria: document.getElementById('input-equip-categoria').value, 
            condominio: selectCond.value, 
            status: statusVal 
        });
        
        salvarDados(dados); renderizarTabelaEquipamentos(); modal.classList.add('hidden'); form.reset(); alert("Equipamento cadastrado com sucesso.");
    });
}

function renderizarTabelaEquipamentos() {
    const dados = getDados(); const tbody = document.querySelector('#tabela-equipamentos tbody'); if(!tbody) return; 
    tbody.innerHTML = '';
    if(dados.equipamentos.length === 0) { tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:var(--text-muted);">Nenhum equipamento cadastrado.</td></tr>`; return; }
    dados.equipamentos.forEach(eq => { 
        tbody.innerHTML += `<tr><td><strong>${eq.codigo}</strong></td><td>${eq.nome}</td><td>${eq.condominio}</td><td>${eq.categoria}</td><td><span class="badge badge-status-ativo">${eq.status}</span></td></tr>`; 
    });
}

// CONDOMÍNIOS
function configurarModuloCondominios() {
    const btnAbrir = document.getElementById('btn-abrir-modal-condominio'); if(!btnAbrir) return; 
    const modalCond = document.getElementById('modal-novo-condominio'); 
    const formCond = document.getElementById('form-novo-condominio');
    
    btnAbrir.addEventListener('click', () => modalCond.classList.remove('hidden'));
    document.getElementById('btn-fechar-modal-condominio').addEventListener('click', () => modalCond.classList.add('hidden')); 
    document.getElementById('btn-cancelar-condominio').addEventListener('click', (e) => { e.preventDefault(); modalCond.classList.add('hidden'); });
    
    formCond.addEventListener('submit', (e) => {
        e.preventDefault(); 
        if(!formCond.checkValidity()) { alert("Verifique os campos obrigatórios."); return; }
        const dados = getDados(); const novoId = dados.condominios.length > 0 ? Math.max(...dados.condominios.map(c => c.id)) + 1 : 1;
        dados.condominios.push({ 
            id: novoId, 
            nome: document.getElementById('input-cond-nome').value, 
            endereco: document.getElementById('input-cond-endereco').value, 
            sindico: document.getElementById('input-cond-sindico').value, 
            telefone: document.getElementById('input-cond-telefone').value, 
            status: document.getElementById('input-cond-status').value 
        });
        salvarDados(dados); renderizarTabelaCondominios(); modalCond.classList.add('hidden'); formCond.reset(); alert("Condomínio salvo!");
    });
}

function renderizarTabelaCondominios() {
    const dados = getDados(); const tbody = document.querySelector('#tabela-condominios tbody'); if(!tbody) return; tbody.innerHTML = '';
    if(dados.condominios.length === 0) { tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:var(--text-muted);">Nenhum condomínio cadastrado.</td></tr>`; return; }
    dados.condominios.forEach(c => { tbody.innerHTML += `<tr><td><strong>${c.nome}</strong></td><td>${c.endereco}</td><td>${c.sindico}</td><td><span class="badge badge-status-ativo">${c.status}</span></td></tr>`; });
}

// MATERIAIS
function configurarModuloMateriais() {
    const btnAbrir = document.getElementById('btn-abrir-modal-material'); if(!btnAbrir) return;
    const modalMat = document.getElementById('modal-novo-material'); const formMat = document.getElementById('form-novo-material');
    
    btnAbrir.addEventListener('click', () => modalMat.classList.remove('hidden'));
    document.getElementById('btn-fechar-modal-material').addEventListener('click', () => modalMat.classList.add('hidden'));
    document.getElementById('btn-cancelar-material').addEventListener('click', (e) => { e.preventDefault(); modalMat.classList.add('hidden'); });
    
    formMat.addEventListener('submit', (e) => {
        e.preventDefault(); 
        if(!formMat.checkValidity()) { alert("Verifique os campos obrigatórios."); return; }
        const dados = getDados(); const novoId = dados.materiais.length > 0 ? Math.max(...dados.materiais.map(m => m.id)) + 1 : 1;
        dados.materiais.push({ 
            id: novoId, 
            codigo: `MAT-${String(novoId).padStart(3, '0')}`, 
            nome: document.getElementById('input-mat-nome').value, 
            categoria: document.getElementById('input-mat-cat').value, 
            quantidade: document.getElementById('input-mat-qtd').value, 
            minimo: document.getElementById('input-mat-min').value 
        });
        salvarDados(dados); renderizarTabelaMateriais(); modalMat.classList.add('hidden'); formMat.reset(); alert("Material salvo.");
    });
}

function renderizarTabelaMateriais() {
    const dados = getDados(); const tbody = document.querySelector('#tabela-materiais tbody'); if(!tbody) return; tbody.innerHTML = '';
    if(dados.materiais.length === 0) { tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:var(--text-muted);">Nenhum material em estoque.</td></tr>`; return; }
    dados.materiais.forEach(m => { tbody.innerHTML += `<tr><td><strong>${m.codigo}</strong></td><td>${m.nome}</td><td>${m.quantidade} un.</td><td>${m.minimo} un.</td></tr>`; });
}

// DOCUMENTOS
function configurarModuloDocumentos() {
    const btnAbrir = document.getElementById('btn-abrir-modal-documento'); if(!btnAbrir) return;
    const modalDoc = document.getElementById('modal-novo-documento'); const formDoc = document.getElementById('form-novo-documento');
    const selectCond = document.getElementById('input-doc-condominio');
    
    btnAbrir.addEventListener('click', () => {
        const dados = getDados(); selectCond.innerHTML = '';
        dados.condominios.forEach(c => { selectCond.innerHTML += `<option value="${c.nome}">${c.nome}</option>`; });
        modalDoc.classList.remove('hidden');
    });
    document.getElementById('btn-fechar-modal-documento').addEventListener('click', () => modalDoc.classList.add('hidden'));
    document.getElementById('btn-cancelar-documento').addEventListener('click', (e) => { e.preventDefault(); modalDoc.classList.add('hidden'); });
    
    formDoc.addEventListener('submit', (e) => {
        e.preventDefault(); 
        if(!formDoc.checkValidity()) { alert("Verifique os campos obrigatórios."); return; }
        const dados = getDados(); const numId = dados.documentos.length > 0 ? Math.max(...dados.documentos.map(d => d.id)) + 1 : 1;
        dados.documentos.push({ 
            id: numId, 
            titulo: document.getElementById('input-doc-titulo').value, 
            categoria: document.getElementById('input-doc-categoria').value, 
            condominio: selectCond.value, 
            link: document.getElementById('input-doc-link').value, 
            dataCadastro: new Date().toLocaleDateString('pt-BR') 
        });
        salvarDados(dados); renderizarTabelaDocumentos(); modalDoc.classList.add('hidden'); formDoc.reset(); alert("Documento vinculado.");
    });
}

function renderizarTabelaDocumentos() {
    const dados = getDados(); const tbody = document.querySelector('#tabela-documentos tbody'); if(!tbody) return; tbody.innerHTML = '';
    if(dados.documentos.length === 0) { tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:var(--text-muted);">Nenhum documento.</td></tr>`; return; }
    dados.documentos.forEach(d => { tbody.innerHTML += `<tr><td><strong>${d.titulo}</strong></td><td>${d.categoria}</td><td>${d.condominio}</td><td>${d.dataCadastro}</td></tr>`; });
}

// PREVENTIVAS
function configurarModuloPreventivas() {
    const btnAbrir = document.getElementById('btn-abrir-modal-preventiva'); if(!btnAbrir) return;
    const modalPrev = document.getElementById('modal-nova-preventiva'); const formPrev = document.getElementById('form-nova-preventiva');
    const selectEquip = document.getElementById('input-prev-equipamento'); const inputCond = document.getElementById('input-prev-condominio');
    
    btnAbrir.addEventListener('click', () => {
        const dados = getDados(); selectEquip.innerHTML = '<option value="">Selecione o equipamento...</option>';
        dados.equipamentos.forEach(eq => {
            const opt = document.createElement('option'); opt.value = eq.id; opt.textContent = `${eq.codigo} - ${eq.nome}`;
            opt.dataset.condominio = eq.condominio; selectEquip.appendChild(opt);
        });
        modalPrev.classList.remove('hidden');
    });
    
    if(selectEquip) {
        selectEquip.addEventListener('change', (e) => {
            const opt = e.target.options[e.target.selectedIndex];
            inputCond.value = opt.dataset.condominio || '';
        });
    }

    document.getElementById('btn-fechar-modal-preventiva').addEventListener('click', () => modalPrev.classList.add('hidden')); 
    document.getElementById('btn-cancelar-preventiva').addEventListener('click', (e) => { e.preventDefault(); modalPrev.classList.add('hidden'); });
    
    formPrev.addEventListener('submit', (e) => {
        e.preventDefault(); 
        if(!formPrev.checkValidity() || !selectEquip.value) { alert("Selecione um equipamento e preencha todos os dados."); return; }
        const dados = getDados(); const numId = dados.preventivas.length > 0 ? Math.max(...dados.preventivas.map(p => p.id)) + 1 : 1;
        const eqObj = dados.equipamentos.find(eq => eq.id == selectEquip.value);
        dados.preventivas.push({ 
            id: numId, 
            equipamentoNome: eqObj ? eqObj.nome : 'Equipamento', 
            condominio: inputCond.value, 
            periodicidade: document.getElementById('input-prev-periodicidade').value, 
            proximaData: document.getElementById('input-prev-proxima').value,
            tecnico: document.getElementById('input-prev-tecnico').value
        });
        salvarDados(dados); renderizarTabelaPreventivas(); modalPrev.classList.add('hidden'); formPrev.reset(); alert("Preventiva cadastrada.");
    });
}

function renderizarTabelaPreventivas() {
    const dados = getDados(); const tbody = document.querySelector('#tabela-preventivas tbody'); if(!tbody) return; tbody.innerHTML = '';
    if(dados.preventivas.length === 0) { tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:var(--text-muted);">Nenhuma preventiva programada.</td></tr>`; return; }
    dados.preventivas.forEach(p => { tbody.innerHTML += `<tr><td><strong>${p.equipamentoNome}</strong></td><td>${p.condominio}</td><td>${p.periodicidade}</td><td>${p.proximaData.split('-').reverse().join('/')}</td><td><span class="badge badge-prev-prazo">Agendada</span></td></tr>`; });
}


// ==========================================================
// CHAMADOS E OS (ADMIN)
// ==========================================================
function atualizarDashboardAdmin() {
    const dados = getDados(); const ordens = dados.ordensServico || []; const chamados = dados.chamados || [];
    if(document.getElementById('count-os')) document.getElementById('count-os').textContent = chamados.filter(c => c.status === 'Novo').length;
    if(document.getElementById('count-andamento')) document.getElementById('count-andamento').textContent = ordens.filter(os => os.status === 'Em andamento').length;
    if(document.getElementById('count-atrasadas')) document.getElementById('count-atrasadas').textContent = ordens.filter(os => os.status === 'Atrasada').length;
}

function configurarModuloChamadosAdmin() {
    // OS Avulsa (botão na tela de OS)
    const btnAbrirOSAvulsa = document.getElementById('btn-abrir-modal-os-avulsa');
    if(btnAbrirOSAvulsa) {
        btnAbrirOSAvulsa.addEventListener('click', () => {
            const modalOsAvulsa = document.getElementById('modal-nova-os-avulsa');
            if(modalOsAvulsa) modalOsAvulsa.classList.remove('hidden');
        });
    }

    const btnCancOSAvulsa = document.getElementById('btn-canc-os-av');
    if(btnCancOSAvulsa) {
        btnCancOSAvulsa.addEventListener('click', () => document.getElementById('modal-nova-os-avulsa').classList.add('hidden'));
    }

    const btnFechaOSAvulsa = document.getElementById('btn-fechar-modal-os-avulsa');
    if(btnFechaOSAvulsa) {
        btnFechaOSAvulsa.addEventListener('click', () => document.getElementById('modal-nova-os-avulsa').classList.add('hidden'));
    }

    const formOsAvulsa = document.getElementById('form-nova-os-avulsa');
    if(formOsAvulsa) {
        formOsAvulsa.addEventListener('submit', (e) => {
            e.preventDefault(); 
            const dados = getDados(); 
            const novoId = dados.ordensServico.length > 0 ? Math.max(...dados.ordensServico.map(os => os.id)) + 1 : 1001;
            const hj = new Date().toISOString().split('T')[0];
            dados.ordensServico.push({ 
                id: novoId, chamadoId: null, condominio: document.getElementById('input-os-av-cond').value, 
                localOriginal: "Avulso", problemaOriginal: document.getElementById('input-os-av-servico').value, 
                dataFormatoEN: hj, data: hj.split('-').reverse().join('/'), hora: "08:00", 
                tecnico: document.getElementById('input-os-av-tec').value, status: "Agendada", diagnostico: "", materiais: "" 
            });
            salvarDados(dados); 
            document.getElementById('modal-nova-os-avulsa').classList.add('hidden'); 
            formOsAvulsa.reset(); renderizarTabelaOSAdmin(); alert("OS Avulsa Criada!");
        });
    }
}

window.filtrarChamados = function(status) {
    const abas = document.querySelectorAll('#page-chamados .filter-tab');
    abas.forEach(t => t.classList.remove('active')); event.target.classList.add('active');
    renderizarTabelaChamadosAdmin(status);
};

function renderizarTabelaChamadosAdmin(filtro = 'Todos') {
    const dados = getDados(); const tbody = document.querySelector('#tabela-chamados tbody'); if(!tbody) return; tbody.innerHTML = '';
    let lista = dados.chamados; if(filtro !== 'Todos') lista = lista.filter(c => c.status === filtro);
    if(lista.length === 0) { tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:var(--text-muted);">Nenhum chamado encontrado.</td></tr>`; return;}
    
    [...lista].reverse().forEach(c => {
        let badge = 'badge-status-novo';
        if(c.status === 'Agendado') badge = 'badge-status-agendada';
        if(c.status === 'Em atendimento') badge = 'badge-status-andamento';
        if(c.status === 'Concluído') badge = 'badge-status-concluida';

        tbody.innerHTML += `
            <tr>
                <td>#${c.id}</td>
                <td><strong>${c.condominio}</strong><br><small style="color:var(--text-muted);">${c.local}</small></td>
                <td>${c.problema}</td>
                <td><span class="badge ${badge}">${c.status}</span></td>
                <td style="text-align: right;"><button class="btn btn-primary" style="padding: 4px 10px; font-size: 11px;" onclick="abrirAdminChamado(${c.id})">Analisar</button></td>
            </tr>
        `;
    });
}

window.abrirAdminChamado = function(id) {
    const dados = getDados(); const chamado = dados.chamados.find(c => c.id == id); if(!chamado) return;
    
    document.getElementById('modal-chamado-titulo').textContent = `Chamado #${chamado.id} — ${chamado.condominio}`;
    if(document.getElementById('modal-chamado-local')) document.getElementById('modal-chamado-local').textContent = chamado.local;
    if(document.getElementById('modal-chamado-problema')) document.getElementById('modal-chamado-problema').textContent = chamado.problema;
    if(document.getElementById('modal-chamado-cat')) document.getElementById('modal-chamado-cat').textContent = chamado.categoria;
    if(document.getElementById('modal-chamado-prio')) document.getElementById('modal-chamado-prio').textContent = chamado.prioridade;
    if(document.getElementById('modal-chamado-data')) document.getElementById('modal-chamado-data').textContent = chamado.data;

    const elData = document.getElementById('conv-os-data');
    if(elData) elData.value = new Date().toISOString().split('T')[0];

    const osExistente = dados.ordensServico.find(os => os.chamadoId == chamado.id);
    const blocoConv = document.getElementById('bloco-conversao-os');
    const footer = document.getElementById('modal-chamado-footer');

    if(osExistente) {
        if(blocoConv) blocoConv.classList.add('hidden');
        if(footer) footer.innerHTML = `<button class="btn btn-primary" onclick="document.getElementById('modal-detalhe-chamado').classList.add('hidden'); abrirVisualizacaoOS(${osExistente.id})">Ver Ordem de Serviço Gerada</button>`;
    } else {
        if(blocoConv) blocoConv.classList.remove('hidden');
        if(footer) footer.innerHTML = `
            <button class="btn btn-ghost" onclick="document.getElementById('modal-detalhe-chamado').classList.add('hidden')">Fechar</button>
            <button class="btn btn-primary" onclick="converterChamadoParaOS(${chamado.id})">Confirmar e Criar OS</button>
        `;
    }
    document.getElementById('modal-detalhe-chamado').classList.remove('hidden');
};

window.converterChamadoParaOS = function(chamadoId) {
    const dados = getDados(); const chamado = dados.chamados.find(c => c.id == chamadoId); if(!chamado) return;
    const dataEN = document.getElementById('conv-os-data').value;
    const hora = document.getElementById('conv-os-hora').value;
    const tecnico = document.getElementById('conv-os-tecnico').value;

    if(!dataEN || !hora || !tecnico) { alert("Preencha Técnico, Data e Hora para gerar a OS."); return; }

    const novoId = dados.ordensServico.length > 0 ? Math.max(...dados.ordensServico.map(os => os.id)) + 1 : 1001;
    
    dados.ordensServico.push({
        id: novoId, chamadoId: chamado.id, condominio: chamado.condominio, localOriginal: chamado.local, 
        problemaOriginal: chamado.problema, dataFormatoEN: dataEN, data: dataEN.split('-').reverse().join('/'), 
        hora: hora, tecnico: tecnico, status: "Agendada", diagnostico: "", materiais: ""
    });

    chamado.status = "Agendado";
    salvarDados(dados);

    document.getElementById('modal-detalhe-chamado').classList.add('hidden');
    renderizarTabelaChamadosAdmin();
    alert(`Ordem de Serviço #${novoId} criada e vinculada com sucesso!`);
};

function configurarModuloOSAdmin() {}

window.filtrarOS = function(status) {
    const abas = document.querySelectorAll('#page-os .filter-tab');
    abas.forEach(t => t.classList.remove('active')); event.target.classList.add('active');
    renderizarTabelaOSAdmin(status);
};

function renderizarTabelaOSAdmin(filtro = 'Todas') {
    const dados = getDados(); const tbody = document.querySelector('#tabela-os tbody'); if(!tbody) return; tbody.innerHTML = '';
    let lista = dados.ordensServico; if(filtro !== 'Todas') lista = lista.filter(os => os.status === filtro);
    if(lista.length === 0) { tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:var(--text-muted);">Nenhuma OS.</td></tr>`; return;}
    
    [...lista].reverse().forEach(os => {
        let badge = 'badge-status-aberta';
        if(os.status === 'Agendada') badge = 'badge-status-agendada';
        if(os.status === 'Em andamento') badge = 'badge-status-andamento';
        if(os.status === 'Concluída') badge = 'badge-status-concluida';

        tbody.innerHTML += `
            <tr>
                <td>#${os.id}</td>
                <td><strong>${os.condominio}</strong></td>
                <td>${os.problemaOriginal || 'Serviço Avulso'}</td>
                <td style="font-size:12px;">${os.data} às ${os.hora}</td>
                <td>${os.tecnico}</td>
                <td><span class="badge ${badge}">${os.status}</span></td>
                <td style="text-align: right;"><button class="btn btn-primary" style="padding: 4px 10px; font-size: 11px;" onclick="abrirVisualizacaoOS(${os.id})">Visualizar</button></td>
            </tr>
        `;
    });
}

window.abrirVisualizacaoOS = function(id) {
    const dados = getDados(); const os = dados.ordensServico.find(o => o.id == id); if(!os) return;
    if(document.getElementById('exec-os-titulo')) document.getElementById('exec-os-titulo').textContent = `OS #${os.id} — Status: ${os.status}`;
    if(document.getElementById('exec-os-condominio')) document.getElementById('exec-os-condominio').textContent = os.condominio;
    if(document.getElementById('exec-os-local')) document.getElementById('exec-os-local').textContent = os.localOriginal || 'Geral';
    if(document.getElementById('exec-os-problema')) document.getElementById('exec-os-problema').textContent = os.problemaOriginal || 'Serviço sob demanda';
    
    const acoes = document.getElementById('bloco-tecnico-acoes');
    if(acoes) acoes.classList.add('hidden');
    
    const blocoLaudo = document.getElementById('bloco-laudo-final');
    if(blocoLaudo) {
        if(os.status === 'Concluída') {
            blocoLaudo.classList.remove('hidden');
            document.getElementById('laudo-os-diag').textContent = os.diagnostico;
            document.getElementById('laudo-os-mat').textContent = os.materiais || 'Nenhum material utilizado.';
        } else {
            blocoLaudo.classList.add('hidden');
        }
    }
    
    const modOS = document.getElementById('modal-execucao-os');
    if(modOS) modOS.classList.remove('hidden');
};


// ==========================================================
// SÍNDICO: ABERTURA E ACOMPANHAMENTO DE CHAMADOS
// ==========================================================
function configurarModuloPortalSindico() {
    const formChamado = document.getElementById('form-sindico-chamado');
    if(formChamado) {
        formChamado.addEventListener('submit', (e) => {
            e.preventDefault();
            if(!formChamado.checkValidity()) { alert("Verifique os campos obrigatórios."); return; }
            const dados = getDados();
            const novoId = dados.chamados.length > 0 ? Math.max(...dados.chamados.map(c => c.id)) + 1 : 101;
            const condAtual = document.getElementById('seletor-condominio-sindico').value;

            dados.chamados.push({
                id: novoId,
                condominio: condAtual,
                local: document.getElementById('input-sind-chamado-local').value,
                categoria: document.getElementById('input-sind-chamado-cat').value,
                problema: document.getElementById('input-sind-chamado-desc').value,
                prioridade: "Normal",
                status: "Novo",
                data: new Date().toLocaleDateString('pt-BR'),
                laudoTecnico: "", materiaisUsados: ""
            });

            salvarDados(dados); alert(`Chamado #${novoId} enviado com sucesso! A empresa foi notificada.`);
            formChamado.reset(); irParaTela('sindico-meus-chamados'); atualizarPortalSindico();
        });
    }

    const selCond = document.getElementById('seletor-condominio-sindico');
    if(selCond) selCond.addEventListener('change', atualizarPortalSindico);
}

function atualizarPortalSindico() {
    const dados = getDados();
    const selCond = document.getElementById('seletor-condominio-sindico');
    
    if(selCond && selCond.options.length === 0) {
        dados.condominios.forEach(c => { selCond.innerHTML += `<option value="${c.nome}">${c.nome}</option>`; });
    }

    const condominioSelecionado = selCond ? selCond.value : (dados.condominios[0] ? dados.condominios[0].nome : '');
    const chamadosSindico = dados.chamados.filter(c => c.condominio === condominioSelecionado);

    if(document.getElementById('input-sind-chamado-cond')) document.getElementById('input-sind-chamado-cond').value = condominioSelecionado;

    // Tabela Meus Chamados
    const tbodyTodos = document.querySelector('#tabela-sindico-todos tbody');
    if(tbodyTodos) {
        tbodyTodos.innerHTML = '';
        if(chamadosSindico.length === 0) tbodyTodos.innerHTML = `<tr><td colspan="6" style="text-align:center;">Nenhum chamado aberto.</td></tr>`;
        
        [...chamadosSindico].reverse().forEach(c => {
            let badge = 'badge-status-novo';
            if(c.status === 'Agendado') badge = 'badge-status-agendada';
            if(c.status === 'Em atendimento') badge = 'badge-status-andamento';
            if(c.status === 'Concluído') badge = 'badge-status-concluida';

            tbodyTodos.innerHTML += `
                <tr>
                    <td><strong>#${c.id}</strong></td>
                    <td>${c.local || '-'}</td>
                    <td>${c.problema}</td>
                    <td>${c.data}</td>
                    <td><span class="badge ${badge}">${c.status}</span></td>
                    <td style="text-align: right;"><button class="btn btn-primary" style="padding: 4px 10px; font-size: 11px;" onclick="abrirAcompanhamentoSindico(${c.id})">Visualizar</button></td>
                </tr>
            `;
        });
    }
}

window.abrirAcompanhamentoSindico = function(id) {
    const dados = getDados(); const chamado = dados.chamados.find(c => c.id == id); if(!chamado) return;
    
    document.getElementById('sind-acomp-titulo').textContent = `Chamado #${chamado.id}`;
    document.getElementById('sind-acomp-problema').textContent = chamado.problema;
    document.getElementById('sind-acomp-local').textContent = `Local: ${chamado.local}`;

    let p1 = 'active', p2 = '', p3 = '', p4 = '';
    if (chamado.status === 'Agendado') { p1 = 'completed'; p2 = 'active'; }
    if (chamado.status === 'Em atendimento') { p1 = 'completed'; p2 = 'completed'; p3 = 'active'; }
    if (chamado.status === 'Concluído') { p1 = 'completed'; p2 = 'completed'; p3 = 'completed'; p4 = 'completed'; }

    const getIcon = (state) => {
        if(state === 'completed') return '<span class="material-symbols-outlined" style="color:#16a34a;">check_circle</span>';
        if(state === 'active') return '<span class="material-symbols-outlined" style="color:var(--primary-color);">radio_button_checked</span>';
        return '<span class="material-symbols-outlined" style="color:#94a3b8;">radio_button_unchecked</span>';
    };
    const getColor = (state) => {
        if(state === 'completed') return '#16a34a';
        if(state === 'active') return 'var(--text-main)';
        return '#94a3b8';
    };

    document.getElementById('sind-acomp-timeline').innerHTML = `
        <div style="display:flex; align-items:center; gap:8px; color:${getColor(p1)}; font-weight:${p1==='active'?'600':'400'}">${getIcon(p1)} Solicitação Aberta</div>
        <div style="display:flex; align-items:center; gap:8px; color:${getColor(p2)}; font-weight:${p2==='active'?'600':'400'}">${getIcon(p2)} Recebido e Agendado</div>
        <div style="display:flex; align-items:center; gap:8px; color:${getColor(p3)}; font-weight:${p3==='active'?'600':'400'}">${getIcon(p3)} Técnico em Atendimento Local</div>
        <div style="display:flex; align-items:center; gap:8px; color:${getColor(p4)}; font-weight:${p4==='completed'?'600':'400'}">${getIcon(p4)} Serviço Concluído</div>
    `;

    const laudoBox = document.getElementById('sind-acomp-laudo-box');
    if (chamado.status === 'Concluído') {
        laudoBox.classList.remove('hidden');
        document.getElementById('sind-acomp-laudo-txt').textContent = chamado.laudoTecnico || 'Serviço executado com sucesso.';
        document.getElementById('sind-acomp-laudo-mat').textContent = chamado.materiaisUsados || 'Nenhum material necessário.';
    } else {
        laudoBox.classList.add('hidden');
    }

    document.getElementById('modal-sindico-acompanhamento').classList.remove('hidden');
};


// ==========================================================
// TÉCNICO DE CAMPO: EXECUÇÃO DA OS (MOBILE)
// ==========================================================
function configurarModuloOSTecnico() {}

function atualizarPortalTecnico(nomeLogado) {
    if(!nomeLogado) nomeLogado = TÉCNICO_LOGADO;
    const dados = getDados();
    const ordens = dados.ordensServico.filter(os => os.tecnico === nomeLogado);
    
    const proximoContainer = document.getElementById('tec-proximo-atendimento');
    if(proximoContainer) {
        const proximas = ordens.filter(os => os.status === 'Agendada' || os.status === 'Em andamento');
        if(proximas.length > 0) {
            const p = proximas[0];
            proximoContainer.innerHTML = `
                <div class="card clickable-card" style="border-left: 6px solid var(--primary-color); padding: 18px;" onclick="abrirExecucaoOSMobile(${p.id})">
                    <div style="display:flex; justify-content:space-between; margin-bottom:12px;">
                        <span style="font-size:24px; font-weight:700; color:var(--primary-color);">${p.hora}</span>
                        <span class="badge badge-status-andamento">${p.status}</span>
                    </div>
                    <p style="font-size:16px; font-weight:700; margin-bottom:2px;">${p.condominio}</p>
                    <p style="font-size:13px; color:var(--text-muted); margin-bottom: 16px;">Local: ${p.localOriginal || 'Geral'}</p>
                    <button class="btn btn-primary btn-block" style="margin:0;">Visualizar OS</button>
                </div>
            `;
        } else {
            proximoContainer.innerHTML = `<div class="card"><p style="text-align:center; color:var(--text-muted); font-weight:600;">Nenhuma OS pendente.</p></div>`;
        }
    }
    window.mudarFiltroTecnico('Pendentes');
}

window.mudarFiltroTecnico = function(filtro) {
    const abas = document.querySelectorAll('#page-tecnico-os .filter-tab');
    abas.forEach(t => t.classList.remove('active')); event.target.classList.add('active');
    
    const dados = getDados(); 
    const session = JSON.parse(localStorage.getItem('mp_session'));
    const nomeLogado = session ? session.nome : TÉCNICO_LOGADO;
    
    const ordens = dados.ordensServico.filter(os => os.tecnico === nomeLogado);
    const containerLista = document.getElementById('container-tec-lista-os');
    if(!containerLista) return;
    containerLista.innerHTML = '';

    let filtradas = ordens;
    if(filtro === 'Pendentes') filtradas = ordens.filter(os => os.status !== 'Concluída');
    if(filtro === 'Concluídas') filtradas = ordens.filter(os => os.status === 'Concluída');

    if(filtradas.length === 0) { containerLista.innerHTML = `<p style="text-align:center; color:var(--text-muted);">Nenhuma OS.</p>`; return; }

    filtradas.forEach(os => {
        let b = os.status==='Concluída' ? 'badge-status-concluida' : 'badge-status-andamento';
        containerLista.innerHTML += `
            <div class="task-card" onclick="abrirExecucaoOSMobile(${os.id})" style="cursor:pointer;">
                <div class="task-header"><span class="task-id">OS #${os.id}</span><span class="badge ${b}">${os.status}</span></div>
                <div class="task-info">
                    <p style="font-size:12px; color:var(--text-muted);">${os.data} às ${os.hora}</p>
                    <p class="title">${os.condominio}</p>
                    <p class="desc">${os.problemaOriginal || os.servico}</p>
                </div>
            </div>
        `;
    });
};

window.abrirExecucaoOSMobile = function(id) {
    const dados = getDados(); const os = dados.ordensServico.find(o => o.id == id); if(!os) return;
    
    if(document.getElementById('exec-os-titulo')) document.getElementById('exec-os-titulo').textContent = `OS #${os.id}`;
    if(document.getElementById('exec-os-condominio')) document.getElementById('exec-os-condominio').textContent = os.condominio;
    if(document.getElementById('exec-os-local')) document.getElementById('exec-os-local').textContent = os.localOriginal || 'Geral';
    if(document.getElementById('exec-os-problema')) document.getElementById('exec-os-problema').textContent = os.problemaOriginal || os.servico;

    document.getElementById('bloco-tecnico-acoes').classList.remove('hidden');
    document.getElementById('bloco-laudo-final').classList.add('hidden');

    const btnIniciar = document.getElementById('btn-iniciar-os');
    const blocoForm = document.getElementById('bloco-tecnico-formulario');

    if(os.status === 'Concluída') {
        btnIniciar.classList.add('hidden'); blocoForm.classList.add('hidden');
        document.getElementById('bloco-laudo-final').classList.remove('hidden');
        document.getElementById('laudo-os-diag').textContent = os.diagnostico;
        document.getElementById('laudo-os-mat').textContent = os.materiais || 'Nenhum material utilizado.';
    } else if(os.status === 'Em andamento') {
        btnIniciar.classList.add('hidden'); blocoForm.classList.remove('hidden');
    } else {
        btnIniciar.classList.remove('hidden'); blocoForm.classList.add('hidden');
        btnIniciar.onclick = () => {
            os.status = 'Em andamento';
            if(os.chamadoId) { const ch = dados.chamados.find(c => c.id == os.chamadoId); if(ch) ch.status = 'Em atendimento'; }
            salvarDados(dados); abrirExecucaoOSMobile(id);
            const session = JSON.parse(localStorage.getItem('mp_session'));
            atualizarPortalTecnico(session ? session.nome : TÉCNICO_LOGADO);
        };
    }

    const btnFinalizar = document.getElementById('btn-finalizar-os');
    if(btnFinalizar) {
        btnFinalizar.onclick = () => {
            const diag = document.getElementById('exec-input-diag').value;
            if(!diag || diag.trim() === '') { alert("Descreva o serviço realizado."); return; }
            const mat = document.getElementById('exec-input-materiais').value;
            os.diagnostico = diag; os.materiais = mat; os.status = 'Concluída';

            if(os.chamadoId) {
                const ch = dados.chamados.find(c => c.id == os.chamadoId);
                if(ch) { ch.status = 'Concluído'; ch.laudoTecnico = diag; ch.materiaisUsados = mat; }
            }
            salvarDados(dados); document.getElementById('modal-execucao-os').classList.add('hidden');
            const session = JSON.parse(localStorage.getItem('mp_session'));
            atualizarPortalTecnico(session ? session.nome : TÉCNICO_LOGADO);
            alert("Ordem de serviço finalizada com sucesso!");
        };
    }

    document.getElementById('modal-execucao-os').classList.remove('hidden');
};

// ==========================================================
// CONFIGURAÇÕES WHITE LABEL (PAINEL ADMIN)
// ==========================================================
function configurarTelaConfiguracoesWhiteLabel() {
    const form = document.getElementById('form-configuracoes'); if(!form) return;
    const dados = getDados(); const s = dados.settings;
    
    document.getElementById('input-config-system').value = s.systemName || '';
    document.getElementById('input-config-empresa').value = s.companyName || '';
    document.getElementById('input-config-color').value = s.primaryColor || '#1e40af';

    const inputFile = document.getElementById('input-config-logo');
    if(inputFile) {
        inputFile.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if(file) {
                const reader = new FileReader();
                reader.onload = function(event) { inputFile.dataset.base64 = event.target.result; };
                reader.readAsDataURL(file);
            }
        });
    }

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        if(!form.checkValidity()) { alert("Verifique os campos obrigatórios."); return; }
        const configSalvar = getDados();
        configSalvar.settings.systemName = document.getElementById('input-config-system').value;
        configSalvar.settings.companyName = document.getElementById('input-config-empresa').value;
        configSalvar.settings.primaryColor = document.getElementById('input-config-color').value;
        if(inputFile && inputFile.dataset.base64) configSalvar.settings.logoBase64 = inputFile.dataset.base64;
        
        salvarDados(configSalvar); aplicarConfiguracoesVisuaisInternas();
        alert("Identidade visual aplicada com sucesso!");
    });
}

// ==========================================================
// AGENDA E ROTAS (MÓDULO DE RENDERIZAÇÃO)
// ==========================================================
function configurarModuloAgendaRotas() {
    // Apenas preenche a tela quando a aba Agenda for clicada (já é feito pelo configurarNavegacao)
}

function renderizarAgendaRotas() {
    const dados = getDados();
    const container = document.getElementById('agenda-horarios-container');
    if(!container) return;
    container.innerHTML = '';
    
    let ordens = dados.ordensServico.filter(os => os.status !== 'Concluída');
    if(ordens.length === 0) {
        container.innerHTML = `<p style="text-align:center; color:var(--text-muted); padding:20px;">Nenhum agendamento programado.</p>`;
        return;
    }

    ordens.sort((a,b) => (a.hora || '00:00').localeCompare(b.hora || '00:00'));
    ordens.forEach(os => {
        container.innerHTML += `
            <div class="timeline-item">
                <div class="timeline-dot"><span class="material-symbols-outlined" style="font-size:14px;">schedule</span></div>
                <div class="timeline-content">
                    <div class="timeline-header"><span class="timeline-time">${os.hora} (${os.data})</span><span class="badge badge-status-andamento">${os.tecnico}</span></div>
                    <div class="timeline-title">${os.condominio}</div>
                    <div class="timeline-desc">OS #${os.id} — ${os.servico}</div>
                </div>
            </div>
        `;
    });
}

// ==========================================================
// RELATÓRIOS
// ==========================================================
function configurarModuloRelatorios() {}
function atualizarRelatorios() {
    // Basic Stub for the View page that just shows the count.
}