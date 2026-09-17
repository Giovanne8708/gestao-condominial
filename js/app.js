const TÉCNICO_LOGADO = "João Silva";

document.addEventListener('DOMContentLoaded', () => {
    inicializarSistema();
    configurarNavegacao();
    configurarMenuMobile();
    configurarSeletorPerfil();
    configurarModuloPortalSindico();
    configurarModuloChamados();
    configurarModuloOSTecnico();
    configurarTelaConfiguracoesWhiteLabel();
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
                logoBase64: ""
            },
            // Dados Iniciais Rastreáveis
            chamados: [
                { id: 101, condominio: "Residencial Jardim das Palmeiras", local: "Bloco B - Elevador", categoria: "Elevadores", problema: "Porta travando no 3º andar", prioridade: "Alta", status: "Novo", data: new Date().toLocaleDateString('pt-BR'), laudoTecnico: "", materiaisUsados: "" }
            ], 
            ordensServico: [], 
            condominios: [
                { id: 1, nome: "Residencial Jardim das Palmeiras", endereco: "Av. Beira Rio, 1000", sindico: "João Siqueira", status: "Ativo" }
            ], 
            equipamentos: [], preventivas: [], documentos: [], materiais: []
        };
        localStorage.setItem('mp_data', JSON.stringify(emptyData));
    }
    aplicarConfiguracoesVisuais();
}

function getDados() { return JSON.parse(localStorage.getItem('mp_data')); }
function salvarDados(dados) { localStorage.setItem('mp_data', JSON.stringify(dados)); }

// ==========================================================
// IDENTIDADE E NAVEGAÇÃO
// ==========================================================
function aplicarConfiguracoesVisuais() {
    const dados = getDados();
    if(!dados || !dados.settings) return;
    const s = dados.settings;
    document.documentElement.style.setProperty('--primary-color', s.primaryColor || '#1e40af');
    const displayEmpresa = document.getElementById('company-name-display');
    const displaySistema = document.getElementById('system-name-display');
    if(displayEmpresa) displayEmpresa.textContent = s.companyName || "Sua Empresa";
    if(displaySistema) displaySistema.textContent = s.systemName || "Gestão de Manutenção";
    document.title = `${s.companyName || "Empresa"} | ${s.systemName || "Sistema"}`;

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

function configurarSeletorPerfil() {
    const seletor = document.getElementById('seletor-perfil-usuario');
    if(!seletor) return;
    seletor.addEventListener('change', (e) => {
        const perfil = e.target.value;
        const menuAdmin = document.getElementById('menu-admin');
        const menuSindico = document.getElementById('menu-sindico');
        const menuTecnico = document.getElementById('menu-tecnico');

        menuAdmin.classList.add('hidden'); menuSindico.classList.add('hidden'); menuTecnico.classList.add('hidden');

        if (perfil === 'sindico') {
            menuSindico.classList.remove('hidden'); irParaTela('sindico-inicio'); atualizarPortalSindico();
        } else if (perfil === 'tecnico') {
            menuTecnico.classList.remove('hidden'); irParaTela('tecnico-inicio'); atualizarPortalTecnico();
        } else {
            menuAdmin.classList.remove('hidden'); irParaTela('dashboard'); atualizarDashboardAdmin();
        }
    });
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
            
            if(targetPage === 'chamados') renderizarTabelaChamadosAdmin();
            if(targetPage === 'os') renderizarTabelaOSAdmin();
            if(targetPage === 'dashboard') atualizarDashboardAdmin();
            
            if(['sindico-inicio', 'sindico-meus-chamados'].includes(targetPage)) atualizarPortalSindico();
            if(['tecnico-inicio', 'tecnico-os'].includes(targetPage)) atualizarPortalTecnico();
        });
    });
}

function configurarMenuMobile() {
    const btn = document.getElementById('mobile-menu-btn');
    if(btn) btn.addEventListener('click', () => document.getElementById('sidebar').classList.toggle('open'));
}

