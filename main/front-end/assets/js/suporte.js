document.addEventListener('DOMContentLoaded', function() {
    // -------------------
    // Elementos do DOM
    // -------------------
    const menuToggle = document.querySelector('.menu-toggle');
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.createElement('div');
    overlay.className = 'overlay';
    document.body.appendChild(overlay);

    // -------------------
    // Controle do menu mobile
    // -------------------
    menuToggle.addEventListener('click', () => {
        sidebar.classList.toggle('active');
        overlay.classList.toggle('active');
    });

    overlay.addEventListener('click', () => {
        sidebar.classList.remove('active');
        overlay.classList.remove('active');
    });

    // -------------------
    // Dropdown do perfil
    // -------------------
    let dropdownVisible = false;
    const profileToggle = document.getElementById('profile-toggle');
    const profileDropdown = document.getElementById('profile-dropdown');

    if (profileToggle && profileDropdown) {
        profileToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdownVisible = !dropdownVisible;
            profileDropdown.style.display = dropdownVisible ? 'block' : 'none';
        });
    }

    document.addEventListener('click', () => {
        if (dropdownVisible) {
            profileDropdown.style.display = 'none';
            dropdownVisible = false;
        }
    });

    // -------------------
    // Carregar dados do Dashboard
    // -------------------
    async function loadDashboardData() {
        try {
            // Trocar pela sua rota real da API
            const response = await fetch("/api/suporte/dashboard");
            const data = await response.json();

            // Se não tiver API, usa valores mock
            const dashboardData = data || {
                pending: 15,
                inProgress: 8,
                assigned: 5,
                completed: 24,
                recentOrders: [
                    { id: 101, titulo: "Problema no projetor", status: "pending", data: "2025-09-10" },
                    { id: 102, titulo: "Internet lenta", status: "in-progress", data: "2025-09-11" },
                    { id: 103, titulo: "Troca de teclado", status: "completed", data: "2025-09-12" }
                ]
            };

            // Atualizar os cards
            document.querySelector('.summary-card.pending .card-value').textContent = dashboardData.pending;
            document.querySelector('.summary-card.in-progress .card-value').textContent = dashboardData.inProgress;
            document.querySelector('.summary-card.assigned .card-value').textContent = dashboardData.assigned;
            document.querySelector('.summary-card.completed .card-value').textContent = dashboardData.completed;

            // Renderizar ordens recentes
            renderRecentOrders(dashboardData.recentOrders);

        } catch (err) {
            console.error("Erro ao carregar dados do dashboard:", err);
        }
    }

    // -------------------
    // Renderizar Ordens Recentes
    // -------------------
    function renderRecentOrders(orders) {
        const container = document.getElementById('recentOrders');
        if (!container) return;

        container.innerHTML = ""; // limpar antes de renderizar

        orders.forEach(order => {
            const orderCard = document.createElement('div');
            orderCard.className = `order-card ${order.status}`;

            orderCard.innerHTML = `
                <div class="order-header">
                    <span class="order-id">#${order.id}</span>
                    <span class="order-status ${order.status}">
                        ${getStatusHTML(order.status)}
                    </span>
                </div>
                <div class="order-body">
                    <h3>${order.titulo}</h3>
                    <p>Data: ${order.data}</p>
                </div>
                <div class="order-footer">
                    ${getButtonsHTML(order.status)}
                </div>
            `;

            container.appendChild(orderCard);
        });

        bindOrderButtons();
    }

    // -------------------
    // Status HTML
    // -------------------
    function getStatusHTML(status) {
        switch (status) {
            case "pending": return '<i class="fas fa-clock"></i> Pendente';
            case "in-progress": return '<i class="fas fa-spinner"></i> Em Andamento';
            case "assigned": return '<i class="fas fa-user-cog"></i> Atribuída';
            case "completed": return '<i class="fas fa-check"></i> Concluída';
            default: return '<i class="fas fa-question"></i> Desconhecido';
        }
    }

    // -------------------
    // Botões por status
    // -------------------
    function getButtonsHTML(status) {
        if (status === "pending") {
            return `<button class="btn btn-assign"><i class="fas fa-user-plus"></i> Assumir</button>`;
        }
        if (status === "in-progress" || status === "assigned") {
            return `<button class="btn btn-update"><i class="fas fa-edit"></i> Atualizar</button>`;
        }
        return `<button class="btn btn-details"><i class="fas fa-eye"></i> Detalhes</button>`;
    }

    // -------------------
    // Eventos dos Botões
    // -------------------
    function bindOrderButtons() {
        // Botão Assumir
        document.querySelectorAll('.btn-assign').forEach(btn => {
            btn.addEventListener('click', function() {
                const orderCard = this.closest('.order-card');
                const orderId = orderCard.querySelector('.order-id').textContent;

                console.log(`Assumindo ordem ${orderId}`);
                this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processando...';

                setTimeout(() => {
                    this.outerHTML = `<button class="btn btn-update"><i class="fas fa-edit"></i> Atualizar</button>`;
                    orderCard.classList.remove('pending');
                    orderCard.classList.add('in-progress');
                    orderCard.querySelector('.order-status').className = 'order-status in-progress';
                    orderCard.querySelector('.order-status').innerHTML = '<i class="fas fa-spinner"></i> Em Andamento';

                    // Adicionar responsável
                    const meta = document.createElement('span');
                    meta.innerHTML = '<i class="fas fa-user-cog"></i> Você está responsável';
                    orderCard.querySelector('.order-body').appendChild(meta);

                    bindOrderButtons(); // reatribuir eventos
                }, 1000);
            });
        });

        // Botão Atualizar
        document.querySelectorAll('.btn-update').forEach(btn => {
            btn.addEventListener('click', function() {
                const orderCard = this.closest('.order-card');
                const orderId = orderCard.querySelector('.order-id').textContent;
                window.location.href = `ordens/editar-ordem.html?id=${orderId.slice(1)}`;
            });
        });

        // Botão Detalhes
        document.querySelectorAll('.btn-details').forEach(btn => {
            btn.addEventListener('click', function() {
                const orderCard = this.closest('.order-card');
                const orderId = orderCard.querySelector('.order-id').textContent;
                window.location.href = `ordens/detalhes-ordem.html?id=${orderId.slice(1)}`;
            });
        });
    }

    // -------------------
    // Inicialização
    // -------------------
    loadDashboardData();
});
