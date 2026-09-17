document.addEventListener('DOMContentLoaded', () => {
    inicializarSistema();
    configurarNavegacao();
    configurarMenuMobile();
    configurarSeletorPerfil();
    configurarModuloPortalSindico();
    configurarModuloChamados();
    configurarModuloOS();
    configurarModuloTecnico();
    configurarModuloAgenda(); 
    configurarModuloCondominios();
    configurarModuloEquipamentos(); 
    configurarModuloPreventivas();
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
                { id: 101, condominio: "Residencial Jardim das Palmeiras", local: "Bloco B - Piscina", categoria: "Bombas", problema: "Bomba fazendo barulho excessivo", prioridade: "Alta", status: "Novo", data: "16/09/2026", foto: "" }
            ], 
            ordensServico: [], 
            condominios: [
                { id: 1, nome: "Residencial Jardim das Palmeiras", endereco: "Av. Beira Rio, 1000", sindico: "João Siqueira", telefone: "(81) 99888-7766", status: "Ativo" }
            ], 
            equipamentos: [], preventivas: [], documentos: [], materiais: []
        };
        localStorage.setItem('mp_data', JSON.stringify(emptyData));
    }
    const dados = getDados();
    let precisaSalvar = false;
    if(!dados.chamados) { dados.chamados = []; precisaSalvar = true; }
    if(!dados.ordensServico) { dados.ordensServico = []; precisaSalvar = true; }
    if(!dados.condominios) { dados.condominios = []; precisaSalvar = true; }
    if(!dados.equipamentos) { dados.equipamentos = []; precisaSalvar = true; } 
    if(!dados.preventivas) { dados.preventivas = []; precisaSalvar = true; }
    if(!dados.documentos) { dados.documentos = []; precisaSalvar = true; }
    if(!dados.materiais) { dados.materiais = []; precisaSalvar = true; }
    if(precisaSalvar) salvarDados(dados);

    aplicarConfiguracoesVisuais();
    atualizarDashboard();
}

function getDados() { return JSON.parse(localStorage.getItem('mp_data')); }
function salvarDados(dados) { localStorage.setItem('mp_data', JSON.stringify(dados)); atualizarDashboard(); }

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

    if (perfil === 'sindico') {
        menuAdmin.classList.add('hidden');
        menuSindico.classList.remove('hidden');
        irParaTela('sindico-inicio');
        atualizarPortalSindico();
    } else {
        menuSindico.classList.add('hidden');
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
            
            if(targetPage === 'chamados') renderizarTabelaChamados();
            if(targetPage === 'os') renderizarTabelaOS();
            if(targetPage === 'tecnico') renderizarAgendaTecnico(); 
            if(targetPage === 'agenda') renderizarAgendaRotas(); 
            if(targetPage === 'condominios') renderizarTabelaCondominios(); 
            if(targetPage === 'equipamentos') renderizarTabelaEquipamentos(); 
            if(targetPage === 'preventivas') renderizarTabelaPreventivas(); 
            
            if(['sindico-inicio', 'sindico-meus-chamados', 'sindico-novo-chamado', 'sindico-condominios'].includes(targetPage)) {
                atualizarPortalSindico();
            }
        });
    });
}

function configurarMenuMobile() {
    const btn = document.getElementById('mobile-menu-btn');
    if(btn) btn.addEventListener('click', () => document.getElementById('sidebar').classList.toggle('open'));
}

