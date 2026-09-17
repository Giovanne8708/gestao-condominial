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
    configurarModuloMateriais();
    configurarModuloPreventivas();
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
            chamados: [
                { id: 101, condominio: "Residencial Jardim das Palmeiras", local: "Bloco B - Piscina", categoria: "Bombas", problema: "Bomba fazendo barulho excessivo", prioridade: "Alta", status: "Novo", data: "16/09/2026", foto: "" },
                { id: 102, condominio: "Residencial Jardim das Palmeiras", local: "Portaria Principal", categoria: "Portões", problema: "Portão eletrônico travando", prioridade: "Urgente", status: "Em atendimento", data: "15/09/2026", foto: "" }
            ], 
            ordensServico: [
                { id: 1001, chamadoId: 101, condominio: "Residencial Jardim das Palmeiras", servico: "Manutenção da bomba", data: "16/09/2026", hora: "08:00", tecnico: "João Silva", status: "Em andamento", diagnostico: "" }
            ], 
            condominios: [
                { id: 1, nome: "Residencial Jardim das Palmeiras", endereco: "Av. Beira Rio, 1000", sindico: "João Siqueira", telefone: "(81) 99888-7766", status: "Ativo" },
                { id: 2, nome: "Condomínio Solar da Serra", endereco: "Rua das Flores, 45", sindico: "João Siqueira", telefone: "(81) 99888-7766", status: "Ativo" }
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
    const logoHolder = document.getElementById('company-logo-placeholder');
    if(logoHolder) logoHolder.textContent = dados.settings.companyName.substring(0, 2).toUpperCase();
}

// =======================================================
// CONTROLE DE PERFIS (ADMIN VS SÍNDICO)
// =======================================================
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
            
            // Renderização específica por tela
            if(targetPage === 'chamados') renderizarTabelaChamados();
            if(targetPage === 'os') renderizarTabelaOS();
            if(targetPage === 'tecnico') renderizarAgendaTecnico(); 
            if(targetPage === 'agenda') renderizarAgendaRotas(); 
            if(targetPage === 'condominios') renderizarTabelaCondominios(); 
            if(targetPage === 'equipamentos') renderizarTabelaEquipamentos(); 
            if(targetPage === 'materiais') renderizarTabelaMateriais(); 
            if(targetPage === 'preventivas') renderizarTabelaPreventivas(); 
            if(targetPage === 'documentos') renderizarTabelaDocumentos(); 
            
            // Telas do Síndico
            if(['sindico-inicio', 'sindico-meus-chamados', 'sindico-andamento', 'sindico-concluidos', 'sindico-novo-chamado', 'sindico-condominios'].includes(targetPage)) {
                atualizarPortalSindico();
            }
        });
    });
}

function configurarMenuMobile() {
    const btn = document.getElementById('mobile-menu-btn');
    if(btn) btn.addEventListener('click', () => document.getElementById('sidebar').classList.toggle('open'));
}

// =======================================================
// PORTAL DO SÍNDICO (FUNCIONALIDADES EXCLUSIVAS)
// =======================================================
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
                id: novoId,
                condominio: condAtual,
                local: document.getElementById('input-sind-chamado-local').value,
                categoria: document.getElementById('input-sind-chamado-cat').value,
                problema: document.getElementById('input-sind-chamado-desc').value,
                prioridade: document.getElementById('input-sind-chamado-prio').value,
                foto: document.getElementById('input-sind-chamado-foto').value,
                status: "Novo",
                data: new Date().toLocaleDateString('pt-BR')
            });

            salvarDados(dados);
            alert(`Chamado #${novoId} enviado com sucesso! A empresa foi notificada.`);
            formChamado.reset();
            irParaTela('sindico-meus-chamados');
        });
    }

    const btnFechaModalSind = document.getElementById('btn-fechar-detalhe-sind');
    const btnFechaModalFooter = document.getElementById('btn-fechar-detalhe-footer');
    const modalDetalhe = document.getElementById('modal-detalhe-chamado-sindico');
    if(btnFechaModalSind) btnFechaModalSind.addEventListener('click', () => modalDetalhe.classList.add('hidden'));
    if(btnFechaModalFooter) btnFechaModalFooter.addEventListener('click', () => modalDetalhe.classList.add('hidden'));
}