// ==========================================================
// ADMIN: DASHBOARD, CHAMADOS E OS
// ==========================================================
function atualizarDashboardAdmin() {
    const dados = getDados();
    const ordens = dados.ordensServico || [];
    const chamados = dados.chamados || [];
    if(document.getElementById('count-os')) document.getElementById('count-os').textContent = chamados.filter(c => c.status === 'Novo').length;
    if(document.getElementById('count-andamento')) document.getElementById('count-andamento').textContent = ordens.filter(os => os.status === 'Em andamento').length;
    if(document.getElementById('count-atrasadas')) document.getElementById('count-atrasadas').textContent = ordens.filter(os => os.status === 'Atrasada').length;
}

window.filtrarChamados = function(status) {
    const abas = document.querySelectorAll('#page-chamados .filter-tab');
    abas.forEach(t => t.classList.remove('active')); event.target.classList.add('active');
    renderizarTabelaChamadosAdmin(status);
};

function renderizarTabelaChamadosAdmin(filtro = 'Todos') {
    const dados = getDados(); const tbody = document.querySelector('#tabela-chamados tbody'); if(!tbody) return; tbody.innerHTML = '';
    let lista = dados.chamados; if(filtro !== 'Todos') lista = lista.filter(c => c.status === filtro);
    if(lista.length === 0) { tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:var(--text-muted);">Nenhum chamado.</td></tr>`; return;}
    
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
    document.getElementById('modal-chamado-local').textContent = chamado.local;
    document.getElementById('modal-chamado-problema').textContent = chamado.problema;
    document.getElementById('modal-chamado-cat').textContent = chamado.categoria;
    document.getElementById('modal-chamado-prio').textContent = chamado.prioridade;
    document.getElementById('modal-chamado-data').textContent = chamado.data;

    // Set defaults for OS conversion
    const elData = document.getElementById('conv-os-data');
    if(elData) elData.value = new Date().toISOString().split('T')[0];

    const osExistente = dados.ordensServico.find(os => os.chamadoId == chamado.id);
    const blocoConv = document.getElementById('bloco-conversao-os');
    const footer = document.getElementById('modal-chamado-footer');

    if(osExistente) {
        blocoConv.classList.add('hidden');
        footer.innerHTML = `<button class="btn btn-primary" onclick="document.getElementById('modal-detalhe-chamado').classList.add('hidden'); abrirVisualizacaoOS(${osExistente.id})">Ver Ordem de Serviço Gerada</button>`;
    } else {
        blocoConv.classList.remove('hidden');
        footer.innerHTML = `
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
    
    // CRIAÇÃO DA OS PRESERVANDO DADOS
    dados.ordensServico.push({
        id: novoId,
        chamadoId: chamado.id,
        condominio: chamado.condominio,
        localOriginal: chamado.local,
        problemaOriginal: chamado.problema,
        dataFormatoEN: dataEN,
        data: dataEN.split('-').reverse().join('/'),
        hora: hora,
        tecnico: tecnico,
        status: "Agendada",
        diagnostico: "",
        materiais: ""
    });

    // ATUALIZA STATUS DO CHAMADO (RASTREABILIDADE)
    chamado.status = "Agendado";
    salvarDados(dados);

    document.getElementById('modal-detalhe-chamado').classList.add('hidden');
    renderizarTabelaChamadosAdmin();
    alert(`Ordem de Serviço #${novoId} criada e vinculada com sucesso! O síndico já pode ver que o chamado foi agendado.`);
};

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
    document.getElementById('exec-os-titulo').textContent = `OS #${os.id} — Status: ${os.status}`;
    document.getElementById('exec-os-condominio').textContent = os.condominio;
    document.getElementById('exec-os-local').textContent = os.localOriginal || 'Geral';
    document.getElementById('exec-os-problema').textContent = os.problemaOriginal || 'Serviço sob demanda';
    
    document.getElementById('bloco-tecnico-acoes').classList.add('hidden');
    const blocoLaudo = document.getElementById('bloco-laudo-final');
    
    if(os.status === 'Concluída') {
        blocoLaudo.classList.remove('hidden');
        document.getElementById('laudo-os-diag').textContent = os.diagnostico;
        document.getElementById('laudo-os-mat').textContent = os.materiais || 'Nenhum material utilizado.';
    } else {
        blocoLaudo.classList.add('hidden');
    }

    document.getElementById('modal-execucao-os').classList.remove('hidden');
};


// ==========================================================
// TÉCNICO DE CAMPO (EXECUÇÃO E RASTREABILIDADE P/ SÍNDICO)
// ==========================================================
function configurarModuloOSTecnico() {}

function atualizarPortalTecnico() {
    const dados = getDados();
    const ordens = dados.ordensServico.filter(os => os.tecnico === TÉCNICO_LOGADO);
    
    // Proxima Atendimento (Agendada)
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

    // Lista Minhas OS (Aba)
    const containerLista = document.getElementById('container-tec-lista-os');
    if(containerLista) {
        containerLista.innerHTML = '';
        const pendentes = ordens.filter(os => os.status !== 'Concluída');
        if(pendentes.length === 0) containerLista.innerHTML = `<p style="text-align:center; color:var(--text-muted);">Tudo limpo.</p>`;
        pendentes.forEach(os => {
            containerLista.innerHTML += `
                <div class="task-card" onclick="abrirExecucaoOSMobile(${os.id})" style="cursor:pointer;">
                    <div class="task-header"><span class="task-id">OS #${os.id}</span><span class="badge badge-status-andamento">${os.status}</span></div>
                    <div class="task-info">
                        <p style="font-size:12px; color:var(--text-muted);">${os.data} às ${os.hora}</p>
                        <p class="title">${os.condominio}</p>
                        <p class="desc">${os.problemaOriginal || 'Serviço'}</p>
                    </div>
                </div>
            `;
        });
    }
}

window.mudarFiltroTecnico = function(filtro) {
    const abas = document.querySelectorAll('#page-tecnico-os .filter-tab');
    abas.forEach(t => t.classList.remove('active')); event.target.classList.add('active');
    
    const dados = getDados();
    const ordens = dados.ordensServico.filter(os => os.tecnico === TÉCNICO_LOGADO);
    const containerLista = document.getElementById('container-tec-lista-os');
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
                    <p class="desc">${os.problemaOriginal || 'Serviço'}</p>
                </div>
            </div>
        `;
    });
};

window.abrirExecucaoOSMobile = function(id) {
    const dados = getDados(); const os = dados.ordensServico.find(o => o.id == id); if(!os) return;
    
    document.getElementById('exec-os-titulo').textContent = `OS #${os.id}`;
    document.getElementById('exec-os-condominio').textContent = os.condominio;
    document.getElementById('exec-os-local').textContent = os.localOriginal || 'Geral';
    document.getElementById('exec-os-problema').textContent = os.problemaOriginal || 'Manutenção';

    document.getElementById('bloco-tecnico-acoes').classList.remove('hidden');
    document.getElementById('bloco-laudo-final').classList.add('hidden');

    const btnIniciar = document.getElementById('btn-iniciar-os');
    const blocoForm = document.getElementById('bloco-tecnico-formulario');

    if(os.status === 'Concluída') {
        btnIniciar.classList.add('hidden');
        blocoForm.classList.add('hidden');
        document.getElementById('bloco-laudo-final').classList.remove('hidden');
        document.getElementById('laudo-os-diag').textContent = os.diagnostico;
        document.getElementById('laudo-os-mat').textContent = os.materiais || 'Nenhum material utilizado.';
    } else if(os.status === 'Em andamento') {
        btnIniciar.classList.add('hidden');
        blocoForm.classList.remove('hidden');
    } else {
        btnIniciar.classList.remove('hidden');
        blocoForm.classList.add('hidden');
        btnIniciar.onclick = () => {
            os.status = 'Em andamento';
            
            // RASTREABILIDADE: Atualiza o Chamado para "Em Atendimento" p/ o Síndico
            if(os.chamadoId) {
                const ch = dados.chamados.find(c => c.id == os.chamadoId);
                if(ch) ch.status = 'Em atendimento';
            }
            salvarDados(dados);
            abrirExecucaoOSMobile(id);
            atualizarPortalTecnico();
        };
    }

    // Botão Finalizar
    const btnFinalizar = document.getElementById('btn-finalizar-os');
    if(btnFinalizar) {
        btnFinalizar.onclick = () => {
            const diag = document.getElementById('exec-input-diag').value;
            if(!diag || diag.trim() === '') { alert("Descreva o serviço realizado."); return; }
            
            const mat = document.getElementById('exec-input-materiais').value;
            os.diagnostico = diag;
            os.materiais = mat;
            os.status = 'Concluída';

            // RASTREABILIDADE: Atualiza o Chamado, grava o Laudo e avisa o Síndico
            if(os.chamadoId) {
                const ch = dados.chamados.find(c => c.id == os.chamadoId);
                if(ch) {
                    ch.status = 'Concluído';
                    ch.laudoTecnico = diag;
                    ch.materiaisUsados = mat;
                }
            }
            
            salvarDados(dados);
            document.getElementById('modal-execucao-os').classList.add('hidden');
            atualizarPortalTecnico();
            alert("Ordem de serviço finalizada com sucesso. O síndico já tem acesso ao laudo.");
            
            // Limpa form
            document.getElementById('exec-input-diag').value = '';
            document.getElementById('exec-input-materiais').value = '';
        };
    }

    document.getElementById('modal-execucao-os').classList.remove('hidden');
};


// ==========================================================
// PORTAL DO SÍNDICO (ABERTURA E ACOMPANHAMENTO/LAUDO FINAL)
// ==========================================================
function configurarModuloPortalSindico() {
    const selCond = document.getElementById('seletor-condominio-sindico');
    if(selCond) selCond.addEventListener('change', atualizarPortalSindico);

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
                prioridade: "Normal", // Fixo ou por input se adicionado
                status: "Novo",
                data: new Date().toLocaleDateString('pt-BR'),
                laudoTecnico: "",
                materiaisUsados: ""
            });

            salvarDados(dados);
            alert(`Chamado #${novoId} enviado com sucesso! A empresa foi notificada.`);
            formChamado.reset();
            irParaTela('sindico-meus-chamados');
            atualizarPortalSindico();
        });
    }
}

