document.addEventListener('DOMContentLoaded', () => {
    inicializarSistema();
    configurarNavegacao();
    configurarMenuMobile();
    configurarSeletorPerfil();
    configurarTelaConfiguracoes();
    configurarModuloChamados();
    configurarModuloOS();
    configurarModuloTecnico();
    configurarModuloAgenda(); 
    configurarModuloRotas();
    configurarModuloCondominios();
    configurarModuloEquipamentos(); 
    configurarModuloMateriais();
    configurarModuloPreventivas();
    configurarModuloDocumentos();
    configurarModuloRelatorios();
});

window.irParaTela = function(tela) {
    const link = document.querySelector(`.nav-item[data-page="${tela}"]`);
    if(link) link.click();
};

function inicializarSistema() {
    if (!localStorage.getItem('mp_data')) {
        const emptyData = {
            settings: { companyName: "Manutenção Pro", primaryColor: "#1e40af" },
            chamados: [], ordensServico: [], condominios: [], equipamentos: [], preventivas: [], documentos: [], materiais: []
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
    const logoHolder = document.getElementById('company-logo-placeholder');
    if(logoHolder) logoHolder.textContent = dados.settings.companyName.substring(0, 2).toUpperCase();
}

function configurarSeletorPerfil() {
    const seletor = document.getElementById('seletor-perfil-usuario');
    if(!seletor) return;
    seletor.addEventListener('change', (e) => {
        aplicarRegraPerfil(e.target.value);
    });
}

function aplicarRegraPerfil(perfil) {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        const page = item.getAttribute('data-page');
        if (perfil === 'tecnico') {
            if (['dashboard', 'agenda', 'rotas', 'tecnico', 'documentos'].includes(page)) {
                item.style.display = 'flex';
            } else {
                item.style.display = 'none';
            }
        } else if (perfil === 'sindico') {
            if (['dashboard', 'chamados', 'os', 'documentos'].includes(page)) {
                item.style.display = 'flex';
            } else {
                item.style.display = 'none';
            }
        } else {
            item.style.display = 'flex';
        }
    });
    const abaAtiva = document.querySelector('.nav-item.active');
    if (abaAtiva && abaAtiva.style.display === 'none') {
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
            if(targetPage === 'rotas') renderizarTelaRotas(); 
            if(targetPage === 'condominios') renderizarTabelaCondominios(); 
            if(targetPage === 'equipamentos') renderizarTabelaEquipamentos(); 
            if(targetPage === 'materiais') renderizarTabelaMateriais(); 
            if(targetPage === 'preventivas') renderizarTabelaPreventivas(); 
            if(targetPage === 'documentos') renderizarTabelaDocumentos(); 
            if(targetPage === 'relatorios') inicializarTelaRelatorios(); 
        });
    });
}

function configurarMenuMobile() {
    const btn = document.getElementById('mobile-menu-btn');
    if(btn) btn.addEventListener('click', () => document.getElementById('sidebar').classList.toggle('open'));
}

