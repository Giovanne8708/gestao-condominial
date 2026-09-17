const TÉCNICO_LOGADO = "João Silva";
let osTecnicoAberta = null; 

document.addEventListener('DOMContentLoaded', () => {
    inicializarSistema();
    configurarNavegacao();
    configurarMenuMobile();
    configurarSeletorPerfil();
    configurarModuloPortalSindico();
    configurarModuloChamados();
    configurarModuloOS();
    configurarModuloAgendaRotas();
    configurarModuloCondominios();
    configurarModuloEquipamentos();
    configurarModuloPreventivas();
    configurarModuloMateriais();
    configurarModuloDocumentos();
});

window.irParaTela = function(tela) {
    const link = document.querySelector(`.nav-item[data-page="${tela}"]`);
    if(link) link.click();
};

function inicializarSistema() {
    if (!localStorage.getItem('mp_data')) {
        const emptyData = {
            settings: { companyName: "Manutenção Pro", primaryColor: "#1e40af" },
            chamados: [{ id: 101, condominio: "Residencial Jardim das Palmeiras", local: "Piscina", categoria: "Bombas", problema: "Bomba fazendo barulho", prioridade: "Alta", status: "Novo", data: new Date().toLocaleDateString('pt-BR') }], 
            ordensServico: [{ id: 1048, chamadoId: null, condominio: "Residencial Jardim das Palmeiras", servico: "Manutenção da bomba principal", dataFormatoEN: new Date().toISOString().split('T')[0], data: new Date().toLocaleDateString('pt-BR'), hora: "14:00", tecnico: TÉCNICO_LOGADO, status: "Agendada", diagnostico: "", materiais: "" }], 
            condominios: [{ id: 1, nome: "Residencial Jardim das Palmeiras", endereco: "Av. Beira Rio, 1000", sindico: "João Siqueira", telefone: "(81) 99888-7766", email: "joao.sindico@email.com", status: "Ativo" }], 
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
    menuAdmin.classList.add('hidden'); menuSindico.classList.add('hidden'); menuTecnico.classList.add('hidden');

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
            
            if(targetPage === 'chamados') renderizarTabelaChamados();
            if(targetPage === 'os') renderizarTabelaOS();
            if(targetPage === 'condominios') renderizarTabelaCondominios();
            if(targetPage === 'equipamentos') renderizarTabelaEquipamentos();
            if(targetPage === 'materiais') renderizarTabelaMateriais();
            if(targetPage === 'preventivas') renderizarTabelaPreventivas();
            if(targetPage === 'documentos') renderizarTabelaDocumentos();
        });
    });
}

function configurarMenuMobile() {
    const btn = document.getElementById('mobile-menu-btn');
    if(btn) btn.addEventListener('click', () => document.getElementById('sidebar').classList.toggle('open'));
}

/* ==========================================================
   CONFIGURAÇÃO DOS MÓDULOS DE CADASTRO COM NOVA VALIDAÇÃO
========================================================== */

function configurarModuloEquipamentos() {
    const btnAbrir = document.getElementById('btn-abrir-modal-equipamento'); if(!btnAbrir) return;
    const modal = document.getElementById('modal-novo-equipamento'); 
    const form = document.getElementById('form-novo-equipamento');
    const selectCond = document.getElementById('input-equip-condominio');
    const fecharModal = () => { modal.classList.add('hidden'); form.reset(); };

    btnAbrir.addEventListener('click', () => {
        const dados = getDados(); selectCond.innerHTML = ''; 
        dados.condominios.forEach(c => { selectCond.innerHTML += `<option value="${c.nome}">${c.nome}</option>`; });
        modal.classList.remove('hidden');
    });
    document.getElementById('btn-fechar-modal-equipamento').addEventListener('click', fecharModal); 
    document.getElementById('btn-cancelar-equipamento').addEventListener('click', (e) => { e.preventDefault(); fecharModal(); });
    
    form.addEventListener('submit', (e) => {
        e.preventDefault(); 
        if(!form.checkValidity()) {
            alert("Não foi possível salvar. Verifique os campos obrigatórios.");
            return;
        }
        const dados = getDados(); 
        const numId = dados.equipamentos.length > 0 ? Math.max(...dados.equipamentos.map(eq => eq.id)) + 1 : 1;
        dados.equipamentos.push({ id: numId, codigo: `EQ-${String(numId).padStart(3,'0')}`, nome: document.getElementById('input-equip-nome').value, categoria: document.getElementById('input-equip-categoria').value, condominio: selectCond.value, status: document.getElementById('input-equip-status').value });
        salvarDados(dados); renderizarTabelaEquipamentos(); fecharModal();
        alert("Equipamento cadastrado com sucesso.");
    });
}

