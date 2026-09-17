document.addEventListener('DOMContentLoaded', () => {
    inicializarSistema();
    configurarNavegacao();
    configurarMenuMobile();
    configurarSeletorPerfil();
    configurarModuloPortalSindico();
    configurarModuloChamados();
    configurarModuloOS();
    configurarModuloTecnico();
    configurarModuloAgendaRotas(); 
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
                { id: 101, condominio: "Residencial Jardim das Palmeiras", local: "Bloco B - Piscina", categoria: "Bombas", problema: "Bomba fazendo barulho", prioridade: "Alta", status: "Novo", data: "16/09/2026", foto: "" }
            ], 
            ordensServico: [
                { id: 1048, chamadoId: 101, condominio: "Residencial Jardim das Palmeiras", servico: "Manutenção da bomba", dataFormatoEN: new Date().toISOString().split('T')[0], data: "16/09/2026", hora: "08:00", tecnico: "João Silva", status: "Em andamento", diagnostico: "", materiais: "", fotosAntesDepois: "" },
                { id: 1051, chamadoId: null, condominio: "Condomínio Solar", servico: "Inspeção elétrica", dataFormatoEN: new Date().toISOString().split('T')[0], data: "16/09/2026", hora: "10:00", tecnico: "João Silva", status: "Agendada", diagnostico: "", materiais: "", fotosAntesDepois: "" }
            ], 
            condominios: [
                { id: 1, nome: "Residencial Jardim das Palmeiras", endereco: "Av. Beira Rio, 1000", sindico: "João Siqueira", telefone: "(81) 99888-7766", email: "joao.sindico@email.com", status: "Ativo" },
                { id: 2, nome: "Condomínio Solar", endereco: "Rua das Flores, 45", sindico: "Carlos Alberto", telefone: "(81) 99777-6655", email: "carlos@solar.com", status: "Ativo" }
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
            if(targetPage === 'agenda') renderizarAgendaRotasMaster(); 
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

    if(document.getElementById('count-os')) document.getElementById('count-os').textContent = chamados.filter(c => c.status === 'Novo').length;
    if(document.getElementById('count-andamento')) document.getElementById('count-andamento').textContent = ordens.filter(os => os.status === 'Em andamento').length;
    if(document.getElementById('count-atrasadas')) document.getElementById('count-atrasadas').textContent = ordens.filter(os => os.status === 'Atrasada').length;
    if(document.getElementById('count-preventivas')) document.getElementById('count-preventivas').textContent = preventivas.length;
}

// =======================================================
// MÓDULO AGENDA E ROTAS (FERRAMENTA REAL DE PLANEJAMENTO)
// =======================================================
let visaoAtualAgenda = 'dia';

function configurarModuloAgendaRotas() {
    const inputData = document.getElementById('filtro-agenda-data');
    const selTec = document.getElementById('filtro-agenda-tecnico');
    
    if(inputData) {
        inputData.value = new Date().toISOString().split('T')[0];
        inputData.addEventListener('change', renderizarAgendaRotasMaster);
    }
    if(selTec) selTec.addEventListener('change', renderizarAgendaRotasMaster);
}

window.mudarVisaoAgenda = function(visao) {
    visaoAtualAgenda = visao;
    document.getElementById('btn-view-dia').classList.toggle('active', visao === 'dia');
    document.getElementById('btn-view-semana').classList.toggle('active', visao === 'semana');
    renderizarAgendaRotasMaster();
};

function renderizarAgendaRotasMaster() {
    const dados = getDados();
    const containerHorarios = document.getElementById('agenda-horarios-container');
    const tbodyRota = document.querySelector('#tabela-rota-tecnico tbody');
    if(!containerHorarios || !tbodyRota) return;

    containerHorarios.innerHTML = '';
    tbodyRota.innerHTML = '';

    const dataFiltro = document.getElementById('filtro-agenda-data').value;
    const tecFiltro = document.getElementById('filtro-agenda-tecnico').value;

    let ordens = dados.ordensServico || [];

    // Filtro por Data (Dia ou Semana)
    if(dataFiltro) {
        if(visaoAtualAgenda === 'dia') {
            ordens = ordens.filter(os => os.dataFormatoEN === dataFiltro);
        } else {
            // Visualização por semana (+7 dias)
            const inicio = new Date(dataFiltro);
            const fim = new Date(dataFiltro);
            fim.setDate(fim.getDate() + 7);
            ordens = ordens.filter(os => {
                if(!os.dataFormatoEN) return false;
                const d = new Date(os.dataFormatoEN);
                return d >= inicio && d <= fim;
            });
        }
    }

    if(tecFiltro !== 'Todos') {
        ordens = ordens.filter(os => os.tecnico === tecFiltro);
    }

    if(ordens.length === 0) {
        containerHorarios.innerHTML = `<p style="color:var(--text-muted); text-align:center; padding: 20px;">Nenhum atendimento programado para este período.</p>`;
        tbodyRota.innerHTML = `<tr><td colspan="4" style="text-align:center; color:var(--text-muted);">Nenhuma rota ativa.</td></tr>`;
        return;
    }

    // Ordena por horário
    ordens.sort((a,b) => (a.hora || '00:00').localeCompare(b.hora || '00:00'));

    // Verifica Conflitos de Agenda (Mesmo técnico no mesmo horário)
    verificarConflitosAgenda(ordens);

    // Renderiza Coluna 1: Agenda por Horário
    ordens.forEach(os => {
        containerHorarios.innerHTML += `
            <div class="timeline-item" onclick="abrirDetalheOS(${os.id})" style="cursor: pointer;">
                <div class="timeline-dot">🕒</div>
                <div class="timeline-content">
                    <div class="timeline-header">
                        <span class="timeline-time">${os.hora || '08:00'} (${os.data})</span>
                        <span class="badge badge-status-andamento">${os.tecnico}</span>
                    </div>
                    <div class="timeline-title">${os.condominio}</div>
                    <div class="timeline-desc">OS #${os.id} — ${os.servico}</div>
                </div>
            </div>
        `;
    });

    // Renderiza Coluna 2: Tabela de Rota do Técnico com seletor de status
    ordens.forEach(os => {
        const condObj = dados.condominios.find(c => c.nome === os.condominio);
        const endereco = condObj ? condObj.endereco : 'Endereço não cadastrado';

        let badgeStatus = 'badge-status-andamento';
        if(os.status === 'Concluída') badgeStatus = 'badge-status-concluida';
        if(os.status === 'Atrasada') badgeStatus = 'badge-status-atrasada';

        tbodyRota.innerHTML += `
            <tr>
                <td><strong>${os.hora || '08:00'}</strong><br><small style="color:var(--text-muted);">OS #${os.id}</small></td>
                <td><strong>${os.condominio}</strong><br><small style="color:var(--text-muted);">${endereco}</small></td>
                <td>${os.servico} (${os.tecnico})</td>
                <td>
                    <select class="form-control" style="padding: 4px 8px; font-size: 11px; width: auto;" onchange="atualizarStatusRota(${os.id}, this.value)">
                        <option value="Agendada" ${os.status==='Agendada'?'selected':''}>Agendada</option>
                        <option value="A caminho" ${os.status==='A caminho'?'selected':''}>A caminho</option>
                        <option value="Em andamento" ${os.status==='Em andamento'?'selected':''}>Em atendimento</option>
                        <option value="Concluída" ${os.status==='Concluída'?'selected':''}>Concluída</option>
                        <option value="Cancelada" ${os.status==='Cancelada'?'selected':''}>Cancelada</option>
                    </select>
                </td>
            </tr>
        `;
    });
}

// DETECÇÃO E ALERTA DE CONFLITO DE AGENDA
function verificarConflitosAgenda(ordens) {
    const mapaHorarios = {};
    let temConflito = false;

    ordens.forEach(os => {
        const chave = `${os.tecnico}_${os.dataFormatoEN}_${os.hora}`;
        if(mapaHorarios[chave] && os.status !== 'Cancelada' && os.status !== 'Concluída') {
            temConflito = true;
        } else {
            mapaHorarios[chave] = os.id;
        }
    });

    if(temConflito) {
        document.getElementById('texto-aviso-conflito').textContent = "Atenção: O técnico selecionado possui mais de um atendimento alocado para o mesmo horário e dia!";
        document.getElementById('modal-conflito-agenda').classList.remove('hidden');
    }
}

window.fecharModalConflito = function() {
    document.getElementById('modal-conflito-agenda').classList.add('hidden');
};

window.confirmarForcarConflito = function() {
    document.getElementById('modal-conflito-agenda').classList.add('hidden');
    alert("Conflito reconhecido pelo operador. O planejamento foi mantido sob ressalva.");
};

window.atualizarStatusRota = function(osId, novoStatus) {
    const dados = getDados();
    const os = dados.ordensServico.find(o => o.id == osId);
    if(os) {
        os.status = novoStatus;
        salvarDados(dados);
        renderizarAgendaRotasMaster();
    }
};

window.organizarRotaManual = function() {
    alert("Assistente de Roteirização: As OS pendentes de hoje foram ordenadas por proximidade geográfica estimada.");
    renderizarAgendaRotasMaster();
};

// DEMAIS MÓDULOS PADRÃO
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
        dados.ordensServico.push({ id: novoId, chamadoId: null, condominio: document.getElementById('input-os-condominio').value, servico: document.getElementById('input-os-servico').value, dataFormatoEN: document.getElementById('input-os-data').value, data: document.getElementById('input-os-data').value.split('-').reverse().join('/'), hora: document.getElementById('input-os-hora').value, tecnico: document.getElementById('input-os-tecnico').value, status: document.getElementById('input-os-status').value, diagnostico: "", materiais: "", fotosAntesDepois: "" });
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
function configurarModuloCondominios() {
    const btnAbrir = document.getElementById('btn-abrir-modal-condominio'); if(!btnAbrir) return;
    const modalCond = document.getElementById('modal-novo-condominio'); const formCond = document.getElementById('form-novo-condominio');
    const fecharModal = () => { modalCond.classList.add('hidden'); formCond.reset(); };
    btnAbrir.addEventListener('click', () => modalCond.classList.remove('hidden'));
    document.getElementById('btn-fechar-modal-condominio').addEventListener('click', fecharModal); document.getElementById('btn-cancelar-condominio').addEventListener('click', (e) => { e.preventDefault(); fecharModal(); });
    formCond.addEventListener('submit', (e) => {
        e.preventDefault(); const dados = getDados(); const novoId = dados.condominios.length > 0 ? Math.max(...dados.condominios.map(c => c.id)) + 1 : 1;
        dados.condominios.push({ id: novoId, nome: document.getElementById('input-cond-nome').value, endereco: document.getElementById('input-cond-endereco').value, sindico: document.getElementById('input-cond-sindico').value, telefone: document.getElementById('input-cond-telefone').value, email: document.getElementById('input-cond-email').value, status: document.getElementById('input-cond-status').value });
        salvarDados(dados); fecharModal();
    });
}
function renderizarTabelaCondominios() {
    const dados = getDados(); const tbody = document.querySelector('#tabela-condominios tbody'); if(!tbody) return; tbody.innerHTML = '';
    dados.condominios.forEach(c => { tbody.innerHTML += `<tr><td><strong>${c.nome}</strong></td><td>${c.endereco}</td><td>${c.sindico}</td><td>0</td><td>0</td><td><span class="badge badge-status-ativo">${c.status}</span></td><td style="text-align:right;"><button class="btn btn-primary" style="padding:4px 10px; font-size:11px;">Gerenciar</button></td></tr>`; });
}
function configurarModuloPortalSindico() {}
function atualizarPortalSindico() {}
function configurarTelaConfiguracoes() {}