function atualizarDashboard() {
    const dados = getDados();
    const ordens = dados.ordensServico || [];
    const chamados = dados.chamados || [];
    const preventivas = dados.preventivas || [];
    
    const hojeObj = new Date();
    const hojeIso = `${hojeObj.getFullYear()}-${String(hojeObj.getMonth() + 1).padStart(2, '0')}-${String(hojeObj.getDate()).padStart(2, '0')}`;

    let alterou = false;
    ordens.forEach(os => {
        if(os.status !== 'Concluída' && os.dataFormatoEN && os.dataFormatoEN < hojeIso && os.status !== 'Atrasada') {
            os.status = 'Atrasada';
            alterou = true;
        }
    });
    if(alterou) localStorage.setItem('mp_data', JSON.stringify(dados));

    if(document.getElementById('count-os')) document.getElementById('count-os').textContent = chamados.filter(c => c.status === 'Novo').length;
    if(document.getElementById('count-andamento')) document.getElementById('count-andamento').textContent = ordens.filter(os => os.status === 'Em andamento').length;
    if(document.getElementById('count-atrasadas')) document.getElementById('count-atrasadas').textContent = ordens.filter(os => os.status === 'Atrasada').length;
    if(document.getElementById('count-preventivas')) document.getElementById('count-preventivas').textContent = preventivas.length;

    const cardAtrasoEl = document.querySelector('.card-atrasadas-animado');
    if(cardAtrasoEl) {
        if(ordens.filter(os => os.status === 'Atrasada').length > 0) cardAtrasoEl.classList.add('tem-atraso');
        else cardAtrasoEl.classList.remove('tem-atraso');
    }
}

// =======================================================
// MÓDULO CHAMADOS E VÍNCULO COM OS (REESTRUTURADO)
// =======================================================
function configurarModuloChamados() {
    const btnAbrir = document.getElementById('btn-abrir-modal-chamado');
    if(!btnAbrir) return;
    const modalNovo = document.getElementById('modal-novo-chamado');
    const formNovo = document.getElementById('form-novo-chamado');
    const fecharModal = () => { modalNovo.classList.add('hidden'); formNovo.reset(); };

    btnAbrir.addEventListener('click', () => modalNovo.classList.remove('hidden'));
    document.getElementById('btn-fechar-modal-chamado').addEventListener('click', fecharModal);
    document.getElementById('btn-cancelar-chamado').addEventListener('click', (e) => { e.preventDefault(); fecharModal(); });

    formNovo.addEventListener('submit', (e) => {
        e.preventDefault(); 
        const dados = getDados();
        const novoId = dados.chamados.length > 0 ? Math.max(...dados.chamados.map(c => c.id)) + 1 : 101;
        dados.chamados.push({
            id: novoId, 
            condominio: document.getElementById('input-chamado-condominio').value,
            local: "Área Comum",
            categoria: "Geral",
            problema: document.getElementById('input-chamado-problema').value,
            prioridade: document.getElementById('input-chamado-prioridade').value, 
            status: "Novo",
            data: new Date().toLocaleDateString('pt-BR')
        });
        salvarDados(dados); renderizarTabelaChamados(); fecharModal();
    });

    const btnFechaDetalhe = document.getElementById('btn-fechar-detalhe-chamado');
    if(btnFechaDetalhe) btnFechaDetalhe.addEventListener('click', () => document.getElementById('modal-detalhe-chamado').classList.add('hidden'));
    const btnFechaOS = document.getElementById('btn-fechar-detalhe-os');
    if(btnFechaOS) btnFechaOS.addEventListener('click', () => document.getElementById('modal-detalhe-os').classList.add('hidden'));
}

