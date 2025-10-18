document.addEventListener("DOMContentLoaded", async () => {
  const token = localStorage.getItem("authToken");
  const user = JSON.parse(localStorage.getItem("currentUser"));

   // Impede acesso se não for admin
  /*if (!token || !user || user.role !== "admin") {
    window.location.href = "../../login.html";
    return;
  } */

  const tbody = document.querySelector("tbody");
  const filterRole = document.getElementById("filter-role");
  const searchInput = document.getElementById("search-user");
  const logoutBtn = document.getElementById("logout-btn");
  const userName = document.getElementById("user-name");

  userName.textContent = user.nome;

  // -------------------------------
  // Função: Buscar todos os usuários
  // -------------------------------
  async function carregarUsuarios() {
    try {
      const res = await fetch("http://localhost:3000/api/admin/usuarios", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Erro ao carregar usuários");
      const data = await res.json();
      renderUsuarios(data);
    } catch (error) {
      console.error(error);
      tbody.innerHTML = `<tr><td colspan="5">Erro ao carregar usuários.</td></tr>`;
    }
  }

  // -------------------------------
  // Função: Renderizar tabela
  // -------------------------------
  function renderUsuarios(usuarios) {
    tbody.innerHTML = "";
    if (usuarios.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5">Nenhum usuário encontrado.</td></tr>`;
      return;
    }

    usuarios.forEach((u) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${u.id}</td>
        <td>${u.nome}</td>
        <td>${u.email}</td>
        <td>${u.role}</td>
        <td>
          <button class="delete" data-id="${u.id}">
            <i class="fa-solid fa-trash"></i>
          </button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  }

  // -------------------------------
  // Função: Excluir usuário
  // -------------------------------
  tbody.addEventListener("click", async (e) => {
    const btn = e.target.closest(".delete");
    if (!btn) return;
    const id = btn.dataset.id;

    if (confirm("Deseja realmente excluir este usuário?")) {
      try {
        const res = await fetch(`http://localhost:3000/api/admin/usuarios/${id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Erro ao excluir");
        await carregarUsuarios();
      } catch (error) {
        console.error(error);
        alert("Erro ao excluir usuário.");
      }
    }
  });

  // -------------------------------
  // Filtros
  // -------------------------------
  filterRole.addEventListener("change", async () => {
    const cargo = filterRole.value;
    const res = await fetch("http://localhost:3000/api/admin/usuarios", {
      headers: { Authorization: `Bearer ${token}` },
    });
    let usuarios = await res.json();
    if (cargo) usuarios = usuarios.filter((u) => u.role === cargo);
    renderUsuarios(usuarios);
  });

  // -------------------------------
  // Pesquisa
  // -------------------------------
  searchInput.addEventListener("input", async () => {
    const termo = searchInput.value.toLowerCase();
    const res = await fetch("http://localhost:3000/api/admin/usuarios", {
      headers: { Authorization: `Bearer ${token}` },
    });
    let usuarios = await res.json();
    usuarios = usuarios.filter(
      (u) =>
        u.nome.toLowerCase().includes(termo) ||
        u.email.toLowerCase().includes(termo)
    );
    renderUsuarios(usuarios);
  });

  // -------------------------------
  // Logout
  // -------------------------------
  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("currentUser");
    window.location.href = "../../login.html";
  });

  // Inicialização
  carregarUsuarios();
});
