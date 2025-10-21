document.addEventListener("DOMContentLoaded", async () => {
  const tbody = document.getElementById("usuarios-tbody");
  const filterRole = document.getElementById("filter-role");
  const searchInput = document.getElementById("search-user");
  const backBtn = document.getElementById("back-btn");

  // URL base do backend (funciona local ou no Replit)
  const BASE_URL = window.location.origin;

  // -------------------------------
  // Função: Buscar todos os usuários
  // -------------------------------
  async function carregarUsuarios() {
    try {
      const res = await fetch(`${BASE_URL}/api/admin/usuarios`);
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
        const res = await fetch(`${BASE_URL}/api/admin/usuarios/${id}`, {
          method: "DELETE"
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
    try {
      const res = await fetch(`${BASE_URL}/api/admin/usuarios`);
      if (!res.ok) throw new Error("Erro ao carregar usuários");
      let usuarios = await res.json();
      if (cargo) usuarios = usuarios.filter((u) => u.role === cargo);
      renderUsuarios(usuarios);
    } catch (error) {
      console.error(error);
      tbody.innerHTML = `<tr><td colspan="5">Erro ao filtrar usuários.</td></tr>`;
    }
  });

  // -------------------------------
  // Pesquisa
  // -------------------------------
  searchInput.addEventListener("input", async () => {
    const termo = searchInput.value.toLowerCase();
    try {
      const res = await fetch(`${BASE_URL}/api/admin/usuarios`);
      if (!res.ok) throw new Error("Erro ao carregar usuários");
      let usuarios = await res.json();
      usuarios = usuarios.filter(
        (u) =>
          u.nome.toLowerCase().includes(termo) ||
          u.email.toLowerCase().includes(termo)
      );
      renderUsuarios(usuarios);
    } catch (error) {
      console.error(error);
      tbody.innerHTML = `<tr><td colspan="5">Erro ao pesquisar usuários.</td></tr>`;
    }
  });

  // -------------------------------
  // Voltar para painel principal
  // -------------------------------
  backBtn.addEventListener("click", () => {
    window.location.href = "painel-admin.html";
  });

  // Inicialização
  carregarUsuarios();
});