function renderizarTabelaEquipamentos() {
    const dados = getDados(); const tbody = document.querySelector('#tabela-equipamentos tbody'); if(!tbody) return; tbody.innerHTML = '';
    dados.equipamentos.forEach(eq => { tbody.innerHTML += `<tr><td><strong>${eq.codigo}</strong></td><td>${eq.nome}</td><td>${eq.condominio}</td><td>${eq.categoria}</td><td><span class="badge badge-status-ativo">${eq.status}</span></td></tr>`; });
}

function configurarModuloCondominios() {
    const btnAbrir = document.getElementById('btn-abrir-modal-condominio'); if(!btnAbrir) return; 
    const modalCond = document.getElementById('modal-novo-condominio'); 
    const formCond = document.getElementById('form-novo-condominio');
    const fecharModal = () => { modalCond.classList.add('hidden'); formCond.reset(); };
    btnAbrir.addEventListener('click', () => modalCond.classList.remove('hidden'));
    document.getElementById('btn-fechar-modal-condominio').addEventListener('click', fecharModal); 
    document.getElementById('btn-cancelar-condominio').addEventListener('click', (e) => { e.preventDefault(); fecharModal(); });
    
    formCond.addEventListener('submit', (e) => {
        e.preventDefault(); 
        if(!formCond.checkValidity()) {
            alert("Não foi possível salvar. Verifique os campos obrigatórios.");
            return;
        }
        const dados = getDados(); const novoId = dados.condominios.length > 0 ? Math.max(...dados.condominios.map(c => c.id)) + 1 : 1;
        dados.condominios.push({ id: novoId, nome: document.getElementById('input-cond-nome').value, endereco: document.getElementById('input-cond-endereco').value, sindico: document.getElementById('input-cond-sindico').value, telefone: document.getElementById('input-cond-telefone').value, email: document.getElementById('input-cond-email').value, status: document.getElementById('input-cond-status').value });
        salvarDados(dados); renderizarTabelaCondominios(); fecharModal();
        alert("Condomínio cadastrado com sucesso.");
    });
}

function renderizarTabelaCondominios() {
    const dados = getDados(); const tbody = document.querySelector('#tabela-condominios tbody'); if(!tbody) return; tbody.innerHTML = '';
    dados.condominios.forEach(c => { tbody.innerHTML += `<tr><td><strong>${c.nome}</strong></td><td>${c.endereco}</td><td>${c.sindico}</td><td><span class="badge badge-status-ativo">${c.status}</span></td></tr>`; });
}

