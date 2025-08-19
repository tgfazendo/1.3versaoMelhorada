document.addEventListener('DOMContentLoaded', function() {
    // Elementos do DOM
    const menuToggle = document.querySelector('.menu-toggle');
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.createElement('div');
    overlay.className = 'overlay';
    document.body.appendChild(overlay);

    // Controle do menu mobile
    menuToggle.addEventListener('click', () => {
        sidebar.classList.toggle('active');
        overlay.classList.toggle('active');
    });

    overlay.addEventListener('click', () => {
        sidebar.classList.remove('active');
        overlay.classList.remove('active');
    });

    // Dropdown do perfil
    let dropdownVisible = false;
    const profileToggle = document.getElementById('profile-toggle');
    const profileDropdown = document.getElementById('profile-dropdown');

    profileToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdownVisible = !dropdownVisible;
        profileDropdown.style.display = dropdownVisible ? 'block' : 'none';
    });

    // Fechar dropdown ao clicar fora
    document.addEventListener('click', () => {
        if (dropdownVisible) {
            profileDropdown.style.display = 'none';
            dropdownVisible = false;
        }
    });

    // Simulação de dados - substituir por chamada real à API
    function loadDashboardData() {
        // Aqui você faria uma chamada AJAX para buscar os dados reais
        console.log('Carregando dados do dashboard...');
        
        // Simulação de dados
        const dashboardData = {
            pending: 15,
            inProgress: 8,
            assigned: 5,
            completed: 24
        };
        
        // Atualizar os cards
        document.querySelector('.summary-card.pending .card-value').textContent = dashboardData.pending;
        document.querySelector('.summary-card.in-progress .card-value').textContent = dashboardData.inProgress;
        document.querySelector('.summary-card.assigned .card-value').textContent = dashboardData.assigned;
        document.querySelector('.summary-card.completed .card-value').textContent = dashboardData.completed;
    }

    // Botões de ação nas ordens
    document.querySelectorAll('.btn-assign').forEach(btn => {
        btn.addEventListener('click', function() {
            const orderCard = this.closest('.order-card');
            const orderId = orderCard.querySelector('.order-id').textContent;
            
            // Simulação de atribuição de ordem
            console.log(`Assumindo ordem ${orderId}`);
            this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processando...';
            
            setTimeout(() => {
                this.innerHTML = '<i class="fas fa-check"></i> Atribuída';
                this.classList.remove('btn-assign');
                this.classList.add('btn-update');
                this.innerHTML = '<i class="fas fa-edit"></i> Atualizar';
                orderCard.classList.remove('pending');
                orderCard.classList.add('in-progress');
                orderCard.querySelector('.order-status').className = 'order-status in-progress';
                orderCard.querySelector('.order-status').innerHTML = '<i class="fas fa-spinner"></i> Em Andamento';
                
                // Adicionar informação de responsável
                const meta = orderCard.querySelector('.order-meta');
                const responsible = document.createElement('span');
                responsible.innerHTML = '<i class="fas fa-user-cog"></i> Você está responsável';
                meta.appendChild(responsible);
            }, 1000);
        });
    });

    // Botões de atualização
    document.querySelectorAll('.btn-update').forEach(btn => {
        btn.addEventListener('click', function() {
            const orderCard = this.closest('.order-card');
            const orderId = orderCard.querySelector('.order-id').textContent;
            
            // Redirecionar para página de atualização com o ID da ordem
            window.location.href = `ordens/editar-ordem.html?id=${orderId.slice(1)}`;
        });
    });

    // Botões de detalhes
    document.querySelectorAll('.btn-details').forEach(btn => {
        btn.addEventListener('click', function() {
            const orderCard = this.closest('.order-card');
            const orderId = orderCard.querySelector('.order-id').textContent;
            
            // Redirecionar para página de detalhes com o ID da ordem
            window.location.href = `ordens/detalhes-ordem.html?id=${orderId.slice(1)}`;
        });
    });

    // Carregar dados ao iniciar
    loadDashboardData();
});