// =======================================================
// NOVO DASHBOARD OPERACIONAL CORPORATIVO
// =======================================================
function atualizarDashboard() {
    const dados = getDados();
    const ordens = dados.ordensServico || [];
    const chamados = dados.chamados || [];
    const preventivas = dados.preventivas || [];
    
    const hojeObj = new Date();
    const ano = hojeObj.getFullYear();
    const mes = String(hojeObj.getMonth() + 1).padStart(2, '0');
    const dia = String(hojeObj.getDate()).padStart(2, '0');
    const hojeIso = `${ano}-${mes}-${dia}`;

    // Verificação automática de OS atrasadas
    let alterou = false;
    ordens.forEach(os => {
        if(os.status !== 'Concluída' && os.dataFormatoEN) {
            if(os.dataFormatoEN < hojeIso && os.status !== 'Atrasada') {
                os.status = 'Atrasada';
                alterou = true;
            }
        }
    });
    if(alterou) localStorage.setItem('mp_data', JSON.stringify(dados));

    // Métricas dos 5 Indicadores
    const chamadosNovos = chamados.filter(c => c.status === 'Novo').length;
    const osAndamento = ordens.filter(os => os.status === 'Em andamento').length;
    const osAtrasadas = ordens.filter(os => os.status === 'Atrasada').length;
    const servicosHoje = ordens.filter(os => os.dataFormatoEN === hojeIso && os.status !== 'Concluída').length;
    
    let prevProximasCount = 0;
    preventivas.forEach(p => {
        if(p.proximaData >= hojeIso) {
            const diffDias = Math.ceil((new Date(p.proximaData) - new Date(hojeIso)) / (1000 * 60 * 60 * 24));
            if(diffDias <= 3) prevProximasCount++;
        }
    });

    // Injeta nos contadores do topo
    document.getElementById('dash-ind-chamados').textContent = chamadosNovos;
    document.getElementById('dash-ind-andamento').textContent = osAndamento;
    document.getElementById('dash-ind-atrasadas').textContent = osAtrasadas;
    document.getElementById('dash-ind-hoje').textContent = servicosHoje;
    document.getElementById('dash-ind-preventivas').textContent = prevProximasCount;

    // Piscar cartão se houver atrasos
    const cardAtrasoEl = document.querySelector('.card-atrasadas-animado');
    if(cardAtrasoEl) {
        if(osAtrasadas > 0) cardAtrasoEl.classList.add('tem-atraso');
        else cardAtrasoEl.classList.remove('tem-atraso');
    }

    // 1. BLOCO: ATENÇÃO NA OPERAÇÃO
    const containerAtencao = document.getElementById('dash-atencao-container');
    if(containerAtencao) {
        containerAtencao.innerHTML = '';
        const pendencias = ordens.filter(os => os.status === 'Atrasada' || os.status === 'Aberta');
        
        if(pendencias.length === 0) {
            containerAtencao.innerHTML = `<p style="color: var(--text-muted); font-size: 13px; padding: 6px 0;">Não existem pendências que exigem atenção.</p>`;
        } else {
            pendencias.slice(0, 3).forEach(os => {
                containerAtencao.innerHTML += `
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid var(--border-color);">
                        <div>
                            <strong>OS #${os.id}</strong> — ${os.condominio}<br>
                            <span style="font-size: 12px; color: var(--text-muted);">${os.servico}</span>
                        </div>
                        <button class="btn btn-primary" style="padding: 4px 10px; font-size: 12px;" onclick="irParaTela('os')">Ver OS</button>
                    </div>
                `;
            });
        }
    }

    // 2. BLOCO: AGENDA DE HOJE
    const containerAgenda = document.getElementById('dash-agenda-hoje-container');
    if(containerAgenda) {
        containerAgenda.innerHTML = '';
        const agendaHoje = ordens.filter(os => os.dataFormatoEN === hojeIso);
        
        if(agendaHoje.length === 0) {
            containerAgenda.innerHTML = `<p style="color: var(--text-muted); font-size: 13px; padding: 6px 0;">Nenhum atendimento programado para hoje.</p>`;
        } else {
            agendaHoje.forEach(os => {
                containerAgenda.innerHTML += `
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid var(--border-color);">
                        <div>
                            <strong>${os.hora || '08:00'}</strong> — ${os.condominio}<br>
                            <span style="font-size: 12px; color: var(--text-muted);">${os.servico} (Técnico: ${os.tecnico})</span>
                        </div>
                        <span class="badge badge-status-andamento">${os.status}</span>
                    </div>
                `;
            });
        }
    }

    // 3. BLOCO: EQUIPE EM CAMPO
    const containerEquipe = document.getElementById('dash-equipe-container');
    if(containerEquipe) {
        containerEquipe.innerHTML = '';
        const emCampo = ordens.filter(os => os.status === 'Em andamento');
        
        if(emCampo.length === 0) {
            containerEquipe.innerHTML = `<p style="color: var(--text-muted); font-size: 13px; padding: 6px 0;">Nenhum técnico em atendimento no momento.</p>`;
        } else {
            emCampo.forEach(os => {
                containerEquipe.innerHTML += `
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid var(--border-color);">
                        <div>
                            <strong>${os.tecnico}</strong><br>
                            <span style="font-size: 12px; color: var(--text-muted);">${os.condominio} - ${os.servico}</span>
                        </div>
                        <span class="badge badge-status-andamento">Em campo</span>
                    </div>
                `;
            });
        }
    }

    // 4. BLOCO: PREVENTIVAS PRÓXIMAS
    const containerPrev = document.getElementById('dash-preventivas-container');
    if(containerPrev) {
        containerPrev.innerHTML = '';
        const prevsProximas = preventivas.filter(p => p.proximaData >= hojeIso).sort((a,b) => a.proximaData.localeCompare(b.proximaData));
        
        if(prevsProximas.length === 0) {
            containerPrev.innerHTML = `<p style="color: var(--text-muted); font-size: 13px; padding: 6px 0;">Nenhuma manutenção preventiva programada.</p>`;
        } else {
            prevsProximas.slice(0, 3).forEach(p => {
                containerPrev.innerHTML += `
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid var(--border-color);">
                        <div>
                            <strong>${p.equipamentoNome}</strong> (${p.condominio})<br>
                            <span style="font-size: 12px; color: var(--text-muted);">Data: ${p.proximaData.split('-').reverse().join('/')} • ${p.periodicidade}</span>
                        </div>
                        <span class="badge badge-prev-prazo">Agendada</span>
                    </div>
                `;
            });
        }
    }
}

