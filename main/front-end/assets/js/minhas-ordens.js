document.addEventListener('DOMContentLoaded', function() {
    // Elementos do DOM
    const ordersList = document.getElementById('orders-list');
    const filterBtns = document.querySelectorAll('.filter-btn');
    const searchInput = document.getElementById('search-orders');
    const dateFromInput = document.getElementById('date-from');
    const dateToInput = document.getElementById('date-to');
    const applyDatesBtn = document.getElementById('apply-dates');
    const modal = document.getElementById('order-details-modal');
    const modalCloseBtns = document.querySelectorAll('.modal-close, .modal-close-btn');
    
    // Dados de exemplo (substituir por dados reais da API)
    const sampleOrders = [
        {
            id: 'ORD-2025-001',
            date: '2025-10-15',
            room: '101',
            equipment: 'kit-professor',
            status: 'pending',
            title: 'Sala 101 - Kit Professor',
            description: 'Monitor não liga e teclado sem resposta. Problema ocorre desde o início da aula.',
            type: 'Hardware',
            technician: 'Não atribuído',
            evaluation: null
        },
        {
            id: 'ORD-2025-002',
            date: '2025-10-16',
            room: '203',
            equipment: 'computador-aluno',
            status: 'in-progress',
            title: 'Lab 203 - Posição 12',
            description: 'Computador não inicia o sistema. Apresenta tela azul ao ligar.',
            type: 'Sistema Operacional',
            technician: 'João Silva',
            evaluation: null
        },
        {
            id: 'ORD-2025-003',
            date: '2025-10-17',
            room: '305',
            equipment: 'cabo-hdmi',
            status: 'completed',
            title: 'Sala 305 - Cabo HDMI',
            description: 'Cabo HDMI com defeito - imagem falhando durante a aula.',
            type: 'Periférico',
            technician: 'Maria Oliveira',
            evaluation: 4
        },
        {
            id: 'ORD-2025-004',
            date: '2025-10-18',
            room: '208',
            equipment: 'notebook',
            status: 'not-completed',
            title: 'Lab 208 - Notebook Posição 5',
            description: 'Notebook não conecta à rede Wi-Fi. Necessário verificar placa de rede.',
            type: 'Rede',
            technician: 'Carlos Mendes',
            evaluation: null
        }
    ];

    // Filtros ativos
    let activeFilters = {
        status: 'all',
        search: '',
        dateFrom: null,
        dateTo: null
    };

    // Inicialização
    function init() {
        renderOrders(sampleOrders);
        setupEventListeners();
    }

    // Configurar event listeners
    function setupEventListeners() {
        // Filtros por status
        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                filterBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                activeFilters.status = btn.dataset.status;
                applyFilters();
            });
        });

        // Busca
        searchInput.addEventListener('input', (e) => {
            activeFilters.search = e.target.value.toLowerCase();
            applyFilters();
        });

        // Filtro por data
        applyDatesBtn.addEventListener('click', () => {
            activeFilters.dateFrom = dateFromInput.value;
            activeFilters.dateTo = dateToInput.value;
            applyFilters();
        });

        // Modal
        document.querySelectorAll('.btn-view').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const orderCard = e.target.closest('.order-card');
                const orderId = orderCard.dataset.id;
                showOrderDetails(orderId);
            });
        });

        modalCloseBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                modal.classList.remove('active');
            });
        });

        // Fechar modal ao clicar fora
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    }

    // Aplicar todos os filtros
    function applyFilters() {
        let filteredOrders = [...sampleOrders];

        // Filtro por status
        if (activeFilters.status !== 'all') {
            filteredOrders = filteredOrders.filter(order => order.status === activeFilters.status);
        }

        // Filtro por busca
        if (activeFilters.search) {
            filteredOrders = filteredOrders.filter(order => 
                order.title.toLowerCase().includes(activeFilters.search) || 
                order.description.toLowerCase().includes(activeFilters.search) ||
                order.room.toLowerCase().includes(activeFilters.search) ||
                order.type.toLowerCase().includes(activeFilters.search)
            );
        }

        // Filtro por data
        if (activeFilters.dateFrom) {
            filteredOrders = filteredOrders.filter(order => 
                new Date(order.date) >= new Date(activeFilters.dateFrom)
            );
        }

        if (activeFilters.dateTo) {
            filteredOrders = filteredOrders.filter(order => 
                new Date(order.date) <= new Date(activeFilters.dateTo + 'T23:59:59')
            );
        }

        renderOrders(filteredOrders);
    }

    // Renderizar lista de ordens
    function renderOrders(orders) {
        ordersList.innerHTML = '';

        if (orders.length === 0) {
            ordersList.innerHTML = `
                <div class="no-orders">
                    <i class="fas fa-clipboard-list"></i>
                    <p>Nenhuma ordem encontrada com os filtros atuais</p>
                </div>
            `;
            return;
        }

        orders.forEach(order => {
            const orderCard = document.createElement('div');
            orderCard.className = `order-card ${order.status}`;
            orderCard.dataset.id = order.id;
            orderCard.dataset.date = order.date;
            orderCard.dataset.room = order.room;
            orderCard.dataset.equipment = order.equipment;

            let statusText = '';
            let statusIcon = '';
            
            switch(order.status) {
                case 'pending':
                    statusText = 'Pendente';
                    statusIcon = 'fa-clock';
                    break;
                case 'in-progress':
                    statusText = 'Em Andamento';
                    statusIcon = 'fa-spinner';
                    break;
                case 'completed':
                    statusText = 'Concluída';
                    statusIcon = 'fa-check-circle';
                    break;
                case 'not-completed':
                    statusText = 'Não Concluída';
                    statusIcon = 'fa-times-circle';
                    break;
            }

            const formattedDate = new Date(order.date).toLocaleDateString('pt-BR');

            let evaluationBadge = '';
            if (order.evaluation !== null) {
                evaluationBadge = `<span><i class="fas fa-star"></i> Avaliação: ${order.evaluation}/5</span>`;
            }

            orderCard.innerHTML = `
                <div class="order-header">
                    <span class="order-id">#${order.id}</span>
                    <span class="order-date">${formattedDate}</span>
                    <span class="order-status ${order.status}"><i class="fas ${statusIcon}"></i> ${statusText}</span>
                </div>
                <div class="order-content">
                    <h3>${order.title}</h3>
                    <p class="order-description">${order.description}</p>
                    <div class="order-meta">
                        <span><i class="fas fa-tag"></i> ${order.type}</span>
                        <span><i class="fas fa-user-cog"></i> Técnico: ${order.technician}</span>
                        ${evaluationBadge}
                    </div>
                </div>
                <div class="order-actions">
                    <button class="btn btn-small btn-view">
                        <i class="fas fa-eye"></i> Detalhes
                    </button>
                    ${order.status === 'in-progress' ? 
                        '<button class="btn btn-small btn-msg"><i class="fas fa-comment"></i> Mensagem</button>' : ''}
                    ${order.status === 'completed' && !order.evaluation ? 
                        '<button class="btn btn-small btn-feedback"><i class="fas fa-star"></i> Avaliar</button>' : ''}
                    ${order.status === 'not-completed' ? 
                        '<button class="btn btn-small btn-reopen"><i class="fas fa-redo"></i> Reabrir</button>' : ''}
                </div>
            `;

            ordersList.appendChild(orderCard);
        });

        // Reatribuir event listeners aos botões
        document.querySelectorAll('.btn-view').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const orderCard = e.target.closest('.order-card');
                const orderId = orderCard.dataset.id;
                showOrderDetails(orderId);
            });
        });
    }

    // Mostrar detalhes da ordem no modal
    function showOrderDetails(orderId) {
        const order = sampleOrders.find(o => o.id === orderId);
        
        if (!order) return;

        const formattedDate = new Date(order.date).toLocaleDateString('pt-BR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        let statusClass = '';
        let statusText = '';
        
        switch(order.status) {
            case 'pending':
                statusClass = 'pending';
                statusText = 'Pendente';
                break;
            case 'in-progress':
                statusClass = 'in-progress';
                statusText = 'Em Andamento';
                break;
            case 'completed':
                statusClass = 'completed';
                statusText = 'Concluída';
                break;
            case 'not-completed':
                statusClass = 'not-completed';
                statusText = 'Não Concluída';
                break;
        }

        document.getElementById('modal-order-details').innerHTML = `
            <div class="detail-row">
                <span class="detail-label">Número da Ordem:</span>
                <span class="detail-value">${order.id}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Data:</span>
                <span class="detail-value">${formattedDate}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Status:</span>
                <span class="detail-value status-badge ${statusClass}">${statusText}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Local:</span>
                <span class="detail-value">${order.title}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Tipo:</span>
                <span class="detail-value">${order.type}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Técnico Responsável:</span>
                <span class="detail-value">${order.technician}</span>
            </div>
            <div class="detail-row full-width">
                <span class="detail-label">Descrição:</span>
                <p class="detail-value">${order.description}</p>
            </div>
            ${order.evaluation ? `
            <div class="detail-row">
                <span class="detail-label">Avaliação:</span>
                <span class="detail-value">
                    ${Array.from({length: 5}, (_, i) => 
                        `<i class="fas fa-star ${i < order.evaluation ? 'filled' : ''}"></i>`
                    ).join('')}
                </span>
            </div>
            ` : ''}
        `;

        modal.classList.add('active');
    }

    // Inicializar a aplicação
    init();
});