function renderizarTabelaChamados(filtroStatus = 'Todos') {
    const dados = getDados(); const tbody = document.querySelector('#tabela-chamados tbody'); if(!tbody) return;
    tbody.innerHTML = ''; 
    let lista = dados.chamados;
    if(filtroStatus !== 'Todos') lista = lista.filter(c => c.status === filtroStatus);
    
    if (lista.length === 0) { tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color: var(--text-muted);">Nenhum chamado encontrado.</td></tr>`; return;}
    [...lista].reverse().forEach(chamado => {
        const tr = document.createElement('tr');
        let badgeStatus = chamado.status === 'Convertido em OS' ? 'badge-status-aprovado' : 'badge-status-novo';
        let badgePrioridade = chamado.prioridade === 'Urgente' ? 'badge-prio-urgente' : 'badge-prio-normal';
        tr.innerHTML = `
            <td>#${chamado.id}</td>
            <td><strong>${chamado.condominio}</strong></td>
            <td>${chamado.problema}</td>
            <td><span class="badge ${badgePrioridade}">${chamado.prioridade}</span></td>
            <td><span class="badge ${badgeStatus}">${chamado.status}</span></td>
            <td style="text-align: right;"><button class="btn btn-primary" style="padding: 4px 10px; font-size: 11px;" onclick="abrirDetalhesChamado(${chamado.id})">Gerenciar</button></td>
        `;
        tbody.appendChild(tr);
    });
}

window.abrirDetalhesChamado = function(id) {
    const dados = getDados();
    const chamado = dados.chamados.find(c => c.id == id);
    if(!chamado) return;

    document.getElementById('modal-chamado-titulo').textContent = `Chamado #${chamado.id} — ${chamado.condominio}`;
    const corpo = document.getElementById('modal-chamado-corpo');
    const footer = document.getElementById('modal-chamado-footer');

    // Verifica se já existe OS para este chamado
    const osExistente = dados.ordensServico.find(os => os.chamadoId == chamado.id);

    corpo.innerHTML = `
        <div style="margin-bottom: 14px;"><strong style="color:var(--text-muted); font-size:12px;">Solicitante / Local:</strong><p>${chamado.condominio} (${chamado.local || 'Geral'})</p></div>
        <div style="margin-bottom: 14px;"><strong style="color:var(--text-muted); font-size:12px;">Problema Relatado:</strong><p style="font-size:15px; font-weight:600;">${chamado.problema}</p></div>
        <div style="margin-bottom: 14px;"><strong style="color:var(--text-muted); font-size:12px;">Data de Abertura:</strong><p>${chamado.data} • Prioridade: ${chamado.prioridade}</p></div>
    `;

    if(osExistente) {
        footer.innerHTML = `
            <button class="btn btn-primary btn-icon" onclick="document.getElementById('modal-detalhe-chamado').classList.add('hidden'); abrirDetalheOS(${osExistente.id})">
                <span class="material-symbols-outlined">build</span> Ver OS #${osExistente.id}
            </button>
        `;
    } else {
        footer.innerHTML = `
            <button class="btn btn-primary btn-icon" onclick="converterChamadoEmOS(${chamado.id})">
                <span class="material-symbols-outlined">add_task</span> Criar Ordem de Serviço
            </button>
        `;
    }

    document.getElementById('modal-detalhe-chamado').classList.remove('hidden');
};

window.converterChamadoEmOS = function(chamadoId) {
    const dados = getDados();
    const chamado = dados.chamados.find(c => c.id == chamadoId);
    if(!chamado) return;

    // Evita duplicidade acidental
    const jaExiste = dados.ordensServico.some(os => os.chamadoId == chamado.id);
    if(jaExiste) {
        alert("Já existe uma OS gerada para este chamado!");
        return;
    }

    const novoId = dados.ordensServico.length > 0 ? Math.max(...dados.ordensServico.map(os => os.id)) + 1 : 1001;
    const hojeIso = new Date().toISOString().split('T')[0];

    dados.ordensServico.push({
        id: novoId,
        chamadoId: chamado.id,
        condominio: chamado.condominio,
        servico: chamado.problema, // Problema original preservado
        dataFormatoEN: hojeIso,
        data: hojeIso.split('-').reverse().join('/'),
        hora: "09:00",
        tecnico: "João Silva",
        status: "Em andamento",
        diagnostico: "", // Solução executada separada
        materiais: "1x Peça de reposição padrão",
        fotosAntesDepois: "Anexadas no atendimento"
    });

    chamado.status = "Convertido em OS";
    salvarDados(dados);
    document.getElementById('modal-detalhe-chamado').classList.add('hidden');
    renderizarTabelaChamados();
    renderizarTabelaOS();
    alert(`Ordem de Serviço #${novoId} criada com sucesso a partir do Chamado #${chamado.id}!`);
};

// =======================================================
// TELA DA OS REESTRUTURADA (SEPARAÇÃO DE PROBLEMA E LAUDO)
// =======================================================
function configurarModuloOS() {
    const btnAbrirOS = document.getElementById('btn-abrir-modal-os');
    if(!btnAbrirOS) return;
    const modalOS = document.getElementById('modal-nova-os'); const formOS = document.getElementById('form-nova-os');
    const fecharModal = () => { modalOS.classList.add('hidden'); formOS.reset(); };
    btnAbrirOS.addEventListener('click', () => { document.getElementById('input-os-data').value = new Date().toISOString().split('T')[0]; modalOS.classList.remove('hidden'); });
    document.getElementById('btn-fechar-modal-os').addEventListener('click', fecharModal); document.getElementById('btn-cancelar-os').addEventListener('click', (e) => { e.preventDefault(); fecharModal(); });
    formOS.addEventListener('submit', (e) => {
        e.preventDefault(); const dados = getDados(); const novoId = dados.ordensServico.length > 0 ? Math.max(...dados.ordensServico.map(os => os.id)) + 1 : 1001;
        dados.ordensServico.push({ 
            id: novoId, chamadoId: null, condominio: document.getElementById('input-os-condominio').value, 
            servico: document.getElementById('input-os-servico').value, data: document.getElementById('input-os-data').value.split('-').reverse().join('/'), 
            hora: document.getElementById('input-os-hora').value, tecnico: document.getElementById('input-os-tecnico').value, 
            status: document.getElementById('input-os-status').value, diagnostico: "", materiais: "Nenhum informado", fotosAntesDepois: "N/A" 
        });
        salvarDados(dados); renderizarTabelaOS(); fecharModal();
    });
}

function renderizarTabelaOS(filtroStatus = 'Todas') {
    const dados = getDados(); const tbody = document.querySelector('#tabela-os tbody'); if(!tbody) return; tbody.innerHTML = ''; 
    let lista = dados.ordensServico;
    if(filtroStatus !== 'Todas') lista = lista.filter(os => os.status === filtroStatus);

    if (lista.length === 0) { tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color: var(--text-muted);">Nenhuma OS encontrada.</td></tr>`; return; }
    [...lista].reverse().forEach(os => {
        const tr = document.createElement('tr');
        let badgeStatus = 'badge-status-andamento';
        if (os.status === 'Concluída') badgeStatus = 'badge-status-concluida'; 
        if (os.status === 'Atrasada') badgeStatus = 'badge-status-atrasada'; 
        
        tr.innerHTML = `
            <td>#${os.id}</td>
            <td><strong>${os.condominio}</strong></td>
            <td>${os.servico}</td>
            <td style="font-size: 12px;">${os.data} às ${os.hora}</td>
            <td>${os.tecnico}</td>
            <td><span class="badge ${badgeStatus}">${os.status}</span></td>
            <td style="text-align: right;"><button class="btn btn-primary" style="padding: 4px 10px; font-size: 11px;" onclick="abrirDetalheOS(${os.id})">Detalhes da OS</button></td>
        `;
        tbody.appendChild(tr);
    });
}

window.abrirDetalheOS = function(osId) {
    const dados = getDados();
    const os = dados.ordensServico.find(o => o.id == osId);
    if(!os) return;

    document.getElementById('os-modal-titulo').textContent = `Ordem de Serviço #${os.id}`;
    const corpo = document.getElementById('os-modal-corpo');

    corpo.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; padding-bottom:12px; border-bottom:1px solid var(--border-color);">
            <div><strong>${os.condominio}</strong><br><span style="color:var(--text-muted); font-size:12px;">Técnico: ${os.tecnico}</span></div>
            <span class="badge badge-status-andamento">${os.status}</span>
        </div>

        <!-- SEÇÃO 1: PROBLEMA INFORMADO -->
        <div style="background:#f8fafc; padding:14px; border-radius:var(--radius); border:1px solid var(--border-color); margin-bottom:14px;">
            <h4 style="font-size:13px; color:var(--text-muted); text-transform:uppercase; margin-bottom:6px;">1. Problema Informado (Síndico)</h4>
            <p style="font-size:14px; font-weight:600; color:var(--text-main);">${os.servico}</p>
        </div>

        <!-- SEÇÃO 2: EXECUÇÃO E DIAGNÓSTICO -->
        <div style="background:#ffffff; padding:14px; border-radius:var(--radius); border:1px solid var(--border-color); margin-bottom:14px;">
            <h4 style="font-size:13px; color:var(--primary-color); text-transform:uppercase; margin-bottom:6px;">2. Execução e Laudo Técnico</h4>
            <textarea id="os-input-diag" class="form-control" rows="3" placeholder="Descreva o laudo de execução...">${os.diagnostico || ''}</textarea>
        </div>

        <!-- SEÇÃO 3: MATERIAIS -->
        <div style="background:#ffffff; padding:14px; border-radius:var(--radius); border:1px solid var(--border-color); margin-bottom:14px;">
            <h4 style="font-size:13px; color:var(--text-muted); text-transform:uppercase; margin-bottom:6px;">3. Materiais Utilizados</h4>
            <input type="text" id="os-input-materiais" class="form-control" value="${os.materiais || 'Nenhum'}" placeholder="Ex: 1x Reparo hidráulico">
        </div>

        <!-- SEÇÃO 4: REGISTRO FOTOGRÁFICO -->
        <div style="background:#ffffff; padding:14px; border-radius:var(--radius); border:1px solid var(--border-color); margin-bottom:14px;">
            <h4 style="font-size:13px; color:var(--text-muted); text-transform:uppercase; margin-bottom:6px;">4. Registro Fotográfico (Antes / Depois)</h4>
            <input type="text" id="os-input-fotos" class="form-control" value="${os.fotosAntesDepois || ''}" placeholder="Links de fotos de comprovação">
        </div>

        <!-- BOTÃO DE SALVAR ALTERAÇÕES DA OS -->
        <div style="text-align: right;">
            <button class="btn btn-primary" onclick="salvarEdicaoOS(${os.id})">Salvar Andamento da OS</button>
        </div>
    `;

    document.getElementById('modal-detalhe-os').classList.remove('hidden');
};

window.salvarEdicaoOS = function(osId) {
    const dados = getDados();
    const os = dados.ordensServico.find(o => o.id == osId);
    if(!os) return;

    os.diagnostico = document.getElementById('os-input-diag').value;
    os.materiais = document.getElementById('os-input-materiais').value;
    os.fotosAntesDepois = document.getElementById('os-input-fotos').value;
    os.status = "Concluída"; // Atualiza para concluída ao registrar laudo definitivo

    salvarDados(dados);
    document.getElementById('modal-detalhe-os').classList.add('hidden');
    renderizarTabelaOS();
    alert("Ordem de Serviço atualizada e concluída com sucesso!");
};

// PORTAL DO SÍNDICO E SUPORTE
function configurarModuloPortalSindico() {
    const selCond = document.getElementById('seletor-condominio-sindico');
    if(selCond) selCond.addEventListener('change', atualizarPortalSindico);

    const formChamado = document.getElementById('form-sindico-chamado');
    if(formChamado) {
        formChamado.addEventListener('submit', (e) => {
            e.preventDefault();
            const dados = getDados();
            const novoId = dados.chamados.length > 0 ? Math.max(...dados.chamados.map(c => c.id)) + 1 : 101;
            const condAtual = document.getElementById('seletor-condominio-sindico').value;

            dados.chamados.push({
                id: novoId, condominio: condAtual, local: document.getElementById('input-sind-chamado-local').value,
                categoria: document.getElementById('input-sind-chamado-cat').value, problema: document.getElementById('input-sind-chamado-desc').value,
                prioridade: document.getElementById('input-sind-chamado-prio').value, status: "Novo", data: new Date().toLocaleDateString('pt-BR')
            });

            salvarDados(dados); alert(`Chamado #${novoId} enviado com sucesso!`);
            formChamado.reset(); irParaTela('sindico-meus-chamados');
        });
    }
}