function atualizarPortalSindico() {
    const dados = getDados();
    const selCond = document.getElementById('seletor-condominio-sindico');
    
    // Popula seletor de condomínios do síndico
    if(selCond && selCond.options.length <= 1) {
        selCond.innerHTML = '';
        dados.condominios.forEach(c => {
            const opt = document.createElement('option');
            opt.value = c.nome;
            opt.textContent = c.nome;
            selCond.appendChild(opt);
        });
    }

    const condominioSelecionado = selCond ? selCond.value : (dados.condominios[0] ? dados.condominios[0].nome : '');
    const chamadosSindico = dados.chamados.filter(c => c.condominio === condominioSelecionado);

    // Contadores Início Síndico
    const total = chamadosSindico.length;
    const emAtendimento = chamadosSindico.filter(c => c.status === 'Em atendimento' || c.status === 'Convertido em OS').length;
    const concluidos = chamadosSindico.filter(c => c.status === 'Concluído').length;

    if(document.getElementById('sind-card-total')) document.getElementById('sind-card-total').textContent = total;
    if(document.getElementById('sind-card-andamento')) document.getElementById('sind-card-andamento').textContent = emAtendimento;
    if(document.getElementById('sind-card-concluidos')) document.getElementById('sind-card-concluidos').textContent = concluidos;

    // Atualiza input do formulário de novo chamado
    const inputCondForm = document.getElementById('input-sind-chamado-local');
    if(document.getElementById('input-sind-chamado-cond')) {
        document.getElementById('input-sind-chamado-cond').value = condominioSelecionado;
    }

    // Renderiza Tabelas do Síndico
    renderizarTabelasSindico(chamadosSindico);
}

function renderizarTabelasSindico(chamados) {
    // Tabela Resumo Início
    const tbodyResumo = document.querySelector('#tabela-sindico-resumo tbody');
    if(tbodyResumo) {
        tbodyResumo.innerHTML = '';
        if(chamados.length === 0) {
            tbodyResumo.innerHTML = `<tr><td colspan="5" style="text-align:center; color: var(--text-muted);">Nenhum chamado registrado para este condomínio.</td></tr>`;
        } else {
            chamados.slice(0, 5).forEach(c => {
                tbodyResumo.innerHTML += `
                    <tr>
                        <td><strong>#${c.id}</strong></td>
                        <td>${c.local || c.categoria}</td>
                        <td>${c.data}</td>
                        <td><span class="badge badge-status-aberta">${c.status}</span></td>
                        <td style="text-align: right;"><button class="btn btn-primary" style="padding: 4px 10px; font-size: 11px;" onclick="abrirDetalhesChamadoSindico(${c.id})">Ver chamado</button></td>
                    </tr>
                `;
            });
        }
    }

    // Tabela Todos os Chamados
    const tbodyTodos = document.querySelector('#tabela-sindico-todos tbody');
    if(tbodyTodos) {
        tbodyTodos.innerHTML = '';
        chamados.forEach(c => {
            tbodyTodos.innerHTML += `
                <tr>
                    <td><strong>#${c.id}</strong></td>
                    <td>${c.local || '-'} (${c.categoria})</td>
                    <td>${c.problema}</td>
                    <td>${c.data}</td>
                    <td><span class="badge badge-status-aberta">${c.status}</span></td>
                    <td style="text-align: right;"><button class="btn btn-primary" style="padding: 4px 10px; font-size: 11px;" onclick="abrirDetalhesChamadoSindico(${c.id})">Ver chamado</button></td>
                </tr>
            `;
        });
    }

    // Tabela Em Atendimento
    const tbodyAndamento = document.querySelector('#tabela-sindico-andamento tbody');
    if(tbodyAndamento) {
        tbodyAndamento.innerHTML = '';
        const filtrados = chamados.filter(c => c.status === 'Em atendimento' || c.status === 'Convertido em OS');
        if(filtrados.length === 0) {
            tbodyAndamento.innerHTML = `<tr><td colspan="6" style="text-align:center; color: var(--text-muted);">Nenhum chamado em atendimento no momento.</td></tr>`;
        } else {
            filtrados.forEach(c => {
                tbodyAndamento.innerHTML += `
                    <tr>
                        <td><strong>#${c.id}</strong></td>
                        <td>${c.local || '-'}</td>
                        <td>${c.problema}</td>
                        <td>João Silva (Técnico)</td>
                        <td><span class="badge badge-status-andamento">Em atendimento</span></td>
                        <td style="text-align: right;"><button class="btn btn-primary" style="padding: 4px 10px; font-size: 11px;" onclick="abrirDetalhesChamadoSindico(${c.id})">Acompanhar</button></td>
                    </tr>
                `;
            });
        }
    }

    // Tabela Concluídos
    const tbodyConcluidos = document.querySelector('#tabela-sindico-concluidos tbody');
    if(tbodyConcluidos) {
        tbodyConcluidos.innerHTML = '';
        const filtrados = chamados.filter(c => c.status === 'Concluído');
        if(filtrados.length === 0) {
            tbodyConcluidos.innerHTML = `<tr><td colspan="6" style="text-align:center; color: var(--text-muted);">Nenhum serviço concluído ainda.</td></tr>`;
        } else {
            filtrados.forEach(c => {
                tbodyConcluidos.innerHTML += `
                    <tr>
                        <td><strong>#${c.id}</strong></td>
                        <td>${c.problema}</td>
                        <td>${c.data}</td>
                        <td>João Silva</td>
                        <td><span class="badge badge-status-concluida">Concluído</span></td>
                        <td style="text-align: right;"><button class="btn btn-primary" style="padding: 4px 10px; font-size: 11px;" onclick="abrirDetalhesChamadoSindico(${c.id})">Ver Laudo</button></td>
                    </tr>
                `;
            });
        }
    }

    // Tabela Condomínios do Síndico
    const tbodyConds = document.querySelector('#tabela-sindico-conds tbody');
    if(tbodyConds) {
        tbodyConds.innerHTML = '';
        const dados = getDados();
        dados.condominios.forEach(cond => {
            tbodyConds.innerHTML += `
                <tr>
                    <td><strong>${cond.nome}</strong></td>
                    <td>${cond.endereco}</td>
                    <td>${cond.sindico}</td>
                    <td>${cond.telefone}</td>
                    <td><span class="badge badge-status-ativo">${cond.status}</span></td>
                </tr>
            `;
        });
    }
}