function configurarModuloPreventivas() {
    const btnAbrir = document.getElementById('btn-abrir-modal-preventiva'); if(!btnAbrir) return;
    const modalPrev = document.getElementById('modal-nova-preventiva'); 
    const formPrev = document.getElementById('form-nova-preventiva');
    const selectEquip = document.getElementById('input-prev-equipamento'); const inputCond = document.getElementById('input-prev-condominio');
    const fecharModal = () => { modalPrev.classList.add('hidden'); formPrev.reset(); };

    btnAbrir.addEventListener('click', () => {
        const dados = getDados(); selectEquip.innerHTML = '<option value="">Selecione...</option>';
        dados.equipamentos.forEach(eq => {
            const opt = document.createElement('option'); opt.value = eq.id; opt.textContent = `${eq.codigo} - ${eq.nome}`;
            opt.dataset.condominio = eq.condominio; selectEquip.appendChild(opt);
        });
        modalPrev.classList.remove('hidden');
    });
    selectEquip.addEventListener('change', (e) => {
        const opt = e.target.options[e.target.selectedIndex];
        inputCond.value = opt.dataset.condominio || '';
    });
    document.getElementById('btn-fechar-modal-preventiva').addEventListener('click', fecharModal); 
    document.getElementById('btn-cancelar-preventiva').addEventListener('click', (e) => { e.preventDefault(); fecharModal(); });
    
    formPrev.addEventListener('submit', (e) => {
        e.preventDefault(); 
        if(!formPrev.checkValidity() || !selectEquip.value) {
            alert("Não foi possível salvar. Verifique os campos obrigatórios.");
            return;
        }
        const dados = getDados(); const numId = dados.preventivas.length > 0 ? Math.max(...dados.preventivas.map(p => p.id)) + 1 : 1;
        const eqObj = dados.equipamentos.find(eq => eq.id == selectEquip.value);
        dados.preventivas.push({ id: numId, equipamentoNome: eqObj ? eqObj.nome : 'Equipamento', condominio: inputCond.value, periodicidade: document.getElementById('input-prev-periodicidade').value, proximaData: document.getElementById('input-prev-proxima').value });
        salvarDados(dados); renderizarTabelaPreventivas(); fecharModal();
        alert("Preventiva cadastrada com sucesso.");
    });
}
function renderizarTabelaPreventivas() {
    const dados = getDados(); const tbody = document.querySelector('#tabela-preventivas tbody'); if(!tbody) return; tbody.innerHTML = '';
    dados.preventivas.forEach(p => { tbody.innerHTML += `<tr><td><strong>${p.equipamentoNome}</strong></td><td>${p.condominio}</td><td>${p.periodicidade}</td><td>${p.proximaData.split('-').reverse().join('/')}</td><td><span class="badge badge-prev-prazo">Agendada</span></td></tr>`; });
}

function configurarModuloOS() {
    const btnAbrirOS = document.getElementById('btn-abrir-modal-os'); if(!btnAbrirOS) return;
    const modalOS = document.getElementById('modal-nova-os'); const formOS = document.getElementById('form-nova-os');
    const fecharModal = () => { modalOS.classList.add('hidden'); formOS.reset(); };
    btnAbrirOS.addEventListener('click', () => { document.getElementById('input-os-data').value = new Date().toISOString().split('T')[0]; modalOS.classList.remove('hidden'); });
    document.getElementById('btn-fechar-modal-os').addEventListener('click', fecharModal); document.getElementById('btn-cancelar-os').addEventListener('click', (e) => { e.preventDefault(); fecharModal(); });
    formOS.addEventListener('submit', (e) => {
        e.preventDefault(); 
        if(!formOS.checkValidity()) { alert("Não foi possível salvar. Verifique os campos obrigatórios."); return; }
        const dados = getDados(); const novoId = dados.ordensServico.length > 0 ? Math.max(...dados.ordensServico.map(os => os.id)) + 1 : 1001;
        dados.ordensServico.push({ id: novoId, chamadoId: null, condominio: document.getElementById('input-os-condominio').value, servico: document.getElementById('input-os-servico').value, dataFormatoEN: document.getElementById('input-os-data').value, data: document.getElementById('input-os-data').value.split('-').reverse().join('/'), hora: document.getElementById('input-os-hora').value, tecnico: document.getElementById('input-os-tecnico').value, status: document.getElementById('input-os-status').value, diagnostico: "" });
        salvarDados(dados); renderizarTabelaOS(); fecharModal(); alert("Ordem de serviço gerada com sucesso.");
    });
}
function renderizarTabelaOS() {
    const dados = getDados(); const tbody = document.querySelector('#tabela-os tbody'); if(!tbody) return; tbody.innerHTML = '';
    dados.ordensServico.forEach(os => { tbody.innerHTML += `<tr><td>#${os.id}</td><td><strong>${os.condominio}</strong></td><td>${os.servico}</td><td>${os.data}</td><td>${os.tecnico}</td><td><span class="badge badge-status-andamento">${os.status}</span></td><td style="text-align: right;"><button class="btn btn-primary" style="padding: 4px 10px; font-size: 11px;">Detalhes</button></td></tr>`; });
}

