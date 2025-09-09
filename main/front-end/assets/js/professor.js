document.addEventListener('DOMContentLoaded', function() {
    // =========================
    // Inicialização
    // =========================
    const token = localStorage.getItem("authToken");
    const user = JSON.parse(localStorage.getItem("currentUser"));

    if (!token || !user) {
        window.location.href = "../../login.html";
        return;
    }

    // Elementos do DOM
    const sidebar = document.querySelector('.sidebar');
    const menuToggle = document.querySelector('.menu-toggle');
    const overlay = createOverlay();
    const userNameEl = document.getElementById("userName");
    const userEmailEl = document.getElementById("userEmail");
    const welcomeNameEl = document.getElementById("welcomeName");
    const logoutBtn = document.getElementById("logout");
    const recentOrdersEl = document.getElementById("recentOrders");
    const badgePendentesEl = document.getElementById("badgePendentes");
    const badgeAndamentoEl = document.getElementById("badgeAndamento");

    // =========================
    // Funções de interface
    // =========================

    function createOverlay() {
        const div = document.createElement('div');
        div.className = 'overlay';
        document.body.appendChild(div);
        return div;
    }

    function toggleSidebar() {
        sidebar.classList.toggle('active');
        overlay.classList.toggle('active');
    }

    function closeSidebar() {
        sidebar.classList.remove('active');
        overlay.classList.remove('active');
    }

    function setupMenu() {
        menuToggle.addEventListener('click', toggleSidebar);
        overlay.addEventListener('click', closeSidebar);
    }

    function setupProfileDropdown() {
        let dropdownVisible = false;
        const avatar = document.querySelector('.profile-avatar');
        const dropdown = document.querySelector('.dropdown-content');

        avatar.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdownVisible = !dropdownVisible;
            dropdown.style.display = dropdownVisible ? 'block' : 'none';
        });

        document.addEventListener('click', () => {
            if (dropdownVisible) {
                dropdown.style.display = 'none';
                dropdownVisible = false;
            }
        });
    }

    function setupLogout() {
        logoutBtn?.addEventListener("click", () => {
            localStorage.removeItem("authToken");
            localStorage.removeItem("currentUser");
        });
    }

    function fillUserInfo() {
        userNameEl.textContent = user.nome;
        userEmailEl.textContent = user.email;
        welcomeNameEl.textContent = user.nome;
    }

    // =========================
    // Funções de dados
    // =========================

    async function fetchOrdens() {
        try {
            const res = await fetch("/api/ordens", {
                headers: { "Authorization": "Bearer " + token }
            });
            if (!res.ok) throw new Error("Falha ao carregar ordens");

            const ordens = await res.json();
            renderOrdens(ordens);
        } catch (err) {
            console.error(err);
            if (recentOrdersEl) recentOrdersEl.innerHTML = "<p>Erro ao carregar ordens.</p>";
        }
    }

    function renderOrdens(ordens) {
        if (!recentOrdersEl) return;

        recentOrdersEl.innerHTML = "";
        let pendentes = 0;
        let andamento = 0;

        ordens.forEach(o => {
            const div = document.createElement("div");
            div.className = "order-card";
            div.innerHTML = `
                <h3>${o.codigo} - ${o.titulo}</h3>
                <p>${o.descricao}</p>
                <span class="status ${o.status}">${o.statusNome}</span>
                <span class="date">${o.data}</span>
            `;
            recentOrdersEl.appendChild(div);

            if (o.status === "pending") pendentes++;
            if (o.status === "in-progress") andamento++;
        });

        if (badgePendentesEl) badgePendentesEl.textContent = pendentes;
        if (badgeAndamentoEl) badgeAndamentoEl.textContent = andamento;
    }

    // =========================
    // Inicializar tudo
    // =========================
    setupMenu();
    setupProfileDropdown();
    setupLogout();
    fillUserInfo();
    fetchOrdens();
});
