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
                { id: 1, nome: "Residencial Jardim das Palmeiras", endereco: "Av. Beira Rio, 1000", sindico: "João Siqueira", telefone: "(81) 99888-7766", email: "joao.sindico@email.com", status: "Ativo" }
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
            if(targetPage === 'materiais') renderizarTabelaMateriais(); 
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
// MÓDULO CONDOMÍNIOS (REESTRUTURADO COM PÁGINA PRÓPRIA E ABAS)
// =======================================================
let condominioAtualId = null;

function configurarModuloCondominios() {
    const btnAbrir = document.getElementById('btn-abrir-modal-condominio'); 
    if(!btnAbrir) return;
    const modalCond = document.getElementById('modal-novo-condominio'); 
    const formCond = document.getElementById('form-novo-condominio');
    const fecharModal = () => { modalCond.classList.add('hidden'); formCond.reset(); };

    btnAbrir.addEventListener('click', () => modalCond.classList.remove('hidden'));
    document.getElementById('btn-fechar-modal-condominio').addEventListener('click', fecharModal); 
    document.getElementById('btn-cancelar-condominio').addEventListener('click', (e) => { e.preventDefault(); fecharModal(); });
    
    formCond.addEventListener('submit', (e) => {
        e.preventDefault(); 
        const dados = getDados(); 
        const novoId = dados.condominios.length > 0 ? Math.max(...dados.condominios.map(c => c.id)) + 1 : 1;
        dados.condominios.push({
            id: novoId, 
            nome: document.getElementById('input-cond-nome').value, 
            endereco: document.getElementById('input-cond-endereco').value, 
            sindico: document.getElementById('input-cond-sindico').value, 
            telefone: document.getElementById('input-cond-telefone').value, 
            email: document.getElementById('input-cond-email').value, 
            status: document.getElementById('input-cond-status').value
        });
        salvarDados(dados); renderizarTabelaCondominios(); fecharModal();
    });
}

