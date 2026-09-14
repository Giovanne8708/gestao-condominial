const mockData = {
    settings: {
        companyName: "Manutenção Pro",
        primaryColor: "#2563eb",
    },
    chamados: [
        { id: 1, condominio: "Residencial Solar", problema: "Elevador bloco B parou", status: "Novo", prioridade: "Alta" },
        { id: 2, condominio: "Edifício Central", problema: "Vazamento na garagem", status: "Em análise", prioridade: "Normal" }
    ],
    ordensServico: [
        { id: 101, chamadoId: null, condominio: "Jardim das Acácias", servico: "Manutenção preventiva bomba d'água", status: "Aberta" },
        { id: 102, chamadoId: 2, condominio: "Edifício Central", servico: "Reparo vazamento cano principal", status: "Em andamento" }
    ]
};