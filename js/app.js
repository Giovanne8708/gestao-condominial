document.addEventListener('DOMContentLoaded', () => {
    inicializarSistema();
    configurarNavegacao();
    configurarMenuMobile();
    configurarTelaConfiguracoes();
    configurarModuloChamados();
    configurarModuloOS();
    configurarModuloTecnico();
    configurarModuloAgenda(); 
    configurarModuloCondominios();
    configurarModuloEquipamentos(); 
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
            settings: { companyName: "Manutenção Pro", primaryColor: "#2563eb" },
            chamados: [], ordensServico: [], condominios: [], equipamentos: [], preventivas: [], documentos: []
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
            if(targetPage === 'documentos') renderizarTabelaDocumentos(); 
            if(targetPage === 'relatorios') inicializarTelaRelatorios(); 
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
    const preventivas = dados.preventivas || [];
    
    const hojeObj = new Date();
    const ano = hojeObj.getFullYear();
    const mes = String(hojeObj.getMonth() + 1).padStart(2, '0');
    const dia = String(hojeObj.getDate()).padStart(2, '0');
    const hojeIso = `${ano}-${mes}-${dia}`;

    let alterou = false;
    ordens.forEach(os => {
        if(os.status !== 'Concluída' && os.dataFormatoEN) {
            if(os.dataFormatoEN < hojeIso) {
                if(os.status !== 'Atrasada') {
                    os.status = 'Atrasada';
                    alterou = true;
                }
            }
        }
    });

    if(alterou) {
        localStorage.setItem('mp_data', JSON.stringify(dados));
    }
    
    const cOs = document.getElementById('count-os');
    const cAnd = document.getElementById('count-andamento');
    const cAtr = document.getElementById('count-atrasadas');
    const cPrev = document.getElementById('count-preventivas');
    
    const qtdAtrasadas = ordens.filter(os => os.status === 'Atrasada').length;

    if(cOs) cOs.textContent = ordens.filter(os => os.status === 'Aberta' || os.status === 'Agendada').length;
    if(cAnd) cAnd.textContent = ordens.filter(os => os.status === 'Em andamento').length;
    if(cAtr) cAtr.textContent = qtdAtrasadas;
    if(cPrev) cPrev.textContent = preventivas.length;

    const cardAtrasadasEl = document.querySelector('.card-atrasadas-animado');
    if(cardAtrasadasEl) {
        if(qtdAtrasadas > 0) {
            cardAtrasadasEl.classList.add('tem-atraso');
        } else {
            cardAtrasadasEl.classList.remove('tem-atraso');
        }
    }

    const containerAvisos = document.getElementById('dashboard-avisos');
    if(!containerAvisos) return;
    
    containerAvisos.innerHTML = '';
    let temAviso = false;

    if(qtdAtrasadas > 0) {
        temAviso = true;
        containerAvisos.innerHTML += `
            <div class="alert-card clickable-alert" onclick="irParaTela('os')">
                <span class="material-symbols-outlined alert-icon">warning</span>
                <div class="alert-content">
                    <p class="alert-title">${qtdAtrasadas} Ordem(ns) de Serviço Atrasada(s)</p>
                    <p class="alert-desc">Existem manutenções fora do prazo que exigem alocação ou intervenção imediata.</p>
                </div>
            </div>`;
    }

    let prevPendentes = 0;
    preventivas.forEach(p => {
        if(p.proximaData < hojeIso || p.proximaData === hojeIso) prevPendentes++;
    });

    if(prevPendentes > 0) {
        temAviso = true;
        containerAvisos.innerHTML += `
            <div class="alert-card clickable-alert" onclick="irParaTela('preventivas')">
                <span class="material-symbols-outlined alert-icon" style="color: #c2410c; background-color: #ffedd5;">event_busy</span>
                <div class="alert-content">
                    <p class="alert-title" style="color: #9a3412;">${prevPendentes} Preventiva(s) Pendente(s)</p>
                    <p class="alert-desc" style="color: #c2410c;">Há planos de revisão técnica programados para hoje ou já vencidos.</p>
                </div>
            </div>`;
    }

    if(!temAviso) {
        containerAvisos.innerHTML = `
            <div style="padding: 24px; text-align: center; background: white; border: 1px solid var(--border-color); border-radius: 12px; display: flex; align-items: center; justify-content: center; gap: 12px; width: 100%; max-width: 500px; box-shadow: 0 4px 12px rgba(0,0,0,0.02);">
                <span class="material-symbols-outlined" style="color: var(--success-color); font-size: 28px;">check_circle</span>
                <p style="color: var(--text-main); font-size: 14px; font-weight: 500;">Tudo sob controle! Nenhuma pendência urgente no momento.</p>
            </div>`;
    }
}

// ==========================================
// MÓDULO DE RELATÓRIOS E EXPORTAÇÃO EM PDF PROFISSIONAL
// ==========================================
function configurarModuloRelatorios() {
    const selCond = document.getElementById('filtro-rel-condominio');
    const selTec = document.getElementById('filtro-rel-tecnico');
    if(selCond) selCond.addEventListener('change', atualizarRelatorios);
    if(selTec) selTec.addEventListener('change', atualizarRelatorios);
}

function inicializarTelaRelatorios() {
    const dados = getDados();
    const selCond = document.getElementById('filtro-rel-condominio');
    if(selCond) {
        const valorAtual = selCond.value;
        selCond.innerHTML = '<option value="Todos">Todos os Condomínios</option>';
        dados.condominios.forEach(c => {
            const opt = document.createElement('option');
            opt.value = c.nome;
            opt.textContent = c.nome;
            selCond.appendChild(opt);
        });
        selCond.value = valorAtual;
    }
    atualizarRelatorios();
}

function atualizarRelatorios() {
    const dados = getDados();
    const condFiltro = document.getElementById('filtro-rel-condominio').value;
    const tecFiltro = document.getElementById('filtro-rel-tecnico').value;

    let chamados = dados.chamados || [];
    let ordens = dados.ordensServico || [];
    let preventivas = dados.preventivas || [];
    let condominios = dados.condominios || [];
    let equipamentos = dados.equipamentos || [];

    if(condFiltro !== 'Todos') {
        ordens = ordens.filter(os => os.condominio === condFiltro);
        chamados = chamados.filter(c => c.condominio === condFiltro);
        preventivas = preventivas.filter(p => p.condominio === condFiltro);
    }
    if(tecFiltro !== 'Todos') {
        ordens = ordens.filter(os => os.tecnico === tecFiltro);
        preventivas = preventivas.filter(p => p.tecnico === tecFiltro);
    }

    document.getElementById('rel-total-chamados').textContent = chamados.length;
    document.getElementById('rel-total-os').textContent = ordens.length;
    
    const concluidas = ordens.filter(os => os.status === 'Concluída').length;
    document.getElementById('rel-os-concluidas').textContent = concluidas;
    document.getElementById('rel-total-prev').textContent = preventivas.length;

    document.getElementById('rel-total-cond').textContent = condominios.filter(c => c.status === 'Ativo').length;
    document.getElementById('rel-total-equip').textContent = equipamentos.length;

    const taxa = ordens.length > 0 ? Math.round((concluidas / ordens.length) * 100) : 0;
    document.getElementById('rel-taxa-conclusao').textContent = `${taxa}%`;

    const tbodyOs = document.querySelector('#tabela-relatorio-os tbody');
    if(tbodyOs) {
        tbodyOs.innerHTML = '';
        if(ordens.length === 0) {
            tbodyOs.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted);">Nenhuma OS encontrada com estes filtros.</td></tr>`;
        } else {
            [...ordens].reverse().forEach(os => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td><strong>#${os.id}</strong></td>
                    <td>${os.condominio}</td>
                    <td>${os.servico}</td>
                    <td>${os.tecnico}</td>
                    <td style="font-size: 13px;">${os.data || 'N/D'}</td>
                    <td>${os.status}</td>
                `;
                tbodyOs.appendChild(tr);
            });
        }
    }

    const tbodyPrev = document.querySelector('#tabela-relatorio-prev tbody');
    if(tbodyPrev) {
        tbodyPrev.innerHTML = '';
        if(preventivas.length === 0) {
            tbodyPrev.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-muted);">Nenhum plano preventivo encontrado com estes filtros.</td></tr>`;
        } else {
            [...preventivas].reverse().forEach(p => {
                const tr = document.createElement('tr');
                const dataFormatada = p.proximaData ? p.proximaData.split('-').reverse().join('/') : 'N/D';
                tr.innerHTML = `
                    <td><strong>${p.equipamentoNome}</strong></td>
                    <td>${p.condominio}</td>
                    <td>${p.periodicidade}</td>
                    <td style="font-size: 13px;">${dataFormatada}</td>
                    <td>${p.tecnico}</td>
                `;
                tbodyPrev.appendChild(tr);
            });
        }
    }
}

// GERADOR DE PDF / DOCUMENTO CORPORATIVO PROFISSIONAL
window.gerarRelatorioPDF = function() {
    const dados = getDados();
    const empresa = dados.settings.companyName || "Manutenção Pro";
    const condFiltro = document.getElementById('filtro-rel-condominio').value;
    const tecFiltro = document.getElementById('filtro-rel-tecnico').value;
    
    let ordens = dados.ordensServico || [];
    let preventivas = dados.preventivas || [];
    let chamados = dados.chamados || [];

    if(condFiltro !== 'Todos') {
        ordens = ordens.filter(os => os.condominio === condFiltro);
        chamados = chamados.filter(c => c.condominio === condFiltro);
        preventivas = preventivas.filter(p => p.condominio === condFiltro);
    }
    if(tecFiltro !== 'Todos') {
        ordens = ordens.filter(os => os.tecnico === tecFiltro);
        preventivas = preventivas.filter(p => p.tecnico === tecFiltro);
    }

    const concluidas = ordens.filter(os => os.status === 'Concluída').length;
    const taxa = ordens.length > 0 ? Math.round((concluidas / ordens.length) * 100) : 0;
    const dataEmissao = new Date().toLocaleDateString('pt-BR') + ' às ' + new Date().toLocaleTimeString('pt-BR');

    // Monta o HTML limpo e profissional do documento
    let htmlConteudo = `
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
            <meta charset="UTF-8">
            <title>Relatório Operacional - ${empresa}</title>
            <style>
                body { font-family: 'Inter', Arial, sans-serif; color: #0f172a; padding: 40px; margin: 0; background: #ffffff; }
                .header { border-bottom: 2px solid #2563eb; padding-bottom: 16px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: flex-end; }
                .header h1 { font-size: 22px; color: #0f172a; margin-bottom: 4px; }
                .header p { font-size: 13px; color: #64748b; margin: 0; }
                .filters-box { background: #f8fafc; border: 1px solid #e2e8f0; padding: 12px 16px; border-radius: 8px; margin-bottom: 24px; font-size: 13px; }
                .metrics-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 32px; }
                .metric-card { background: #f8fafc; border: 1px solid #e2e8f0; padding: 16px; border-radius: 8px; text-align: center; }
                .metric-card h3 { font-size: 12px; color: #64748b; text-transform: uppercase; margin-bottom: 8px; }
                .metric-card p { font-size: 22px; font-weight: 700; color: #2563eb; margin: 0; }
                h2 { font-size: 16px; color: #0f172a; margin-top: 32px; margin-bottom: 12px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; }
                table { width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 12px; }
                th, td { padding: 10px 12px; text-align: left; border-bottom: 1px solid #e2e8f0; }
                th { background-color: #f8fafc; color: #475569; font-weight: 600; text-transform: uppercase; font-size: 11px; }
                .footer { margin-top: 48px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 16px; }
            </style>
        </head>
        <body>
            <div class="header">
                <div>
                    <h1>Relatório Operacional de Manutenção</h1>
                    <p><strong>${empresa}</strong> • Sistema de Gestão Integrada</p>
                </div>
                <div style="text-align: right;">
                    <p>Emitido em: ${dataEmissao}</p>
                </div>
            </div>

            <div class="filters-box">
                <strong>Filtros Aplicados:</strong> Condomínio: <em>${condFiltro}</em> | Técnico: <em>${tecFiltro}</em>
            </div>

            <div class="metrics-grid">
                <div class="metric-card">
                    <h3>Chamados</h3>
                    <p>${chamados.length}</p>
                </div>
                <div class="metric-card">
                    <h3>Total OS</h3>
                    <p>${ordens.length}</p>
                </div>
                <div class="metric-card">
                    <h3>Concluídas</h3>
                    <p style="color: #10b981;">${concluidas}</p>
                </div>
                <div class="metric-card">
                    <h3>Taxa Sucesso</h3>
                    <p>${taxa}%</p>
                </div>
            </div>

            <h2>Ordens de Serviço do Período</h2>
            <table>
                <thead>
                    <tr>
                        <th>OS #</th>
                        <th>Condomínio</th>
                        <th>Serviço</th>
                        <th>Técnico</th>
                        <th>Data</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
    `;

    if(ordens.length === 0) {
        htmlConteudo += `<tr><td colspan="6" style="text-align: center; color: #64748b;">Nenhuma ordem de serviço encontrada.</td></tr>`;
    } else {
        [...ordens].reverse().forEach(os => {
            htmlConteudo += `
                <tr>
                    <td><strong>#${os.id}</strong></td>
                    <td>${os.condominio}</td>
                    <td>${os.servico}</td>
                    <td>${os.tecnico}</td>
                    <td>${os.data || 'N/D'}</td>
                    <td>${os.status}</td>
                </tr>
            `;
        });
    }

    htmlConteudo += `
                </tbody>
            </table>

            <h2>Planos Preventivos Vinculados</h2>
            <table>
                <thead>
                    <tr>
                        <th>Equipamento</th>
                        <th>Condomínio</th>
                        <th>Periodicidade</th>
                        <th>Próxima Manutenção</th>
                        <th>Técnico</th>
                    </tr>
                </thead>
                <tbody>
    `;

    if(preventivas.length === 0) {
        htmlConteudo += `<tr><td colspan="5" style="text-align: center; color: #64748b;">Nenhum plano preventivo encontrado.</td></tr>`;
    } else {
        [...preventivas].reverse().forEach(p => {
            const dataF = p.proximaData ? p.proximaData.split('-').reverse().join('/') : 'N/D';
            htmlConteudo += `
                <tr>
                    <td><strong>${p.equipamentoNome}</strong></td>
                    <td>${p.condominio}</td>
                    <td>${p.periodicidade}</td>
                    <td>${dataF}</td>
                    <td>${p.tecnico}</td>
                </tr>
            `;
        });
    }

    htmlConteudo += `
                </tbody>
            </table>

            <div class="footer">
                ${empresa} • Relatório gerado automaticamente pelo Manutenção Pro
            </div>
        </body>
        </html>
    `;

    // Abre a aba limpa e dispara o comando de salvamento/impressão em PDF
    const janelaPrint = window.open('', '_blank');
    janelaPrint.document.write(htmlConteudo);
    janelaPrint.document.close();
    janelaPrint.focus();
    setTimeout(() => {
        janelaPrint.print();
    }, 500);
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
function renderizarTabelaChamados() {
    const dados = getDados(); const tbody = document.querySelector('#tabela-chamados tbody'); if(!tbody) return;
    tbody.innerHTML = ''; 
    if (dados.chamados.length === 0) { tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color: var(--text-muted);">Nenhum chamado registrado.</td></tr>`; return;}
    [...dados.chamados].reverse().forEach(chamado => {
        const tr = document.createElement('tr');
        let badgeStatus = chamado.status === 'Convertido em OS' ? 'badge-status-aprovado' : (chamado.status === 'Em análise' ? 'badge-status-analise' : 'badge-status-novo');
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
        const inputData = document.getElementById('filtro-agenda-data');
        document.getElementById('input-os-data').value = (inputData ? inputData.value : '') || new Date().toISOString().split('T')[0];
        modalOS.classList.remove('hidden');
    };
    btnAbrirOS.addEventListener('click', abrirModalOS);
    const btnAgendaOS = document.getElementById('btn-abrir-modal-os-agenda');
    if(btnAgendaOS) btnAgendaOS.addEventListener('click', abrirModalOS);

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
        
        const hojeObj = new Date();
        const ano = hojeObj.getFullYear();
        const mes = String(hojeObj.getMonth() + 1).padStart(2, '0');
        const dia = String(hojeObj.getDate()).padStart(2, '0');
        const hojeIso = `${ano}-${mes}-${dia}`;

        let statusInicial = document.getElementById('input-os-status').value;
        if(dataBruta < hojeIso && statusInicial !== 'Concluída') {
            statusInicial = 'Atrasada';
        }

        dados.ordensServico.push({
            id: novoId, chamadoId: chamadoId || null, condominio: document.getElementById('input-os-condominio').value,
            servico: document.getElementById('input-os-servico').value, dataFormatoEN: dataBruta, data: dataBruta.split('-').reverse().join('/'),
            hora: document.getElementById('input-os-hora').value, tecnico: document.getElementById('input-os-tecnico').value, status: statusInicial, diagnostico: ""
        });
        if(chamadoId) { const index = dados.chamados.findIndex(c => c.id == chamadoId); if(index !== -1) dados.chamados[index].status = 'Convertido em OS'; }
        salvarDados(dados); renderizarTabelaOS(); renderizarTabelaChamados(); renderizarAgendaRotas(); fecharModal();
    });
}
function renderizarTabelaOS() {
    const dados = getDados(); const tbody = document.querySelector('#tabela-os tbody'); if(!tbody) return; tbody.innerHTML = ''; 
    if (dados.ordensServico.length === 0) { tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color: var(--text-muted);">Nenhuma OS.</td></tr>`; return; }
    [...dados.ordensServico].reverse().forEach(os => {
        const tr = document.createElement('tr');
        let badgeStatus = 'badge-status-aberta';
        if (os.status === 'Agendada') badgeStatus = 'badge-status-agendada'; 
        if (os.status === 'Em andamento') badgeStatus = 'badge-status-andamento'; 
        if (os.status === 'Concluída') badgeStatus = 'badge-status-concluida'; 
        if (os.status === 'Atrasada') badgeStatus = 'badge-status-atrasada'; 
        const exibeDataHora = os.data ? `${os.data} às ${os.hora}` : 'Não definida';
        tr.innerHTML = `<td>#${os.id}</td><td><strong>${os.condominio}</strong></td><td>${os.servico}</td><td style="font-size: 13px;">${exibeDataHora}</td>
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

    if(ordens.length === 0) { container.innerHTML = `<div style="text-align: center; padding: 40px 20px;"><p style="color: var(--text-muted);">Nenhuma rota agendada.</p></div>`; return; }
    ordens.sort((a, b) => { if (!a.hora) return 1; if (!b.hora) return -1; return a.hora.localeCompare(b.hora); });
    let passo = 1;
    ordens.forEach(os => {
        const item = document.createElement('div'); item.className = 'timeline-item';
        let colorStatus = 'var(--text-muted)';
        if (os.status === 'Em andamento') colorStatus = '#a16207'; if (os.status === 'Concluída') colorStatus = '#15803d'; 
        item.innerHTML = `<div class="timeline-dot">${passo}</div><div class="timeline-content"><div class="timeline-header"><span class="timeline-time">${os.hora}</span><span style="color: ${colorStatus}; font-weight: 600;">${os.status}</span></div><div class="timeline-title">${os.condominio}</div><div class="timeline-desc">${os.servico}</div></div>`;
        container.appendChild(item); passo++;
    });
}

function configurarModuloTecnico() {
    const sel = document.getElementById('simulador-tecnico'); if(sel) sel.addEventListener('change', renderizarAgendaTecnico);
    const fecharBtn = document.getElementById('btn-fechar-modal-exec'); if(fecharBtn) fecharBtn.addEventListener('click', () => document.getElementById('modal-executar-os').classList.add('hidden'));
    const btnIn = document.getElementById('btn-iniciar-servico'); if(btnIn) btnIn.addEventListener('click', () => { atualizarStatusOSTecnico('Em andamento'); });
    const btnFi = document.getElementById('btn-finalizar-servico'); if(btnFi) btnFi.addEventListener('click', () => {
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
        salvarDados(dados); renderizarAgendaTecnico(); renderizarAgendaRotas();
        if(novoStatus === 'Em andamento') document.getElementById('btn-iniciar-servico').style.display = 'none';
    }
}
window.abrirModalExecutarOS = function(osId) {
    const os = getDados().ordensServico.find(o => o.id == osId); if(!os) return;
    document.getElementById('exec-os-id').value = os.id; document.getElementById('exec-os-title').textContent = `OS #${os.id}`; document.getElementById('exec-os-servico').textContent = os.servico;
    document.getElementById('exec-os-diagnostico').value = os.diagnostico || "";
    const btnIn = document.getElementById('btn-iniciar-servico'); const btnFi = document.getElementById('btn-finalizar-servico'); const inputDiag = document.getElementById('exec-os-diagnostico');
    if(os.status === 'Concluída') { btnIn.style.display = 'none'; btnFi.style.display = 'none'; inputDiag.disabled = true; } 
    else if (os.status === 'Em andamento') { btnIn.style.display = 'none'; btnFi.style.display = 'block'; inputDiag.disabled = false; } 
    else { btnIn.style.display = 'block'; btnFi.style.display = 'block'; inputDiag.disabled = false; }
    document.getElementById('modal-executar-os').classList.remove('hidden');
};
function renderizarAgendaTecnico() {
    const container = document.getElementById('lista-os-tecnico'); if(!container) return; container.innerHTML = '';
    const tecnico = document.getElementById('simulador-tecnico').value; let ordens = getDados().ordensServico || [];
    if(tecnico !== 'Todos') ordens = ordens.filter(os => os.tecnico === tecnico);
    if (ordens.length === 0) { container.innerHTML = `<p style="color: var(--text-muted);">Nenhuma OS designada.</p>`; return; }
    [...ordens].reverse().forEach(os => {
        const card = document.createElement('div'); card.className = 'task-card';
        let bg = os.status === 'Concluída' ? 'badge-status-concluida' : 'badge-status-aberta';
        card.innerHTML = `<div class="task-header"><span class="task-id">OS #${os.id}</span><span class="badge ${bg}">${os.status}</span></div><div class="task-info"><p class="title">${os.condominio}</p><p class="desc">${os.servico}</p></div><div class="task-footer"><button class="btn btn-primary btn-executar" style="width: 100%;">Executar</button></div>`;
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
            id: novoId, nome: document.getElementById('input-cond-nome').value, cnpj: document.getElementById('input-cond-cnpj').value,
            endereco: document.getElementById('input-cond-endereco').value, sindico: document.getElementById('input-cond-sindico').value,
            telefone: document.getElementById('input-cond-telefone').value, email: document.getElementById('input-cond-email').value, status: document.getElementById('input-cond-status').value
        });
        salvarDados(dados); renderizarTabelaCondominios(); fecharModal();
    });
}
function renderizarTabelaCondominios() {
    const dados = getDados(); const tbody = document.querySelector('#tabela-condominios tbody'); if(!tbody) return; tbody.innerHTML = ''; 
    if (dados.condominios.length === 0) { tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color: var(--text-muted);">Nenhum condomínio.</td></tr>`; return; }
    [...dados.condominios].reverse().forEach(cond => {
        const tr = document.createElement('tr'); let badgeStatus = cond.status === 'Ativo' ? 'badge-status-ativo' : 'badge-status-inativo';
        tr.innerHTML = `<td><strong>${cond.nome}</strong></td><td>${cond.sindico}</td><td style="font-size: 13px; color: var(--text-muted);">${cond.telefone}</td><td style="font-size: 13px;">${cond.endereco}</td><td><span class="badge ${badgeStatus}">${cond.status}</span></td><td style="text-align: right;"><button class="icon-btn"><span class="material-symbols-outlined">visibility</span></button></td>`;
        tbody.appendChild(tr);
    });
}

function configurarModuloEquipamentos() {
    const btnAbrir = document.getElementById('btn-abrir-modal-equipamento'); if(!btnAbrir) return;
    const modalEquip = document.getElementById('modal-novo-equipamento'); const formEquip = document.getElementById('form-novo-equipamento');
    const selectCond = document.getElementById('input-equip-condominio'); const fecharModal = () => { modalEquip.classList.add('hidden'); formEquip.reset(); };

    btnAbrir.addEventListener('click', () => {
        const dados = getDados(); selectCond.innerHTML = '<option value="">Selecione o Condomínio...</option>';
        if(dados.condominios.length === 0) { selectCond.innerHTML = '<option value="">(Cadastre um Condomínio primeiro)</option>'; } 
        else { dados.condominios.filter(c => c.status === 'Ativo').forEach(c => { const opt = document.createElement('option'); opt.value = c.nome; opt.textContent = c.nome; selectCond.appendChild(opt); }); }
        modalEquip.classList.remove('hidden');
    });

    document.getElementById('btn-fechar-modal-equipamento').addEventListener('click', fecharModal); document.getElementById('btn-cancelar-equipamento').addEventListener('click', (e) => { e.preventDefault(); fecharModal(); });
    formEquip.addEventListener('submit', (e) => {
        e.preventDefault(); const condNome = selectCond.value; if(!condNome) { alert('É obrigatório vincular o equipamento a um condomínio.'); return; }
        const dados = getDados(); const numId = dados.equipamentos.length > 0 ? Math.max(...dados.equipamentos.map(eq => eq.id)) + 1 : 1;
        dados.equipamentos.push({
            id: numId, codigo: `EQ-${String(numId).padStart(3, '0')}`, nome: document.getElementById('input-equip-nome').value, categoria: document.getElementById('input-equip-categoria').value,
            condominio: condNome, local: document.getElementById('input-equip-local').value, fabricante: document.getElementById('input-equip-fabricante').value,
            modelo: document.getElementById('input-equip-modelo').value, serie: document.getElementById('input-equip-serie').value, especificacoes: document.getElementById('input-equip-especificacoes').value,
            dataInstalacao: document.getElementById('input-equip-data').value, status: document.getElementById('input-equip-status').value, obs: document.getElementById('input-equip-obs').value
        });
        salvarDados(dados); renderizarTabelaEquipamentos(); fecharModal();
    });
}
function renderizarTabelaEquipamentos() {
    const dados = getDados(); const tbody = document.querySelector('#tabela-equipamentos tbody'); if(!tbody) return; tbody.innerHTML = ''; 
    if (dados.equipamentos.length === 0) { tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color: var(--text-muted);">Nenhum equipamento.</td></tr>`; return; }
    [...dados.equipamentos].reverse().forEach(eq => {
        const tr = document.createElement('tr');
        let badgeStatus = 'badge-equip-inativo'; if (eq.status === 'Funcionando') badgeStatus = 'badge-equip-func'; if (eq.status === 'Em manutenção') badgeStatus = 'badge-equip-manut'; if (eq.status === 'Com problema') badgeStatus = 'badge-equip-prob';
        const specHtml = eq.especificacoes ? `<br><small style="color: var(--text-muted); font-size: 12px;">Spec: ${eq.especificacoes}</small>` : '';
        tr.innerHTML = `<td><strong style="color:var(--primary-color)">${eq.codigo}</strong></td><td><strong>${eq.nome}</strong>${specHtml}</td><td>${eq.condominio}</td><td><span style="background:#f1f5f9; padding:4px 8px; border-radius:4px; font-size:12px;">${eq.categoria}</span></td><td style="font-size: 13px; color: var(--text-muted);">${eq.local || '-'}</td><td><span class="badge ${badgeStatus}">${eq.status}</span></td><td style="text-align: right;"><button class="icon-btn"><span class="material-symbols-outlined">visibility</span></button></td>`;
        tbody.appendChild(tr);
    });
}

function configurarModuloPreventivas() {
    const btnAbrir = document.getElementById('btn-abrir-modal-preventiva');
    if(!btnAbrir) return;

    const modalPrev = document.getElementById('modal-nova-preventiva');
    const formPrev = document.getElementById('form-nova-preventiva');
    const selectEquip = document.getElementById('input-prev-equipamento');
    const inputCond = document.getElementById('input-prev-condominio');
    const fecharModal = () => { modalPrev.classList.add('hidden'); formPrev.reset(); };

    btnAbrir.addEventListener('click', () => {
        const dados = getDados();
        selectEquip.innerHTML = '<option value="">Selecione o Equipamento...</option>';
        if(dados.equipamentos.length === 0) {
            selectEquip.innerHTML = '<option value="">(Cadastre um Equipamento primeiro)</option>';
        } else {
            dados.equipamentos.forEach(eq => {
                const opt = document.createElement('option');
                opt.value = eq.id; 
                opt.textContent = `${eq.codigo} - ${eq.nome}`;
                opt.dataset.condominio = eq.condominio; 
                selectEquip.appendChild(opt);
            });
        }
        modalPrev.classList.remove('hidden');
    });

    selectEquip.addEventListener('change', (e) => {
        const selectedOption = e.target.options[e.target.selectedIndex];
        if(selectedOption && selectedOption.dataset.condominio) {
            inputCond.value = selectedOption.dataset.condominio;
        } else {
            inputCond.value = '';
        }
    });

    document.getElementById('btn-fechar-modal-preventiva').addEventListener('click', fecharModal);
    document.getElementById('btn-cancelar-preventiva').addEventListener('click', (e) => { e.preventDefault(); fecharModal(); });

    formPrev.addEventListener('submit', (e) => {
        e.preventDefault(); 
        const eqId = selectEquip.value;
        if(!eqId) { alert('Selecione um equipamento.'); return; }

        const dados = getDados();
        const numId = dados.preventivas.length > 0 ? Math.max(...dados.preventivas.map(p => p.id)) + 1 : 1;
        const equipamentoObj = dados.equipamentos.find(eq => eq.id == eqId);
        const dataProxima = document.getElementById('input-prev-proxima').value;

        dados.preventivas.push({
            id: numId,
            equipamentoId: eqId,
            equipamentoNome: equipamentoObj ? equipamentoObj.nome : 'Desconhecido',
            condominio: inputCond.value,
            periodicidade: document.getElementById('input-prev-periodicidade').value,
            tecnico: document.getElementById('input-prev-tecnico').value,
            ultimaData: document.getElementById('input-prev-ultima').value,
            proximaData: dataProxima,
            checklist: document.getElementById('input-prev-checklist').value
        });

        salvarDados(dados); renderizarTabelaPreventivas(); fecharModal();
    });
}

function renderizarTabelaPreventivas() {
    const dados = getDados(); const tbody = document.querySelector('#tabela-preventivas tbody'); if(!tbody) return;
    tbody.innerHTML = ''; 
    if (dados.preventivas.length === 0) { tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color: var(--text-muted);">Nenhum plano preventivo cadastrado.</td></tr>`; return; }

    const hojeIso = new Date().toISOString().split('T')[0];

    [...dados.preventivas].reverse().forEach(prev => {
        const tr = document.createElement('tr');
        let status = 'No Prazo'; let badgeStatus = 'badge-prev-prazo';
        
        if (prev.proximaData < hojeIso) { status = 'Atrasada'; badgeStatus = 'badge-prev-atraso'; } 
        else if (prev.proximaData === hojeIso) { status = 'Vence Hoje'; badgeStatus = 'badge-prev-hoje'; }

        const dataFormatada = prev.proximaData.split('-').reverse().join('/');

        tr.innerHTML = `<td><strong>${prev.equipamentoNome}</strong></td><td>${prev.condominio}</td><td><span style="background:#f1f5f9; padding:4px 8px; border-radius:4px; font-size:12px;">${prev.periodicidade}</span></td><td><strong>${dataFormatada}</strong></td><td><span class="badge ${badgeStatus}">${status}</span></td><td style="text-align: right;"><button class="icon-btn"><span class="material-symbols-outlined">visibility</span></button></td>`;
        tbody.appendChild(tr);
    });
}

function configurarModuloDocumentos() {
    const btnAbrir = document.getElementById('btn-abrir-modal-documento');
    if(!btnAbrir) return;

    const modalDoc = document.getElementById('modal-novo-documento');
    const formDoc = document.getElementById('form-novo-documento');
    const selectCond = document.getElementById('input-doc-condominio');
    const fecharModal = () => { modalDoc.classList.add('hidden'); formDoc.reset(); };

    btnAbrir.addEventListener('click', () => {
        const dados = getDados();
        selectCond.innerHTML = '<option value="">Selecione o Condomínio...</option>';
        if(dados.condominios.length === 0) {
            selectCond.innerHTML = '<option value="">(Cadastre um Condomínio primeiro)</option>';
        } else {
            dados.condominios.filter(c => c.status === 'Ativo').forEach(c => {
                const opt = document.createElement('option');
                opt.value = c.nome; 
                opt.textContent = c.nome;
                selectCond.appendChild(opt);
            });
        }
        modalDoc.classList.remove('hidden');
    });

    document.getElementById('btn-fechar-modal-documento').addEventListener('click', fecharModal);
    document.getElementById('btn-cancelar-documento').addEventListener('click', (e) => { e.preventDefault(); fecharModal(); });

    formDoc.addEventListener('submit', (e) => {
        e.preventDefault(); 
        const condNome = selectCond.value;
        if(!condNome) { alert('Selecione um condomínio.'); return; }

        const dados = getDados();
        const numId = dados.documentos.length > 0 ? Math.max(...dados.documentos.map(d => d.id)) + 1 : 1;
        const hojeIso = new Date().toISOString().split('T')[0];

        dados.documentos.push({
            id: numId,
            titulo: document.getElementById('input-doc-titulo').value,
            categoria: document.getElementById('input-doc-categoria').value,
            condominio: condNome,
            link: document.getElementById('input-doc-link').value,
            dataCadastro: hojeIso.split('-').reverse().join('/')
        });

        salvarDados(dados); renderizarTabelaDocumentos(); fecharModal();
    });
}

function renderizarTabelaDocumentos() {
    const dados = getDados();
    const tbody = document.querySelector('#tabela-documentos tbody');
    if(!tbody) return;
    
    tbody.innerHTML = ''; 
    if (dados.documentos.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color: var(--text-muted);">Nenhum documento anexado.</td></tr>`;
        return;
    }

    [...dados.documentos].reverse().forEach(doc => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${doc.titulo}</strong></td>
            <td><span style="background:#f1f5f9; padding:4px 8px; border-radius:4px; font-size:12px;">${doc.categoria}</span></td>
            <td>${doc.condominio}</td>
            <td style="font-size: 13px; color: var(--text-muted);">${doc.dataCadastro}</td>
            <td style="text-align: right;">
                <a href="${doc.link}" target="_blank" class="btn btn-primary" style="padding: 6px 12px; font-size: 12px; text-decoration: none; display: inline-flex; align-items: center; gap: 4px;">
                    <span class="material-symbols-outlined" style="font-size:16px;">open_in_new</span> Abrir
                </a>
            </td>
        `;
        tbody.appendChild(tr);
    });
}