function renderizarTabelaCondominios() {
    const dados = getDados(); 
    const tbody = document.querySelector('#tabela-condominios tbody'); 
    if(!tbody) return; 
    tbody.innerHTML = ''; 

    if (dados.condominios.length === 0) { 
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color: var(--text-muted);">Nenhum condomínio cadastrado.</td></tr>`; 
        return; 
    }

    dados.condominios.forEach(c => {
        // Conta chamados e OS vinculados a este condomínio em tempo real
        const abertos = dados.chamados.filter(ch => ch.condominio === c.nome && ch.status !== 'Concluído').length;
        const emAndamento = dados.ordensServico.filter(os => os.condominio === c.nome && os.status !== 'Concluída').length;
        const badgeStatus = c.status === 'Ativo' ? 'badge-status-ativo' : 'badge-status-inativo';

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${c.nome}</strong></td>
            <td>${c.endereco}</td>
            <td>${c.sindico} <br><small style="color:var(--text-muted);">${c.telefone}</small></td>
            <td><span class="badge badge-status-aberta">${abertos} abertos</span></td>
            <td><span class="badge badge-status-andamento">${emAndamento} em andamento</span></td>
            <td><span class="badge ${badgeStatus}">${c.status}</span></td>
            <td style="text-align: right;"><button class="btn btn-primary" style="padding: 4px 10px; font-size: 11px;" onclick="abrirDetalhesCondominio(${c.id})">Gerenciar</button></td>
        `;
        tbody.appendChild(tr);
    });
}

window.abrirDetalhesCondominio = function(id) {
    const dados = getDados();
    const cond = dados.condominios.find(c => c.id == id);
    if(!cond) return;

    condominioAtualId = id;

    // Altera visibilidade das páginas
    document.getElementById('page-condominios').classList.add('hidden');
    document.getElementById('page-detalhe-condominio').classList.remove('hidden');

    document.getElementById('detalhe-cond-nome').textContent = cond.nome;
    document.getElementById('detalhe-cond-endereco').textContent = cond.endereco;
    document.getElementById('detalhe-cond-sindico').textContent = `Síndico: ${cond.sindico}`;
    document.getElementById('detalhe-cond-contato').textContent = `Tel: ${cond.telefone} | E-mail: ${cond.email || 'Não informado'}`;

    mudarAbaCondominio('visao-geral');
};

window.mudarAbaCondominio = function(aba) {
    const abas = document.querySelectorAll('#page-detalhe-condominio .filter-tab');
    abas.forEach(t => t.classList.remove('active'));
    event.target.classList.add('active');

    const container = document.getElementById('cond-tab-content');
    const dados = getDados();
    const cond = dados.condominios.find(c => c.id == condominioAtualId);
    if(!cond) return;

    if (aba === 'visao-geral') {
        const abertos = dados.chamados.filter(ch => ch.condominio === cond.nome).length;
        const emAndamento = dados.ordensServico.filter(os => os.condominio === cond.nome && os.status !== 'Concluída').length;
        const concluidas = dados.ordensServico.filter(os => os.condominio === cond.nome && os.status === 'Concluída').length;
        const preventivas = dados.preventivas.filter(p => p.condominio === cond.nome).length;
        const equipamentos = dados.equipamentos.filter(eq => eq.condominio === cond.nome).length;

        container.innerHTML = `
            <div class="dashboard-cards" style="margin-bottom: 24px;">
                <div class="card"><h3>Chamados Registrados</h3><p class="card-value">${abertos}</p></div>
                <div class="card"><h3>OS em Andamento</h3><p class="card-value text-warning">${emAndamento}</p></div>
                <div class="card"><h3>OS Concluídas</h3><p class="card-value text-success">${concluidas}</p></div>
                <div class="card"><h3>Equipamentos</h3><p class="card-value">${equipamentos}</p></div>
            </div>
            <div class="card">
                <h3 style="margin-bottom: 12px; font-size: 15px;">Dados do Síndico Responsável</h3>
                <p><strong>Nome:</strong> ${cond.sindico}</p>
                <p><strong>Telefone:</strong> ${cond.telefone}</p>
                <p><strong>E-mail:</strong> ${cond.email || 'Não cadastrado'}</p>
                <div style="margin-top: 16px;">
                    <button class="btn btn-ghost" onclick="alert('Funcionalidade de redefinir acesso ao portal em desenvolvimento.')">Redefinir Acesso ao Portal</button>
                    <button class="btn btn-ghost" style="color: var(--danger-color);" onclick="alert('Acesso desativado para este condomínio.')">Desativar Acesso</button>
                </div>
            </div>
        `;
    } else if (aba === 'chamados') {
        const lista = dados.chamados.filter(c => c.condominio === cond.nome);
        container.innerHTML = gerarTabelaGenericaChamados(lista);
    } else if (aba === 'os') {
        const lista = dados.ordensServico.filter(os => os.condominio === cond.nome);
        container.innerHTML = gerarTabelaGenericaOS(lista);
    } else if (aba === 'preventivas') {
        const lista = dados.preventivas.filter(p => p.condominio === cond.nome);
        container.innerHTML = gerarTabelaGenericaPreventivas(lista);
    } else if (aba === 'equipamentos') {
        const lista = dados.equipamentos.filter(eq => eq.condominio === cond.nome);
        container.innerHTML = gerarTabelaGenericaEquipamentos(lista);
    } else if (aba === 'documentos') {
        const lista = dados.documentos.filter(d => d.condominio === cond.nome);
        container.innerHTML = gerarTabelaGenericaDocumentos(lista);
    } else if (aba === 'historico') {
        container.innerHTML = `<div class="card"><p style="color:var(--text-muted);">Histórico unificado de atendimentos e manutenções do condomínio.</p></div>`;
    }
};

function gerarTabelaGenericaChamados(lista) {
    if(lista.length === 0) return `<p style="color:var(--text-muted);">Nenhum chamado para este condomínio.</p>`;
    return `<div class="table-responsive"><table class="table"><thead><tr><th>ID</th><th>Problema</th><th>Data</th><th>Status</th></tr></thead><tbody>` +
        lista.map(c => `<tr><td>#${c.id}</td><td>${c.problema}</td><td>${c.data}</td><td><span class="badge badge-status-aberta">${c.status}</span></td></tr>`).join('') +
        `</tbody></table></div>`;
}

function gerarTabelaGenericaOS(lista) {
    if(lista.length === 0) return `<p style="color:var(--text-muted);">Nenhuma OS para este condomínio.</p>`;
    return `<div class="table-responsive"><table class="table"><thead><tr><th>OS</th><th>Serviço</th><th>Técnico</th><th>Status</th></tr></thead><tbody>` +
        lista.map(os => `<tr><td>#${os.id}</td><td>${os.servico}</td><td>${os.tecnico}</td><td><span class="badge badge-status-andamento">${os.status}</span></td></tr>`).join('') +
        `</tbody></table></div>`;
}

function gerarTabelaGenericaPreventivas(lista) {
    if(lista.length === 0) return `<p style="color:var(--text-muted);">Nenhum plano preventivo.</p>`;
    return `<div class="table-responsive"><table class="table"><thead><tr><th>Equipamento</th><th>Periodicidade</th><th>Próxima Data</th></tr></thead><tbody>` +
        lista.map(p => `<tr><td>${p.equipamentoNome}</td><td>${p.periodicidade}</td><td>${p.proximaData}</td></tr>`).join('') +
        `</tbody></table></div>`;
}

function gerarTabelaGenericaEquipamentos(lista) {
    if(lista.length === 0) return `<p style="color:var(--text-muted);">Nenhum equipamento cadastrado.</p>`;
    return `<div class="table-responsive"><table class="table"><thead><tr><th>Código</th><th>Nome</th><th>Categoria</th><th>Status</th></tr></thead><tbody>` +
        lista.map(eq => `<tr><td>${eq.codigo}</td><td>${eq.nome}</td><td>${eq.categoria}</td><td>${eq.status}</td></tr>`).join('') +
        `</tbody></table></div>`;
}

function gerarTabelaGenericaDocumentos(lista) {
    if(lista.length === 0) return `<p style="color:var(--text-muted);">Nenhum documento.</p>`;
    return `<div class="table-responsive"><table class="table"><thead><tr><th>Título</th><th>Categoria</th><th>Ação</th></tr></thead><tbody>` +
        lista.map(d => `<tr><td>${d.titulo}</td><td>${d.categoria}</td><td><a href="${d.link}" target="_blank" class="btn btn-primary" style="padding:4px 8px; font-size:11px;">Abrir</a></td></tr>`).join('') +
        `</tbody></table></div>`;
}

// RESTANTE DOS MÓDULOS PADRÃO
function configurarModuloChamados() {
    const btnAbrir = document.getElementById('btn-abrir-modal-chamado'); if(!btnAbrir) return;
    const modalNovo = document.getElementById('modal-novo-chamado'); const formNovo = document.getElementById('form-novo-chamado');
    const fecharModal = () => { modalNovo.classList.add('hidden'); formNovo.reset(); };
    btnAbrir.addEventListener('click', () => modalNovo.classList.remove('hidden'));
    document.getElementById('btn-fechar-modal-chamado').addEventListener('click', fecharModal);
    document.getElementById('btn-cancelar-chamado').addEventListener('click', (e) => { e.preventDefault(); fecharModal(); });
    formNovo.addEventListener('submit', (e) => {
        e.preventDefault(); const dados = getDados();
        const novoId = dados.chamados.length > 0 ? Math.max(...dados.chamados.map(c => c.id)) + 1 : 101;
        dados.chamados.push({ id: novoId, condominio: document.getElementById('input-chamado-condominio').value, problema: document.getElementById('input-chamado-problema').value, prioridade: document.getElementById('input-chamado-prioridade').value, status: "Novo", data: new Date().toLocaleDateString('pt-BR') });
        salvarDados(dados); renderizarTabelaChamados(); fecharModal();
    });
}
function renderizarTabelaChamados(filtroStatus = 'Todos') {
    const dados = getDados(); const tbody = document.querySelector('#tabela-chamados tbody'); if(!tbody) return; tbody.innerHTML = ''; 
    let lista = dados.chamados; if(filtroStatus !== 'Todos') lista = lista.filter(c => c.status === filtroStatus);
    if (lista.length === 0) { tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color: var(--text-muted);">Nenhum chamado encontrado.</td></tr>`; return;}
    [...lista].reverse().forEach(chamado => {
        tbody.innerHTML += `<tr><td>#${chamado.id}</td><td><strong>${chamado.condominio}</strong></td><td>${chamado.problema}</td><td><span class="badge badge-prio-normal">${chamado.prioridade}</span></td><td><span class="badge badge-status-novo">${chamado.status}</span></td><td style="text-align: right;"><button class="btn btn-primary" style="padding: 4px 10px; font-size: 11px;" onclick="abrirDetalhesChamado(${chamado.id})">Gerenciar</button></td></tr>`;
    });
}
window.abrirDetalhesChamado = function(id) {
    const dados = getDados(); const chamado = dados.chamados.find(c => c.id == id); if(!chamado) return;
    document.getElementById('modal-chamado-titulo').textContent = `Chamado #${chamado.id} — ${chamado.condominio}`;
    const corpo = document.getElementById('modal-chamado-corpo'); const footer = document.getElementById('modal-chamado-footer');
    const osExistente = dados.ordensServico.find(os => os.chamadoId == chamado.id);
    corpo.innerHTML = `<p><strong>Problema:</strong> ${chamado.problema}</p><p><strong>Data:</strong> ${chamado.data}</p>`;
    if(osExistente) {
        footer.innerHTML = `<button class="btn btn-primary" onclick="document.getElementById('modal-detalhe-chamado').classList.add('hidden'); abrirDetalheOS(${osExistente.id})">Ver OS #${osExistente.id}</button>`;
    } else {
        footer.innerHTML = `<button class="btn btn-primary" onclick="converterChamadoEmOS(${chamado.id})">Criar Ordem de Serviço</button>`;
    }
    document.getElementById('modal-detalhe-chamado').classList.remove('hidden');
};
window.converterChamadoEmOS = function(chamadoId) {
    const dados = getDados(); const chamado = dados.chamados.find(c => c.id == chamadoId); if(!chamado) return;
    const novoId = dados.ordensServico.length > 0 ? Math.max(...dados.ordensServico.map(os => os.id)) + 1 : 1001;
    const hojeIso = new Date().toISOString().split('T')[0];
    dados.ordensServico.push({ id: novoId, chamadoId: chamado.id, condominio: chamado.condominio, servico: chamado.problema, dataFormatoEN: hojeIso, data: hojeIso.split('-').reverse().join('/'), hora: "09:00", tecnico: "João Silva", status: "Em andamento", diagnostico: "", materiais: "", fotosAntesDepois: "" });
    chamado.status = "Convertido em OS"; salvarDados(dados);
    document.getElementById('modal-detalhe-chamado').classList.add('hidden'); renderizarTabelaChamados(); renderizarTabelaOS(); alert(`OS #${novoId} criada!`);
};
function configurarModuloOS() {
    const btnAbrirOS = document.getElementById('btn-abrir-modal-os'); if(!btnAbrirOS) return;
    const modalOS = document.getElementById('modal-nova-os'); const formOS = document.getElementById('form-nova-os');
    const fecharModal = () => { modalOS.classList.add('hidden'); formOS.reset(); };
    btnAbrirOS.addEventListener('click', () => { document.getElementById('input-os-data').value = new Date().toISOString().split('T')[0]; modalOS.classList.remove('hidden'); });
    document.getElementById('btn-fechar-modal-os').addEventListener('click', fecharModal); document.getElementById('btn-cancelar-os').addEventListener('click', (e) => { e.preventDefault(); fecharModal(); });
    formOS.addEventListener('submit', (e) => {
        e.preventDefault(); const dados = getDados(); const novoId = dados.ordensServico.length > 0 ? Math.max(...dados.ordensServico.map(os => os.id)) + 1 : 1001;
        dados.ordensServico.push({ id: novoId, chamadoId: null, condominio: document.getElementById('input-os-condominio').value, servico: document.getElementById('input-os-servico').value, data: document.getElementById('input-os-data').value.split('-').reverse().join('/'), hora: document.getElementById('input-os-hora').value, tecnico: document.getElementById('input-os-tecnico').value, status: document.getElementById('input-os-status').value, diagnostico: "", materiais: "", fotosAntesDepois: "" });
        salvarDados(dados); renderizarTabelaOS(); fecharModal();
    });
}
function renderizarTabelaOS(filtroStatus = 'Todas') {
    const dados = getDados(); const tbody = document.querySelector('#tabela-os tbody'); if(!tbody) return; tbody.innerHTML = ''; 
    let lista = dados.ordensServico; if(filtroStatus !== 'Todas') lista = lista.filter(os => os.status === filtroStatus);
    if (lista.length === 0) { tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color: var(--text-muted);">Nenhuma OS encontrada.</td></tr>`; return; }
    lista.forEach(os => {
        tbody.innerHTML += `<tr><td>#${os.id}</td><td><strong>${os.condominio}</strong></td><td>${os.servico}</td><td>${os.data}</td><td>${os.tecnico}</td><td><span class="badge badge-status-andamento">${os.status}</span></td><td style="text-align: right;"><button class="btn btn-primary" style="padding: 4px 10px; font-size: 11px;" onclick="abrirDetalheOS(${os.id})">Detalhes</button></td></tr>`;
    });
}
window.abrirDetalheOS = function(osId) {
    const dados = getDados(); const os = dados.ordensServico.find(o => o.id == osId); if(!os) return;
    document.getElementById('os-modal-titulo').textContent = `Ordem de Serviço #${os.id}`;
    document.getElementById('os-modal-corpo').innerHTML = `<p><strong>Serviço:</strong> ${os.servico}</p><p><strong>Status:</strong> ${os.status}</p>`;
    document.getElementById('modal-detalhe-os').classList.remove('hidden');
};
function configurarModuloAgenda() {}
function renderizarAgendaRotas() {}
function configurarModuloTecnico() {}
function renderizarAgendaTecnico() {}
function configurarModuloEquipamentos() {}
function renderizarTabelaEquipamentos() {}
function configurarModuloPreventivas() {}
function renderizarTabelaPreventivas() {}
function configurarModuloDocumentos() {}
function renderizarTabelaDocumentos() {}
function configurarModuloPortalSindico() {}
function atualizarPortalSindico() {}
function configurarTelaConfiguracoes() {}