// MÓDULOS DE SUPORTE
function configurarModuloMateriais() {
    const btnAbrir = document.getElementById('btn-abrir-modal-material');
    if(!btnAbrir) return;
    const modalMat = document.getElementById('modal-novo-material');
    const formMat = document.getElementById('form-novo-material');
    const fecharModal = () => { modalMat.classList.add('hidden'); formMat.reset(); };

    btnAbrir.addEventListener('click', () => modalMat.classList.remove('hidden'));
    document.getElementById('btn-fechar-modal-material').addEventListener('click', fecharModal);
    document.getElementById('btn-cancelar-material').addEventListener('click', (e) => { e.preventDefault(); fecharModal(); });

    formMat.addEventListener('submit', (e) => {
        e.preventDefault();
        const dados = getDados();
        const novoId = dados.materiais.length > 0 ? Math.max(...dados.materiais.map(m => m.id)) + 1 : 1;
        dados.materiais.push({
            id: novoId,
            codigo: `MAT-${String(novoId).padStart(3, '0')}`,
            nome: document.getElementById('input-mat-nome').value,
            categoria: document.getElementById('input-mat-cat').value,
            quantidade: document.getElementById('input-mat-qtd').value,
            minimo: document.getElementById('input-mat-min').value
        });
        salvarDados(dados); renderizarTabelaMateriais(); fecharModal();
    });
}

function renderizarTabelaMateriais() {
    const dados = getDados();
    const tbody = document.querySelector('#tabela-materiais tbody');
    if(!tbody) return;
    tbody.innerHTML = '';
    if(dados.materiais.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted);">Nenhum material cadastrado em estoque.</td></tr>`;
        return;
    }
    [...dados.materiais].reverse().forEach(m => {
        const tr = document.createElement('tr');
        const alertaEstoque = parseInt(m.quantidade) <= parseInt(m.minimo) ? `<span class="badge badge-prio-urgente">Baixo Estoque</span>` : `<span class="badge badge-status-aprovado">Normal</span>`;
        tr.innerHTML = `
            <td><strong>${m.codigo}</strong></td>
            <td>${m.nome}</td>
            <td>${m.categoria}</td>
            <td><strong>${m.quantidade} un.</strong> ${alertaEstoque}</td>
            <td>${m.minimo} un.</td>
            <td style="text-align: right;"><button class="icon-btn"><span class="material-symbols-outlined">visibility</span></button></td>
        `;
        tbody.appendChild(tr);
    });
}

function renderizarTelaRotas() {
    const container = document.getElementById('lista-rotas-otimizadas');
    if(!container) return;
    container.innerHTML = '';
    const dados = getDados();
    const ordens = dados.ordensServico.filter(os => os.status !== 'Concluída');
    
    if(ordens.length === 0) {
        container.innerHTML = `<p style="color: var(--text-muted); text-align: center; padding: 20px;">Nenhuma rota pendente para roteirização hoje.</p>`;
        return;
    }

    ordens.forEach((os, idx) => {
        container.innerHTML += `
            <div class="timeline-item">
                <div class="timeline-dot">${idx + 1}</div>
                <div class="timeline-content">
                    <div class="timeline-header"><span class="timeline-time">${os.hora || '08:00'}</span><span class="badge badge-status-andamento">${os.tecnico}</span></div>
                    <div class="timeline-title">${os.condominio}</div>
                    <div class="timeline-desc">Serviço: ${os.servico}</div>
                </div>
            </div>
        `;
    });
}

window.filtrarChamados = function(status) {
    const abas = document.querySelectorAll('#page-chamados .filter-tab');
    abas.forEach(t => t.classList.remove('active'));
    event.target.classList.add('active');
    renderizarTabelaChamados(status);
};

window.filtrarOS = function(status) {
    const abas = document.querySelectorAll('#page-os .filter-tab');
    abas.forEach(t => t.classList.remove('active'));
    event.target.classList.add('active');
    renderizarTabelaOS(status);
};

function configurarTelaConfiguracoes() {
    const btnSave = document.getElementById('btn-save-settings');
    if(!btnSave) return;
    const dados = getDados();
    document.getElementById('input-company-name').value = dados.settings.companyName;
    document.getElementById('input-primary-color').value = dados.settings.primaryColor;
    btnSave.addEventListener('click', () => {
        dados.settings.companyName = document.getElementById('input-company-name').value;
        dados.settings.primaryColor = document.getElementById('input-primary-color').value;
        salvarDados(dados); aplicarConfiguracoesVisuais(); alert("Configurações salvas!");
    });
}

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
        const novoId = dados.chamados.length > 0 ? Math.max(...dados.chamados.map(c => c.id)) + 1 : 1;
        dados.chamados.push({
            id: novoId, condominio: document.getElementById('input-chamado-condominio').value,
            problema: document.getElementById('input-chamado-problema').value,
            prioridade: document.getElementById('input-chamado-prioridade').value, status: "Novo" 
        });
        salvarDados(dados); renderizarTabelaChamados(); fecharModal();
    });
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
        let badgePrioridade = chamado.prioridade === 'Urgente' ? 'badge-prio-urgente' : (chamado.prioridade === 'Alta' ? 'badge-prio-alta' : 'badge-prio-normal');
        tr.innerHTML = `<td>#${chamado.id}</td><td><strong>${chamado.condominio}</strong></td><td>${chamado.problema}</td>
            <td><span class="badge ${badgePrioridade}">${chamado.prioridade}</span></td><td><span class="badge ${badgeStatus}">${chamado.status}</span></td>
            <td style="text-align: right;"><button class="icon-btn"><span class="material-symbols-outlined">visibility</span></button></td>`;
        tbody.appendChild(tr);
    });
}