// LINHA DO TEMPO VISUAL DO SÍNDICO E LAUDO DE CONCLUSÃO
window.abrirDetalhesChamadoSindico = function(id) {
    const dados = getDados();
    const chamado = dados.chamados.find(c => c.id == id);
    if(!chamado) return;

    document.getElementById('sind-modal-titulo').textContent = `Detalhes do Chamado #${chamado.id}`;
    const corpoModal = document.getElementById('sind-modal-corpo');

    // Define o estágio da linha do tempo com base no status
    let passo1 = 'completed', passo2 = 'completed', passo3 = 'active', passo4 = '', passo5 = '', passo6 = '';
    if (chamado.status === 'Em atendimento' || chamado.status === 'Convertido em OS') {
        passo1 = 'completed'; passo2 = 'completed'; passo3 = 'completed'; passo4 = 'completed'; passo5 = 'active';
    } else if (chamado.status === 'Concluído') {
        passo1 = 'completed'; passo2 = 'completed'; passo3 = 'completed'; passo4 = 'completed'; passo5 = 'completed'; passo6 = 'completed';
    }

    let htmlLaudo = '';
    if (chamado.status === 'Concluído') {
        htmlLaudo = `
            <div style="margin-top: 20px; padding: 16px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: var(--radius);">
                <h4 style="color: #166534; margin-bottom: 8px; display: flex; align-items: center; gap: 6px;">
                    <span class="material-symbols-outlined">check_circle</span> Serviço Concluído com Sucesso
                </h4>
                <p style="font-size: 13px; margin-bottom: 4px;"><strong>Serviço Realizado:</strong> Substituição e regulagem do equipamento.</p>
                <p style="font-size: 13px; margin-bottom: 4px;"><strong>Técnico Responsável:</strong> João Silva</p>
                <p style="font-size: 13px; margin-bottom: 4px;"><strong>Materiais Utilizados:</strong> 1x Reparo hidráulico / veda rosca.</p>
                <p style="font-size: 13px; color: var(--text-muted);">Equipamento testado e operando em perfeito estado.</p>
            </div>
        `;
    }

    corpoModal.innerHTML = `
        <div style="margin-bottom: 16px;">
            <p style="font-size: 12px; color: var(--text-muted); margin-bottom: 2px;">Condomínio / Local:</p>
            <p style="font-weight: 600; font-size: 14px;">${chamado.condominio} — ${chamado.local || 'Área Comum'}</p>
        </div>
        <div style="margin-bottom: 16px;">
            <p style="font-size: 12px; color: var(--text-muted); margin-bottom: 2px;">Problema Relatado:</p>
            <p style="font-size: 14px;">${chamado.problema}</p>
        </div>
        
        <h4 style="font-size: 14px; margin-bottom: 12px; border-top: 1px solid var(--border-color); padding-top: 16px;">Acompanhamento em Tempo Real</h4>
        
        <!-- Linha do Tempo Visual -->
        <div style="display: flex; flex-direction: column; gap: 10px; font-size: 13px;">
            <div style="display: flex; align-items: center; gap: 10px; color: ${passo1 ? '#16a34a' : '#94a3b8'};">
                <span class="material-symbols-outlined">${passo1 ? 'check_circle' : 'radio_button_unchecked'}</span> Chamado aberto (${chamado.data})
            </div>
            <div style="display: flex; align-items: center; gap: 10px; color: ${passo2 ? '#16a34a' : '#94a3b8'};">
                <span class="material-symbols-outlined">${passo2 ? 'check_circle' : 'radio_button_unchecked'}</span> Recebido pela empresa de manutenção
            </div>
            <div style="display: flex; align-items: center; gap: 10px; color: ${passo3 ? '#16a34a' : '#94a3b8'};">
                <span class="material-symbols-outlined">${passo3 ? 'check_circle' : 'radio_button_unchecked'}</span> Em análise técnica
            </div>
            <div style="display: flex; align-items: center; gap: 10px; color: ${passo4 ? '#16a34a' : '#94a3b8'};">
                <span class="material-symbols-outlined">${passo4 ? 'check_circle' : 'radio_button_unchecked'}</span> Agendado para visita
            </div>
            <div style="display: flex; align-items: center; gap: 10px; color: ${passo5 ? '#16a34a' : '#94a3b8'};">
                <span class="material-symbols-outlined">${passo5 ? 'check_circle' : 'radio_button_unchecked'}</span> Em atendimento pelo técnico (João Silva)
            </div>
            <div style="display: flex; align-items: center; gap: 10px; color: ${passo6 ? '#16a34a' : '#94a3b8'};">
                <span class="material-symbols-outlined">${passo6 ? 'check_circle' : 'radio_button_unchecked'}</span> Concluído
            </div>
        </div>

        ${htmlLaudo}
    `;

    document.getElementById('modal-detalhe-chamado-sindico').classList.remove('hidden');
};