function atualizarPortalSindico() {
    const dados = getDados();
    const selCond = document.getElementById('seletor-condominio-sindico');
    
    if(selCond && selCond.options.length === 0) {
        dados.condominios.forEach(c => { selCond.innerHTML += `<option value="${c.nome}">${c.nome}</option>`; });
    }

    const condominioSelecionado = selCond ? selCond.value : (dados.condominios[0] ? dados.condominios[0].nome : '');
    const chamadosSindico = dados.chamados.filter(c => c.condominio === condominioSelecionado);

    if(document.getElementById('input-sind-chamado-cond')) {
        document.getElementById('input-sind-chamado-cond').value = condominioSelecionado;
    }

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
    const dados = getDados();
    const chamado = dados.chamados.find(c => c.id == id);
    if(!chamado) return;

    document.getElementById('sind-acomp-titulo').textContent = `Chamado #${chamado.id}`;
    document.getElementById('sind-acomp-problema').textContent = chamado.problema;
    document.getElementById('sind-acomp-local').textContent = `Local: ${chamado.local}`;

    // Lógica da Linha do Tempo Dinâmica baseada no Status Real
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
        <div style="display:flex; align-items:center; gap:8px; color:${getColor(p1)}; font-weight:${p1==='active'?'600':'400'}">${getIcon(p1)} Solicitação Aberta (${chamado.data})</div>
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
// CONFIGURAÇÕES WHITE-LABEL
// ==========================================================
function configurarTelaConfiguracoesWhiteLabel() {
    const form = document.getElementById('form-configuracoes'); if(!form) return;
    const dados = getDados(); const s = dados.settings;
    
    document.getElementById('input-config-system').value = s.systemName || '';
    document.getElementById('input-config-empresa').value = s.companyName || '';
    document.getElementById('input-config-color').value = s.primaryColor || '#1e40af';

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        if(!form.checkValidity()) { alert("Verifique os campos obrigatórios."); return; }
        const configSalvar = getDados();
        configSalvar.settings.systemName = document.getElementById('input-config-system').value;
        configSalvar.settings.companyName = document.getElementById('input-config-empresa').value;
        configSalvar.settings.primaryColor = document.getElementById('input-config-color').value;
        salvarDados(configSalvar); aplicarConfiguracoesVisuais();
        alert("Identidade visual aplicada com sucesso!");
    });
}