function configurarModuloOS() {
    const btnAbrirOS = document.getElementById('btn-abrir-modal-os');
    if(!btnAbrirOS) return;
    const modalOS = document.getElementById('modal-nova-os');
    const formOS = document.getElementById('form-nova-os');
    const selectChamado = document.getElementById('input-os-chamado');
    const fecharModal = () => { modalOS.classList.add('hidden'); formOS.reset(); };

    const abrirModalOS = () => {
        const dados = getDados();
        selectChamado.innerHTML = '<option value="">Nenhum (Criar OS Avulsa)</option>';
        dados.chamados.filter(c => c.status !== 'Convertido em OS').forEach(c => {
            const opt = document.createElement('option'); opt.value = c.id; opt.textContent = `#${c.id} - ${c.condominio}`; selectChamado.appendChild(opt);
        });
        document.getElementById('input-os-data').value = new Date().toISOString().split('T')[0];
        modalOS.classList.remove('hidden');
    };
    btnAbrirOS.addEventListener('click', abrirModalOS);

    selectChamado.addEventListener('change', (e) => {
        const chamado = getDados().chamados.find(c => c.id == e.target.value);
        if(chamado) { document.getElementById('input-os-condominio').value = chamado.condominio; document.getElementById('input-os-servico').value = chamado.problema; } 
        else { document.getElementById('input-os-condominio').value = ''; document.getElementById('input-os-servico').value = ''; }
    });
    document.getElementById('btn-fechar-modal-os').addEventListener('click', fecharModal);
    document.getElementById('btn-cancelar-os').addEventListener('click', (e) => { e.preventDefault(); fecharModal(); });

    formOS.addEventListener('submit', (e) => {
        e.preventDefault(); 
        const dados = getDados();
        let novoId = dados.ordensServico.length > 0 ? Math.max(...dados.ordensServico.map(os => os.id)) + 1 : 1001;
        const chamadoId = selectChamado.value;
        const dataBruta = document.getElementById('input-os-data').value;
        
        const hojeIso = new Date().toISOString().split('T')[0];
        let statusInicial = document.getElementById('input-os-status').value;
        if(dataBruta < hojeIso && statusInicial !== 'Concluída') statusInicial = 'Atrasada';

        dados.ordensServico.push({
            id: novoId, chamadoId: chamadoId || null, condominio: document.getElementById('input-os-condominio').value,
            servico: document.getElementById('input-os-servico').value, dataFormatoEN: dataBruta, data: dataBruta.split('-').reverse().join('/'),
            hora: document.getElementById('input-os-hora').value, tecnico: document.getElementById('input-os-tecnico').value, status: statusInicial, diagnostico: ""
        });
        if(chamadoId) { const index = dados.chamados.findIndex(c => c.id == chamadoId); if(index !== -1) dados.chamados[index].status = 'Convertido em OS'; }
        salvarDados(dados); renderizarTabelaOS(); renderizarTabelaChamados(); fecharModal();
    });
}