function atualizarPortalSindico() {
    const dados = getDados(); const selCond = document.getElementById('seletor-condominio-sindico');
    if(selCond && selCond.options.length <= 1) {
        selCond.innerHTML = '';
        dados.condominios.forEach(c => { selCond.innerHTML += `<option value="${c.nome}">${c.nome}</option>`; });
    }
    const condAtual = selCond ? selCond.value : (dados.condominios[0] ? dados.condominios[0].nome : '');
    const chamados = dados.chamados.filter(c => c.condominio === condAtual);

    if(document.getElementById('sind-card-total')) document.getElementById('sind-card-total').textContent = chamados.length;
    if(document.getElementById('sind-card-andamento')) document.getElementById('sind-card-andamento').textContent = chamados.filter(c => c.status === 'Em atendimento' || c.status === 'Convertido em OS').length;
    if(document.getElementById('sind-card-concluidos')) document.getElementById('sind-card-concluidos').textContent = chamados.filter(c => c.status === 'Concluído').length;

    if(document.getElementById('input-sind-chamado-cond')) document.getElementById('input-sind-chamado-cond').value = condAtual;

    const tbodyResumo = document.querySelector('#tabela-sindico-resumo tbody');
    if(tbodyResumo) {
        tbodyResumo.innerHTML = '';
        chamados.slice(0, 5).forEach(c => {
            tbodyResumo.innerHTML += `<tr><td>#${c.id}</td><td>${c.local || '-'}</td><td>${c.problema}</td><td>${c.data}</td><td><span class="badge badge-status-aberta">${c.status}</span></td></tr>`;
        });
    }
    const tbodyTodos = document.querySelector('#tabela-sindico-todos tbody');
    if(tbodyTodos) {
        tbodyTodos.innerHTML = '';
        chamados.forEach(c => {
            tbodyTodos.innerHTML += `<tr><td>#${c.id}</td><td>${c.local || '-'}</td><td>${c.problema}</td><td>${c.data}</td><td><span class="badge badge-status-aberta">${c.status}</span></td><td style="text-align:right;"><button class="btn btn-primary" style="padding:4px 10px; font-size:11px;" onclick="abrirDetalheOS(${c.id})">Acompanhar</button></td></tr>`;
        });
    }
    const tbodyConds = document.querySelector('#tabela-sindico-conds tbody');
    if(tbodyConds) {
        tbodyConds.innerHTML = '';
        dados.condominios.forEach(c => { tbodyConds.innerHTML += `<tr><td><strong>${c.nome}</strong></td><td>${c.endereco}</td><td>${c.sindico}</td><td>${c.telefone}</td></tr>`; });
    }
}