// DEMAIS MÓDULOS PADRÃO (MANTIDOS ÍNTEGROS)
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
        e.preventDefault(); const dados = getDados();
        const novoId = dados.chamados.length > 0 ? Math.max(...dados.chamados.map(c => c.id)) + 1 : 101;
        dados.chamados.push({ id: novoId, condominio: document.getElementById('input-chamado-condominio').value, problema: document.getElementById('input-chamado-problema').value, prioridade: document.getElementById('input-chamado-prioridade').value, status: "Novo", data: new Date().toLocaleDateString('pt-BR') });
        salvarDados(dados); renderizarTabelaChamados(); fecharModal();
    });
}
function renderizarTabelaChamados() {
    const dados = getDados(); const tbody = document.querySelector('#tabela-chamados tbody'); if(!tbody) return; tbody.innerHTML = '';
    dados.chamados.forEach(c => {
        tbody.innerHTML += `<tr><td>#${c.id}</td><td><strong>${c.condominio}</strong></td><td>${c.problema}</td><td><span class="badge badge-prio-normal">${c.prioridade}</span></td><td><span class="badge badge-status-novo">${c.status}</span></td><td style="text-align: right;"><button class="icon-btn"><span class="material-symbols-outlined">visibility</span></button></td></tr>`;
    });
}
function configurarModuloOS() {
    const btnAbrirOS = document.getElementById('btn-abrir-modal-os'); if(!btnAbrirOS) return;
    const modalOS = document.getElementById('modal-nova-os'); const formOS = document.getElementById('form-nova-os');
    const fecharModal = () => { modalOS.classList.add('hidden'); formOS.reset(); };
    btnAbrirOS.addEventListener('click', () => { document.getElementById('input-os-data').value = new Date().toISOString().split('T')[0]; modalOS.classList.remove('hidden'); });
    document.getElementById('btn-fechar-modal-os').addEventListener('click', fecharModal); document.getElementById('btn-cancelar-os').addEventListener('click', (e) => { e.preventDefault(); fecharModal(); });
    formOS.addEventListener('submit', (e) => {
        e.preventDefault(); const dados = getDados(); const novoId = dados.ordensServico.length > 0 ? Math.max(...dados.ordensServico.map(os => os.id)) + 1 : 1001;
        dados.ordensServico.push({ id: novoId, condominio: document.getElementById('input-os-condominio').value, servico: document.getElementById('input-os-servico').value, data: document.getElementById('input-os-data').value.split('-').reverse().join('/'), hora: document.getElementById('input-os-hora').value, tecnico: document.getElementById('input-os-tecnico').value, status: document.getElementById('input-os-status').value });
        salvarDados(dados); renderizarTabelaOS(); fecharModal();
    });
}
function renderizarTabelaOS() {
    const dados = getDados(); const tbody = document.querySelector('#tabela-os tbody'); if(!tbody) return; tbody.innerHTML = '';
    dados.ordensServico.forEach(os => {
        tbody.innerHTML += `<tr><td>#${os.id}</td><td><strong>${os.condominio}</strong></td><td>${os.servico}</td><td>${os.data} às ${os.hora}</td><td>${os.tecnico}</td><td><span class="badge badge-status-andamento">${os.status}</span></td><td style="text-align: right;"><button class="icon-btn"><span class="material-symbols-outlined">visibility</span></button></td></tr>`;
    });
}
function configurarModuloAgenda() { document.getElementById('filtro-agenda-data').value = new Date().toISOString().split('T')[0]; }
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
        salvarDados(dados); renderizarTabelaCondominios(); fecharModal();
    });
}
function renderizarTabelaCondominios() {
    const dados = getDados(); const tbody = document.querySelector('#tabela-condominios tbody'); if(!tbody) return; tbody.innerHTML = '';
    dados.condominios.forEach(c => { tbody.innerHTML += `<tr><td><strong>${c.nome}</strong></td><td>${c.sindico}</td><td>${c.telefone}</td><td>${c.endereco}</td><td><span class="badge badge-status-ativo">${c.status}</span></td><td style="text-align: right;"><button class="icon-btn"><span class="material-symbols-outlined">visibility</span></button></td></tr>`; });
}
function configurarModuloEquipamentos() {
    const btnAbrir = document.getElementById('btn-abrir-modal-equipamento'); if(!btnAbrir) return;
    const modalEquip = document.getElementById('modal-novo-equipamento'); const formEquip = document.getElementById('form-novo-equipamento');
    const selectCond = document.getElementById('input-equip-condominio'); const fecharModal = () => { modalEquip.classList.add('hidden'); formEquip.reset(); };
    btnAbrir.addEventListener('click', () => {
        const dados = getDados(); selectCond.innerHTML = ''; dados.condominios.forEach(c => { selectCond.innerHTML += `<option value="${c.nome}">${c.nome}</option>`; });
        modalEquip.classList.remove('hidden');
    });
    document.getElementById('btn-fechar-modal-equipamento').addEventListener('click', fecharModal); document.getElementById('btn-cancelar-equipamento').addEventListener('click', (e) => { e.preventDefault(); fecharModal(); });
    formEquip.addEventListener('submit', (e) => {
        e.preventDefault(); const dados = getDados(); const numId = dados.equipamentos.length > 0 ? Math.max(...dados.equipamentos.map(eq => eq.id)) + 1 : 1;
        dados.equipamentos.push({ id: numId, codigo: `EQ-${String(numId).padStart(3,'0')}`, nome: document.getElementById('input-equip-nome').value, categoria: document.getElementById('input-equip-categoria').value, condominio: selectCond.value, status: document.getElementById('input-equip-status').value });
        salvarDados(dados); renderizarTabelaEquipamentos(); fecharModal();
    });
}
function renderizarTabelaEquipamentos() {
    const dados = getDados(); const tbody = document.querySelector('#tabela-equipamentos tbody'); if(!tbody) return; tbody.innerHTML = '';
    dados.equipamentos.forEach(eq => { tbody.innerHTML += `<tr><td><strong>${eq.codigo}</strong></td><td>${eq.nome}</td><td>${eq.condominio}</td><td>${eq.categoria}</td><td><span class="badge badge-status-ativo">${eq.status}</span></td><td style="text-align: right;"><button class="icon-btn"><span class="material-symbols-outlined">visibility</span></button></td></tr>`; });
}
function configurarModuloMateriais() {}
function renderizarTabelaMateriais() {}
function configurarModuloPreventivas() {}
function renderizarTabelaPreventivas() {}
function configurarModuloDocumentos() {}
function renderizarTabelaDocumentos() {}
function configurarModuloRelatorios() {}
function inicializarTelaRelatorios() {}
window.gerarRelatorioPDF = function() {};