function renderizarTabelaOS(filtroStatus = 'Todas') {
    const dados = getDados(); const tbody = document.querySelector('#tabela-os tbody'); if(!tbody) return; tbody.innerHTML = ''; 
    let lista = dados.ordensServico;
    if(filtroStatus !== 'Todas') lista = lista.filter(os => os.status === filtroStatus);

    if (lista.length === 0) { tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color: var(--text-muted);">Nenhuma OS encontrada.</td></tr>`; return; }
    [...lista].reverse().forEach(os => {
        const tr = document.createElement('tr');
        let badgeStatus = 'badge-status-aberta';
        if (os.status === 'Agendada') badgeStatus = 'badge-status-agendada'; 
        if (os.status === 'Em andamento') badgeStatus = 'badge-status-andamento'; 
        if (os.status === 'Concluída') badgeStatus = 'badge-status-concluida'; 
        if (os.status === 'Atrasada') badgeStatus = 'badge-status-atrasada'; 
        
        tr.innerHTML = `<td>#${os.id}</td><td><strong>${os.condominio}</strong></td><td>${os.servico}</td><td style="font-size: 12px;">${os.data} às ${os.hora}</td>
            <td>${os.tecnico}</td><td><span class="badge ${badgeStatus}">${os.status}</span></td><td style="text-align: right;"><button class="icon-btn"><span class="material-symbols-outlined">visibility</span></button></td>`;
        tbody.appendChild(tr);
    });
}

function configurarModuloAgenda() {
    const inputData = document.getElementById('filtro-agenda-data'); if(!inputData) return;
    inputData.value = new Date().toISOString().split('T')[0];
    inputData.addEventListener('change', renderizarAgendaRotas);
    document.getElementById('filtro-agenda-tecnico').addEventListener('change', renderizarAgendaRotas);
}
function renderizarAgendaRotas() {
    const container = document.getElementById('timeline-rotas'); if(!container) return; container.innerHTML = '';
    const dataFiltro = document.getElementById('filtro-agenda-data').value;
    const tecnicoFiltro = document.getElementById('filtro-agenda-tecnico').value;
    let ordens = getDados().ordensServico || [];
    if(dataFiltro) ordens = ordens.filter(os => os.dataFormatoEN === dataFiltro);
    if(tecnicoFiltro !== 'Todos') ordens = ordens.filter(os => os.tecnico === tecnicoFiltro);

    if(ordens.length === 0) { container.innerHTML = `<div style="text-align: center; padding: 30px;"><p style="color: var(--text-muted);">Nenhum agendamento para esta data/técnico.</p></div>`; return; }
    ordens.sort((a, b) => (a.hora || '').localeCompare(b.hora || ''));
    let passo = 1;
    ordens.forEach(os => {
        const item = document.createElement('div'); item.className = 'timeline-item';
        item.innerHTML = `<div class="timeline-dot">${passo}</div><div class="timeline-content"><div class="timeline-header"><span class="timeline-time">${os.hora}</span><span class="badge badge-status-andamento">${os.status}</span></div><div class="timeline-title">${os.condominio}</div><div class="timeline-desc">${os.servico} (Técnico: ${os.tecnico})</div></div>`;
        container.appendChild(item); passo++;
    });
}

function configurarModuloTecnico() {
    const sel = document.getElementById('simulador-tecnico'); if(sel) sel.addEventListener('change', renderizarAgendaTecnico);
    const fecharBtn = document.getElementById('btn-fechar-modal-exec'); if(fecharBtn) fecharBtn.addEventListener('click', () => document.getElementById('modal-executar-os').classList.add('hidden'));
    document.getElementById('btn-iniciar-servico').addEventListener('click', () => atualizarStatusOSTecnico('Em andamento'));
    document.getElementById('btn-finalizar-servico').addEventListener('click', () => {
        const diag = document.getElementById('exec-os-diagnostico').value;
        if(diag.trim() === '') { alert('Preencha o diagnóstico.'); return; }
        atualizarStatusOSTecnico('Concluída', diag); document.getElementById('modal-executar-os').classList.add('hidden');
    });
}
function atualizarStatusOSTecnico(novoStatus, diag = "") {
    const osId = document.getElementById('exec-os-id').value; const dados = getDados();
    const index = dados.ordensServico.findIndex(os => os.id == osId);
    if(index !== -1) {
        dados.ordensServico[index].status = novoStatus; if(diag) dados.ordensServico[index].diagnostico = diag;
        salvarDados(dados); renderizarAgendaTecnico();
    }
}
window.abrirModalExecutarOS = function(osId) {
    const os = getDados().ordensServico.find(o => o.id == osId); if(!os) return;
    document.getElementById('exec-os-id').value = os.id; document.getElementById('exec-os-servico').textContent = os.servico;
    document.getElementById('exec-os-diagnostico').value = os.diagnostico || "";
    document.getElementById('modal-executar-os').classList.remove('hidden');
};
function renderizarAgendaTecnico() {
    const container = document.getElementById('lista-os-tecnico'); if(!container) return; container.innerHTML = '';
    const tecnico = document.getElementById('simulador-tecnico').value; let ordens = getDados().ordensServico || [];
    if(tecnico !== 'Todos') ordens = ordens.filter(os => os.tecnico === tecnico);
    if (ordens.length === 0) { container.innerHTML = `<p style="color: var(--text-muted);">Nenhuma OS designada.</p>`; return; }
    ordens.forEach(os => {
        const card = document.createElement('div'); card.className = 'task-card';
        card.innerHTML = `<div class="task-header"><span class="task-id">OS #${os.id}</span><span class="badge badge-status-aberta">${os.status}</span></div><div class="task-info"><p class="title">${os.condominio}</p><p class="desc">${os.servico}</p></div><div class="task-footer"><button class="btn btn-primary btn-executar" style="width: 100%;">Executar OS</button></div>`;
        card.querySelector('.btn-executar').addEventListener('click', () => abrirModalExecutarOS(os.id));
        container.appendChild(card);
    });
}

function configurarModuloCondominios() {
    const btnAbrir = document.getElementById('btn-abrir-modal-condominio'); if(!btnAbrir) return; 
    const modalCond = document.getElementById('modal-novo-condominio'); const formCond = document.getElementById('form-novo-condominio');
    const fecharModal = () => { modalCond.classList.add('hidden'); formCond.reset(); };
    btnAbrir.addEventListener('click', () => modalCond.classList.remove('hidden'));
    document.getElementById('btn-fechar-modal-condominio').addEventListener('click', fecharModal); document.getElementById('btn-cancelar-condominio').addEventListener('click', (e) => { e.preventDefault(); fecharModal(); });
    formCond.addEventListener('submit', (e) => {
        e.preventDefault(); const dados = getDados(); const novoId = dados.condominios.length > 0 ? Math.max(...dados.condominios.map(c => c.id)) + 1 : 1;
        dados.condominios.push({
            id: novoId, nome: document.getElementById('input-cond-nome').value, endereco: document.getElementById('input-cond-endereco').value,
            sindico: document.getElementById('input-cond-sindico').value, telefone: document.getElementById('input-cond-telefone').value,
            email: document.getElementById('input-cond-email').value, status: document.getElementById('input-cond-status').value
        });
        salvarDados(dados); renderizarTabelaCondominios(); fecharModal();
    });
}
function renderizarTabelaCondominios() {
    const dados = getDados(); const tbody = document.querySelector('#tabela-condominios tbody'); if(!tbody) return; tbody.innerHTML = ''; 
    if (dados.condominios.length === 0) { tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color: var(--text-muted);">Nenhum condomínio cadastrado.</td></tr>`; return; }
    dados.condominios.forEach(cond => {
        const tr = document.createElement('tr'); let badgeStatus = cond.status === 'Ativo' ? 'badge-status-ativo' : 'badge-status-inativo';
        tr.innerHTML = `<td><strong>${cond.nome}</strong></td><td>${cond.sindico}</td><td>${cond.telefone}</td><td>${cond.endereco}</td><td><span class="badge ${badgeStatus}">${cond.status}</span></td><td style="text-align: right;"><button class="icon-btn"><span class="material-symbols-outlined">visibility</span></button></td>`;
        tbody.appendChild(tr);
    });
}

function configurarModuloEquipamentos() {
    const btnAbrir = document.getElementById('btn-abrir-modal-equipamento'); if(!btnAbrir) return;
    const modalEquip = document.getElementById('modal-novo-equipamento'); const formEquip = document.getElementById('form-novo-equipamento');
    const selectCond = document.getElementById('input-equip-condominio'); const fecharModal = () => { modalEquip.classList.add('hidden'); formEquip.reset(); };

    btnAbrir.addEventListener('click', () => {
        const dados = getDados(); selectCond.innerHTML = '<option value="">Selecione o Condomínio...</option>';
        dados.condominios.forEach(c => { const opt = document.createElement('option'); opt.value = c.nome; opt.textContent = c.nome; selectCond.appendChild(opt); });
        modalEquip.classList.remove('hidden');
    });
    document.getElementById('btn-fechar-modal-equipamento').addEventListener('click', fecharModal); document.getElementById('btn-cancelar-equipamento').addEventListener('click', (e) => { e.preventDefault(); fecharModal(); });
    formEquip.addEventListener('submit', (e) => {
        e.preventDefault(); const dados = getDados(); const numId = dados.equipamentos.length > 0 ? Math.max(...dados.equipamentos.map(eq => eq.id)) + 1 : 1;
        dados.equipamentos.push({
            id: numId, codigo: `EQ-${String(numId).padStart(3, '0')}`, nome: document.getElementById('input-equip-nome').value,
            categoria: document.getElementById('input-equip-categoria').value, condominio: selectCond.value, status: document.getElementById('input-equip-status').value
        });
        salvarDados(dados); renderizarTabelaEquipamentos(); fecharModal();
    });
}
function renderizarTabelaEquipamentos() {
    const dados = getDados(); const tbody = document.querySelector('#tabela-equipamentos tbody'); if(!tbody) return; tbody.innerHTML = ''; 
    if (dados.equipamentos.length === 0) { tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color: var(--text-muted);">Nenhum equipamento cadastrado.</td></tr>`; return; }
    dados.equipamentos.forEach(eq => {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td><strong>${eq.codigo}</strong></td><td>${eq.nome}</td><td>${eq.condominio}</td><td>${eq.categoria}</td><td>Setor Principal</td><td><span class="badge badge-status-ativo">${eq.status}</span></td><td style="text-align: right;"><button class="icon-btn"><span class="material-symbols-outlined">visibility</span></button></td>`;
        tbody.appendChild(tr);
    });
}

function configurarModuloPreventivas() {
    const btnAbrir = document.getElementById('btn-abrir-modal-preventiva'); if(!btnAbrir) return;
    const modalPrev = document.getElementById('modal-nova-preventiva'); const formPrev = document.getElementById('form-nova-preventiva');
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
    document.getElementById('btn-fechar-modal-preventiva').addEventListener('click', fecharModal); document.getElementById('btn-cancelar-preventiva').addEventListener('click', (e) => { e.preventDefault(); fecharModal(); });
    formPrev.addEventListener('submit', (e) => {
        e.preventDefault(); const dados = getDados(); const numId = dados.preventivas.length > 0 ? Math.max(...dados.preventivas.map(p => p.id)) + 1 : 1;
        const eqObj = dados.equipamentos.find(eq => eq.id == selectEquip.value);
        dados.preventivas.push({
            id: numId, equipamentoNome: eqObj ? eqObj.nome : 'Equipamento', condominio: inputCond.value,
            periodicidade: document.getElementById('input-prev-periodicidade').value, tecnico: document.getElementById('input-prev-tecnico').value,
            proximaData: document.getElementById('input-prev-proxima').value
        });
        salvarDados(dados); renderizarTabelaPreventivas(); fecharModal();
    });
}
function renderizarTabelaPreventivas() {
    const dados = getDados(); const tbody = document.querySelector('#tabela-preventivas tbody'); if(!tbody) return; tbody.innerHTML = ''; 
    if (dados.preventivas.length === 0) { tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color: var(--text-muted);">Nenhum plano preventivo.</td></tr>`; return; }
    const hojeIso = new Date().toISOString().split('T')[0];
    dados.preventivas.forEach(p => {
        const tr = document.createElement('tr');
        let status = 'No Prazo'; let badge = 'badge-prev-prazo';
        if (p.proximaData < hojeIso) { status = 'Atrasada'; badge = 'badge-prev-atraso'; }
        tr.innerHTML = `<td><strong>${p.equipamentoNome}</strong></td><td>${p.condominio}</td><td>${p.periodicidade}</td><td>${p.proximaData.split('-').reverse().join('/')}</td><td><span class="badge ${badge}">${status}</span></td><td style="text-align: right;"><button class="icon-btn"><span class="material-symbols-outlined">visibility</span></button></td>`;
        tbody.appendChild(tr);
    });
}

function configurarModuloDocumentos() {
    const btnAbrir = document.getElementById('btn-abrir-modal-documento'); if(!btnAbrir) return;
    const modalDoc = document.getElementById('modal-novo-documento'); const formDoc = document.getElementById('form-novo-documento');
    const selectCond = document.getElementById('input-doc-condominio'); const fecharModal = () => { modalDoc.classList.add('hidden'); formDoc.reset(); };

    btnAbrir.addEventListener('click', () => {
        const dados = getDados(); selectCond.innerHTML = '<option value="">Selecione...</option>';
        dados.condominios.forEach(c => { const opt = document.createElement('option'); opt.value = c.nome; opt.textContent = c.nome; selectCond.appendChild(opt); });
        modalDoc.classList.remove('hidden');
    });
    document.getElementById('btn-fechar-modal-documento').addEventListener('click', fecharModal); document.getElementById('btn-cancelar-documento').addEventListener('click', (e) => { e.preventDefault(); fecharModal(); });
    formDoc.addEventListener('submit', (e) => {
        e.preventDefault(); const dados = getDados(); const numId = dados.documentos.length > 0 ? Math.max(...dados.documentos.map(d => d.id)) + 1 : 1;
        dados.documentos.push({
            id: numId, titulo: document.getElementById('input-doc-titulo').value, categoria: document.getElementById('input-doc-categoria').value,
            condominio: selectCond.value, link: document.getElementById('input-doc-link').value, dataCadastro: new Date().toLocaleDateString('pt-BR')
        });
        salvarDados(dados); renderizarTabelaDocumentos(); fecharModal();
    });
}
function renderizarTabelaDocumentos() {
    const dados = getDados(); const tbody = document.querySelector('#tabela-documentos tbody'); if(!tbody) return; tbody.innerHTML = ''; 
    if (dados.documentos.length === 0) { tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color: var(--text-muted);">Nenhum documento.</td></tr>`; return; }
    dados.documentos.forEach(d => {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td><strong>${d.titulo}</strong></td><td>${d.categoria}</td><td>${d.condominio}</td><td>${d.dataCadastro}</td><td style="text-align: right;"><a href="${d.link}" target="_blank" class="btn btn-primary" style="padding:4px 10px; font-size:11px; text-decoration:none;">Abrir</a></td>`;
        tbody.appendChild(tr);
    });
}

function configurarModuloRelatorios() {
    const selCond = document.getElementById('filtro-rel-condominio');
    const selTec = document.getElementById('filtro-rel-tecnico');
    if(selCond) selCond.addEventListener('change', atualizarRelatorios);
    if(selTec) selTec.addEventListener('change', atualizarRelatorios);
}

function inicializarTelaRelatorios() {
    const dados = getDados(); const selCond = document.getElementById('filtro-rel-condominio');
    if(selCond) {
        selCond.innerHTML = '<option value="Todos">Todos os Condomínios</option>';
        dados.condominios.forEach(c => { const opt = document.createElement('option'); opt.value = c.nome; opt.textContent = c.nome; selCond.appendChild(opt); });
    }
    atualizarRelatorios();
}

function atualizarRelatorios() {
    const dados = getDados();
    const condFiltro = document.getElementById('filtro-rel-condominio').value;
    const tecFiltro = document.getElementById('filtro-rel-tecnico').value;

    let chamados = dados.chamados || []; let ordens = dados.ordensServico || []; let preventivas = dados.preventivas || [];
    if(condFiltro !== 'Todos') { ordens = ordens.filter(os => os.condominio === condFiltro); chamados = chamados.filter(c => c.condominio === condFiltro); preventivas = preventivas.filter(p => p.condominio === condFiltro); }
    if(tecFiltro !== 'Todos') { ordens = ordens.filter(os => os.tecnico === tecFiltro); preventivas = preventivas.filter(p => p.tecnico === tecFiltro); }

    document.getElementById('rel-total-chamados').textContent = chamados.length;
    document.getElementById('rel-total-os').textContent = ordens.length;
    const concluidas = ordens.filter(os => os.status === 'Concluída').length;
    document.getElementById('rel-os-concluidas').textContent = concluidas;
    document.getElementById('rel-total-prev').textContent = preventivas.length;
    document.getElementById('rel-total-cond').textContent = (dados.condominios || []).length;
    document.getElementById('rel-total-equip').textContent = (dados.equipamentos || []).length;
    document.getElementById('rel-taxa-conclusao').textContent = (ordens.length > 0 ? Math.round((concluidas / ordens.length) * 100) : 0) + '%';

    const tbodyOs = document.querySelector('#tabela-relatorio-os tbody');
    if(tbodyOs) {
        tbodyOs.innerHTML = '';
        if(ordens.length === 0) tbodyOs.innerHTML = `<tr><td colspan="6" style="text-align:center; color:var(--text-muted);">Nenhuma OS encontrada.</td></tr>`;
        else ordens.forEach(os => {
            tbodyOs.innerHTML += `<tr><td>#${os.id}</td><td>${os.condominio}</td><td>${os.servico}</td><td>${os.tecnico}</td><td>${os.data}</td><td>${os.status}</td></tr>`;
        });
    }

    const tbodyPrev = document.querySelector('#tabela-relatorio-prev tbody');
    if(tbodyPrev) {
        tbodyPrev.innerHTML = '';
        if(preventivas.length === 0) tbodyPrev.innerHTML = `<tr><td colspan="5" style="text-align:center; color:var(--text-muted);">Nenhum plano.</td></tr>`;
        else preventivas.forEach(p => {
            tbodyPrev.innerHTML += `<tr><td>${p.equipamentoNome}</td><td>${p.condominio}</td><td>${p.periodicidade}</td><td>${p.proximaData}</td><td>${p.tecnico}</td></tr>`;
        });
    }
}

window.gerarRelatorioPDF = function() {
    const dados = getDados();
    const empresa = dados.settings.companyName || "Manutenção Pro";
    const janelaPrint = window.open('', '_blank');
    janelaPrint.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>Relatório Operacional</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 30px; color: #0f172a; }
                h1 { font-size: 20px; color: #1e40af; border-bottom: 2px solid #1e40af; padding-bottom: 8px; margin-bottom: 15px; }
                table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 11px; }
                th, td { border: 1px solid #cbd5e1; padding: 8px; text-align: left; }
                th { background-color: #f1f5f9; }
            </style>
        </head>
        <body>
            <h1>Relatório Executivo Operacional - ${empresa}</h1>
            <p>Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}</p>
            <h3>Ordens de Serviço Registradas:</h3>
            <table>
                <thead><tr><th>ID</th><th>Condomínio</th><th>Serviço</th><th>Técnico</th><th>Status</th></tr></thead>
                <tbody>
                    ${(dados.ordensServico || []).map(os => `<tr><td>#${os.id}</td><td>${os.condominio}</td><td>${os.servico}</td><td>${os.tecnico}</td><td>${os.status}</td></tr>`).join('')}
                </tbody>
            </table>
        </body>
        </html>
    `);
    janelaPrint.document.close();
    janelaPrint.focus();
    setTimeout(() => { janelaPrint.print(); }, 400);
};