function configurarModuloChamados() {
    const btnAbrir = document.getElementById('btn-abrir-modal-chamado'); if(!btnAbrir) return;
    const modalNovo = document.getElementById('modal-novo-chamado'); const formNovo = document.getElementById('form-novo-chamado');
    const fecharModal = () => { modalNovo.classList.add('hidden'); formNovo.reset(); };
    btnAbrir.addEventListener('click', () => modalNovo.classList.remove('hidden'));
    document.getElementById('btn-fechar-modal-chamado').addEventListener('click', fecharModal);
    document.getElementById('btn-cancelar-chamado').addEventListener('click', (e) => { e.preventDefault(); fecharModal(); });
    formNovo.addEventListener('submit', (e) => {
        e.preventDefault(); 
        if(!formNovo.checkValidity()) { alert("Não foi possível salvar. Verifique os campos obrigatórios."); return; }
        const dados = getDados(); const novoId = dados.chamados.length > 0 ? Math.max(...dados.chamados.map(c => c.id)) + 1 : 101;
        dados.chamados.push({ id: novoId, condominio: document.getElementById('input-chamado-condominio').value, problema: document.getElementById('input-chamado-problema').value, prioridade: document.getElementById('input-chamado-prioridade').value, status: "Novo", data: new Date().toLocaleDateString('pt-BR') });
        salvarDados(dados); renderizarTabelaChamados(); fecharModal(); alert("Chamado registrado com sucesso.");
    });
}
function renderizarTabelaChamados() {
    const dados = getDados(); const tbody = document.querySelector('#tabela-chamados tbody'); if(!tbody) return; tbody.innerHTML = '';
    dados.chamados.forEach(c => { tbody.innerHTML += `<tr><td>#${c.id}</td><td><strong>${c.condominio}</strong></td><td>${c.problema}</td><td><span class="badge badge-status-novo">${c.status}</span></td><td style="text-align: right;"><button class="btn btn-primary" style="padding: 4px 10px; font-size: 11px;">Gerenciar</button></td></tr>`; });
}

function configurarModuloMateriais() {
    const btnAbrir = document.getElementById('btn-abrir-modal-material'); if(!btnAbrir) return;
    const modalMat = document.getElementById('modal-novo-material'); const formMat = document.getElementById('form-novo-material');
    const fecharModal = () => { modalMat.classList.add('hidden'); formMat.reset(); };
    btnAbrir.addEventListener('click', () => modalMat.classList.remove('hidden'));
    document.getElementById('btn-fechar-modal-material').addEventListener('click', fecharModal);
    document.getElementById('btn-cancelar-material').addEventListener('click', (e) => { e.preventDefault(); fecharModal(); });
    formMat.addEventListener('submit', (e) => {
        e.preventDefault(); 
        if(!formMat.checkValidity()) { alert("Não foi possível salvar. Verifique os campos obrigatórios."); return; }
        const dados = getDados(); const novoId = dados.materiais.length > 0 ? Math.max(...dados.materiais.map(m => m.id)) + 1 : 1;
        dados.materiais.push({ id: novoId, codigo: `MAT-${String(novoId).padStart(3, '0')}`, nome: document.getElementById('input-mat-nome').value, categoria: document.getElementById('input-mat-cat').value, quantidade: document.getElementById('input-mat-qtd').value, minimo: document.getElementById('input-mat-min').value });
        salvarDados(dados); renderizarTabelaMateriais(); fecharModal(); alert("Material cadastrado com sucesso.");
    });
}
function renderizarTabelaMateriais() {
    const dados = getDados(); const tbody = document.querySelector('#tabela-materiais tbody'); if(!tbody) return; tbody.innerHTML = '';
    dados.materiais.forEach(m => { tbody.innerHTML += `<tr><td><strong>${m.codigo}</strong></td><td>${m.nome}</td><td>${m.quantidade} un.</td><td>${m.minimo} un.</td></tr>`; });
}

