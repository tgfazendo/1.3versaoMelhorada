document.addEventListener("DOMContentLoaded", function() {
  // =========================
  // Dados de apoio
  // =========================
  const salas = ["101", "102", "103", "104", "105"];
  const labs = ["Lab 1", "Lab 2", "Lab 3", "Lab Redes", "Lab Hardware"];

  const equipmentData = [
    { value: "kit-professor", label: "Kit Professor" },
    { value: "kit-aluno", label: "Kit Aluno" },
    { value: "monitor", label: "Monitor" },
    { value: "teclado", label: "Teclado" },
    { value: "mouse", label: "Mouse" },
    { value: "outro", label: "Outro" }
  ];

  const problemData = {
    "kit-professor": [
      { value: "nao-liga", label: "Não liga" },
      { value: "sem-video", label: "Sem vídeo" },
      { value: "sem-internet", label: "Sem conexão com internet" },
      { value: "outro", label: "Outro" }
    ],
    "default": [
      { value: "nao-funciona", label: "Não funciona" },
      { value: "danificado", label: "Danificado" },
      { value: "outro", label: "Outro" }
    ]
  };

  // =========================
  // Funções utilitárias
  // =========================
  const getElement = id => document.getElementById(id);

  function populateSelect(select, options) {
    if (!select) return;
    select.innerHTML = `<option value="">Selecione...</option>`;
    options.forEach(o => {
      const opt = document.createElement("option");
      opt.value = o.value || o;
      opt.textContent = o.label || o;
      select.appendChild(opt);
    });
  }

  function handleFileUpload(fileInput, fileList) {
    if (!fileInput || !fileList) return;

    fileList.innerHTML = "";
    const files = Array.from(fileInput.files);

    if (files.length > 3) {
      alert("Você pode anexar no máximo 3 arquivos.");
      fileInput.value = "";
      return;
    }

    files.forEach((file, i) => {
      const div = document.createElement("div");
      div.className = "file-item";
      div.innerHTML = `
        <i class="fas fa-file-alt"></i>
        <span>${file.name}</span>
        <span class="remove" data-index="${i}">&times;</span>
      `;
      fileList.appendChild(div);
    });

    fileList.querySelectorAll(".remove").forEach(btn => {
      btn.addEventListener("click", e => {
        const index = parseInt(e.target.dataset.index);
        const newFiles = files.filter((_, i) => i !== index);

        const dt = new DataTransfer();
        newFiles.forEach(f => dt.items.add(f));
        fileInput.files = dt.files;

        handleFileUpload(fileInput, fileList);
      });
    });
  }

  async function enviarOrdem(body, filesInput, ordemTipo, modalElement) {
    const token = localStorage.getItem("authToken");
    if (!token) {
      alert("Sessão expirada. Faça login novamente.");
      window.location.href = "../../index.html";
      return;
    }

    try {
      const res = await fetch("/api/ordens", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.erro || "Erro ao criar ordem.");

      const ordemId = data.ordem?.id;

      if (ordemId && filesInput.files.length > 0) {
        const formData = new FormData();
        for (const file of filesInput.files) formData.append("file-upload", file);

        await fetch(`/api/ordens/${ordemId}/anexos`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData
        });
      }

      alert(`${ordemTipo === "problema" ? "Problema" : "Instalação"} enviada com sucesso!`);

      if (modalElement) closeModal(modalElement);
      window.location.href = "minhas-ordens.html";
    } catch (err) {
      console.error(err);
      alert("Erro ao enviar a ordem. Veja console.");
    }
  }

  // =========================
  // Seleção de elementos
  // =========================
  const modalProblema = getElement("modal-problema");
  const modalInstalacao = getElement("modal-instalacao");

  const abrirProblema = getElement("abrir-problema");
  const abrirInstalacao = getElement("abrir-instalacao");

  const closeBtns = document.querySelectorAll(".modal-content .close");

  const formProblema = getElement("form-problema");
  const selectSala = getElement("local-sala");
  const selectEquipamento = getElement("tipo-equipamento");
  const selectProblema = getElement("tipo-problema");
  const descricaoProblema = getElement("descricao-problema");
  const uploadProblema = getElement("file-upload-problema");
  const listProblema = getElement("file-list-problema");

  const formInstalacao = getElement("form-instalacao");
  const selectLab = getElement("local-lab");
  const appName = getElement("app-name");
  const appVersion = getElement("app-version");
  const appLink = getElement("app-link");
  const installationNotes = getElement("installation-notes");
  const uploadInstalacao = getElement("file-upload-instalacao");
  const listInstalacao = getElement("file-list-instalacao");

  // =========================
  // Funções de Modal
  // =========================
  function openModal(modal) {
    if (!modal) return;
    modal.classList.add("active");
    document.body.style.overflow = "hidden";
  }

  function closeModal(modal) {
    if (!modal) return;
    modal.classList.remove("active");
    document.body.style.overflow = "";
  }

  // abrir modais
  abrirProblema?.addEventListener("click", () => openModal(modalProblema));
  abrirInstalacao?.addEventListener("click", () => openModal(modalInstalacao));

  // fechar modais ao clicar no X
  closeBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      const modalId = btn.dataset.close; // pega "problema" ou "instalacao"
      const modal = getElement(`modal-${modalId}`);
      closeModal(modal);
    });
  });

  // fechar ao clicar fora do conteúdo
  [modalProblema, modalInstalacao].forEach(modal => {
    modal.addEventListener("click", e => {
      if (e.target === modal) closeModal(modal);
    });
  });

  // fechar com ESC
  document.addEventListener("keydown", e => {
    if (e.key === "Escape") {
      closeModal(modalProblema);
      closeModal(modalInstalacao);
    }
  });

  // =========================
  // Popula selects
  // =========================
  if (selectSala) populateSelect(selectSala, salas);
  if (selectEquipamento) populateSelect(selectEquipamento, equipmentData);
  if (selectLab) populateSelect(selectLab, labs);

  if (selectEquipamento && selectProblema) {
    populateSelect(selectProblema, problemData.default);
    selectEquipamento.addEventListener("change", () => {
      populateSelect(selectProblema, problemData[selectEquipamento.value] || problemData.default);
    });
  }

  // =========================
  // Upload de arquivos
  // =========================
  uploadProblema?.addEventListener("change", () => handleFileUpload(uploadProblema, listProblema));
  uploadInstalacao?.addEventListener("change", () => handleFileUpload(uploadInstalacao, listInstalacao));

  // =========================
  // Submissão dos formulários
  // =========================
  formProblema?.addEventListener("submit", e => {
    e.preventDefault();
    const body = {
      tipo_solicitacao: "problema",
      local_tipo: "sala",
      local_detalhe: selectSala.value,
      descricao: descricaoProblema.value,
      equipamento: selectEquipamento.value,
      tipo_problema: selectProblema.value
    };
    enviarOrdem(body, uploadProblema, "problema", modalProblema);
  });

  formInstalacao?.addEventListener("submit", e => {
    e.preventDefault();
    const body = {
      tipo_solicitacao: "instalacao",
      local_tipo: "laboratorio",
      local_detalhe: selectLab.value,
      descricao: installationNotes.value,
      app_nome: appName.value,
      app_versao: appVersion.value,
      app_link: appLink.value
    };
    enviarOrdem(body, uploadInstalacao, "instalacao", modalInstalacao);
  });
});