// MÓDULOS DE SUPORTE PADRÃO
function configurarTelaConfiguracoes() {
    const btnSave = document.getElementById('btn-save-settings'); if(!btnSave) return;
    const dados = getDados(); document.getElementById('input-company-name').value = dados.settings.companyName;
    btnSave.addEventListener('click', () => { dados.settings.companyName = document.getElementById('input-company-name').value; salvarDados(dados); alert("Salvo!"); });
}
function configurarModuloAgenda() {}
function renderizarAgendaRotas() {}
function configurarModuloTecnico() {}
function renderizarAgendaTecnico() {}
function configurarModuloCondominios() {
    const btnAbrir = document.getElementById('btn-abrir-modal-condominio'); if(!btnAbrir) return;
    const modalCond = document.getElementById('modal-novo-condominio'); const formCond = document.getElementById('form-novo-condominio');
    const fecharModal = () => { modalCond.classList.add('hidden'); formCond.reset(); };
    btnAbrir.addEventListener('click', () => modalCond.classList.remove('hidden'));
    document.getElementById('btn-fechar-modal-condominio').addEventListener('click', fecharModal); document.getElementById('btn-cancelar-condominio').addEventListener('click', (e) => { e.preventDefault(); fecharModal(); });
    formCond.addEventListener('submit', (e) => {
        e.preventDefault(); const dados = getDados(); const novoId = dados.condominios.length > 0 ? Math.max(...dados.condominios.map(c => c.id)) + 1 : 1;
        dados.condominios.push({ id: novoId, nome: document.getElementById('input-cond-nome').value, endereco: document.getElementById('input-cond-endereco').value, sindico: document.getElementById('input-cond-sindico').value, telefone: document.getElementById('input-cond-telefone').value, status: document.getElementById('input-cond-status').value });
        salvarDados(dados); fecharModal();
    });
}
function renderizarTabelaCondominios() {
    const dados = getDados(); const tbody = document.querySelector('#tabela-condominios tbody'); if(!tbody) return; tbody.innerHTML = '';
    dados.condominios.forEach(c => { tbody.innerHTML += `<tr><td><strong>${c.nome}</strong></td><td>${c.sindico}</td><td>${c.telefone}</td><td>${c.endereco}</td><td><span class="badge badge-status-ativo">${c.status}</span></td></tr>`; });
}
function configurarModuloEquipamentos() {}
function renderizarTabelaEquipamentos() {}
function configurarModuloPreventivas() {}
function renderizarTabelaPreventivas() {}
function configurarModuloDocumentos() {}
function renderizarTabelaDocumentos() {}