function configurarModuloDocumentos() {
    const btnAbrir = document.getElementById('btn-abrir-modal-documento'); if(!btnAbrir) return;
    const modalDoc = document.getElementById('modal-novo-documento'); const formDoc = document.getElementById('form-novo-documento');
    const selectCond = document.getElementById('input-doc-condominio'); const fecharModal = () => { modalDoc.classList.add('hidden'); formDoc.reset(); };
    btnAbrir.addEventListener('click', () => {
        const dados = getDados(); selectCond.innerHTML = '';
        dados.condominios.forEach(c => { selectCond.innerHTML += `<option value="${c.nome}">${c.nome}</option>`; });
        modalDoc.classList.remove('hidden');
    });
    document.getElementById('btn-fechar-modal-documento').addEventListener('click', fecharModal);
    document.getElementById('btn-cancelar-documento').addEventListener('click', (e) => { e.preventDefault(); fecharModal(); });
    formDoc.addEventListener('submit', (e) => {
        e.preventDefault(); 
        if(!formDoc.checkValidity()) { alert("Não foi possível salvar. Verifique os campos obrigatórios."); return; }
        const dados = getDados(); const numId = dados.documentos.length > 0 ? Math.max(...dados.documentos.map(d => d.id)) + 1 : 1;
        dados.documentos.push({ id: numId, titulo: document.getElementById('input-doc-titulo').value, categoria: document.getElementById('input-doc-categoria').value, condominio: selectCond.value, link: document.getElementById('input-doc-link').value, dataCadastro: new Date().toLocaleDateString('pt-BR') });
        salvarDados(dados); renderizarTabelaDocumentos(); fecharModal(); alert("Documento vinculado com sucesso.");
    });
}
function renderizarTabelaDocumentos() {
    const dados = getDados(); const tbody = document.querySelector('#tabela-documentos tbody'); if(!tbody) return; tbody.innerHTML = '';
    dados.documentos.forEach(d => { tbody.innerHTML += `<tr><td><strong>${d.titulo}</strong></td><td>${d.categoria}</td><td>${d.condominio}</td><td>${d.dataCadastro}</td></tr>`; });
}

// PORTAL SÍNDICO E ADMIN MANTIDOS PARA O FLUXO BÁSICO
function configurarModuloPortalSindico() {
    const formChamado = document.getElementById('form-sindico-chamado');
    if(formChamado) {
        formChamado.addEventListener('submit', (e) => {
            e.preventDefault();
            if(!formChamado.checkValidity()) { alert("Não foi possível salvar. Verifique os campos obrigatórios."); return; }
            const dados = getDados(); const novoId = dados.chamados.length > 0 ? Math.max(...dados.chamados.map(c => c.id)) + 1 : 101;
            dados.chamados.push({ id: novoId, condominio: document.getElementById('input-sind-chamado-cond').value, local: document.getElementById('input-sind-chamado-local').value, categoria: document.getElementById('input-sind-chamado-cat').value, problema: document.getElementById('input-sind-chamado-desc').value, prioridade: document.getElementById('input-sind-chamado-prio').value, status: "Novo", data: new Date().toLocaleDateString('pt-BR') });
            salvarDados(dados); alert(`Chamado enviado com sucesso.`); formChamado.reset(); irParaTela('sindico-meus-chamados');
        });
    }
}
function configurarModuloAgendaRotas() {}
function configurarModuloTecnico() {}