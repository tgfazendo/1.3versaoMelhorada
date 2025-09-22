// criar-ordem.js
document.addEventListener('DOMContentLoaded', function() {
    // ----------------------
    // Elementos do DOM
    // ----------------------
    const form = document.getElementById('order-form');
    const requestTypeRadios = document.querySelectorAll('input[name="request-type"]');
    const locationTypeRadios = document.querySelectorAll('input[name="location-type"]');
    const problemSection = document.getElementById('problem-section');
    const installationSection = document.getElementById('installation-section');
    const classroomFields = document.getElementById('classroom-fields');
    const labFields = document.getElementById('lab-fields');
    const computerTypeSelect = document.getElementById('computer-type');
    const equipmentTypeSelect = document.getElementById('equipment-type');
    const problemTypeSelect = document.getElementById('problem-type');
    const positionGroup = document.getElementById('position-group');
    const fileUpload = document.getElementById('file-upload');
    const fileList = document.getElementById('file-list');
    const cancelBtn = document.getElementById('cancel-btn');

    // ----------------------
    // Dados dos equipamentos e problemas
    // ----------------------
    const equipmentData = {
        classroom: [
            { value: 'kit-professor', label: 'Kit Professor (ThinkCentre + ThinkVision)' },
            { value: 'cabo-internet', label: 'Cabo de Internet' },
            { value: 'keystone', label: 'Keystone' },
            { value: 'hdmi', label: 'Cabo HDMI' },
            { value: 'displayport', label: 'Cabo DisplayPort' },
            { value: 'tv', label: 'TV' },
            { value: 'mouse', label: 'Mouse' },
            { value: 'teclado', label: 'Teclado' },
            { value: 'outro', label: 'Outro Equipamento' }
        ],
        labDesktop: [
            { value: 'kit-professor', label: 'Kit Professor' },
            { value: 'kit-aluno', label: 'Kit Aluno (Desktop)' },
            { value: 'monitor-lg', label: 'Monitor LG' },
            { value: 'monitor-thinkvision', label: 'Monitor ThinkVision' },
            { value: 'monitor-hp', label: 'Monitor HP' },
            { value: 'monitor-aoc', label: 'Monitor AOC' },
            { value: 'gabinete-thinkcentre', label: 'Gabinete ThinkCentre' },
            { value: 'gabinete-hp', label: 'Gabinete HP ProDesk' },
            { value: 'cabo-vga', label: 'Cabo VGA' },
            { value: 'outro', label: 'Outro Equipamento' }
        ],
        labNotebook: [
            { value: 'kit-professor', label: 'Kit Professor' },
            { value: 'thinkpad-l14', label: 'Notebook ThinkPad L14 Gen2' },
            { value: 'thinkpad-e14', label: 'Notebook ThinkPad E14 Gen2' },
            { value: 'positivo', label: 'Notebook Positivo' },
            { value: 'outro', label: 'Outro Equipamento' }
        ]
    };

    const problemData = {
        'kit-professor': [
            { value: 'sem-internet', label: 'Sem conexão com a internet' },
            { value: 'nao-liga', label: 'Equipamento não liga' },
            { value: 'monitor-nao-liga', label: 'Monitor não liga' },
            { value: 'nao-espelha', label: 'Não está espelhando na TV' },
            { value: 'lento', label: 'Computador muito lento' },
            { value: 'outro', label: 'Outro problema' }
        ],
        'default': [
            { value: 'nao-funciona', label: 'Equipamento não funciona' },
            { value: 'danificado', label: 'Equipamento danificado' },
            { value: 'falta', label: 'Equipamento faltando' },
            { value: 'outro', label: 'Outro problema' }
        ],
        'app': [
            { value: 'falta-app', label: 'Aplicativo não instalado' },
            { value: 'app-nao-funciona', label: 'Aplicativo não funciona' },
            { value: 'app-lento', label: 'Aplicativo muito lento' },
            { value: 'atualizacao', label: 'Precisa de atualização' },
            { value: 'outro', label: 'Outro problema' }
        ]
    };

    // ----------------------
    // Funções auxiliares
    // ----------------------
    function populateSelect(selectElement, options, placeholder = 'Selecione...') {
        if (!selectElement) return;
        selectElement.innerHTML = '';
        const placeholderOption = document.createElement('option');
        placeholderOption.value = '';
        placeholderOption.textContent = placeholder;
        placeholderOption.disabled = true;
        placeholderOption.selected = true;
        selectElement.appendChild(placeholderOption);

        options.forEach(option => {
            const opt = document.createElement('option');
            opt.value = option.value;
            opt.textContent = option.label;
            selectElement.appendChild(opt);
        });
    }

    function updateEquipmentOptions() {
        const locationTypeRadio = document.querySelector('input[name="location-type"]:checked');
        if (!locationTypeRadio) return;

        const isLab = locationTypeRadio.value === 'lab';
        const computerType = computerTypeSelect?.value || 'desktop';

        if (isLab && computerType === 'desktop') populateSelect(equipmentTypeSelect, equipmentData.labDesktop);
        else if (isLab && computerType === 'notebook') populateSelect(equipmentTypeSelect, equipmentData.labNotebook);
        else populateSelect(equipmentTypeSelect, equipmentData.classroom);

        populateSelect(problemTypeSelect, [], 'Selecione o equipamento primeiro');
        problemTypeSelect.disabled = true;
    }

    function updateProblemOptions() {
        if (!equipmentTypeSelect) return;
        const equipment = equipmentTypeSelect.value;
        let problems = problemData.default;

        if (equipment === 'kit-professor') problems = problemData['kit-professor'];
        else if (equipment === 'app') problems = problemData.app;

        populateSelect(problemTypeSelect, problems);
        problemTypeSelect.disabled = false;
    }

    function toggleRequestType() {
        const requestTypeRadio = document.querySelector('input[name="request-type"]:checked');
        if (!requestTypeRadio) return;

        const isInstallation = requestTypeRadio.value === 'installation';

        problemSection.style.display = isInstallation ? 'none' : 'block';
        installationSection.style.display = isInstallation ? 'block' : 'none';

        if (isInstallation) {
            populateSelect(problemTypeSelect, problemData.app);
            if (equipmentTypeSelect) equipmentTypeSelect.value = 'app';
        } else {
            updateEquipmentOptions();
        }
    }

    function toggleLocationType() {
        const locationTypeRadio = document.querySelector('input[name="location-type"]:checked');
        if (!locationTypeRadio) return;

        const isLab = locationTypeRadio.value === 'lab';
        classroomFields.style.display = isLab ? 'none' : 'block';
        labFields.style.display = isLab ? 'block' : 'none';
        if (positionGroup) positionGroup.style.display = isLab ? 'block' : 'none';

        updateEquipmentOptions();
    }

    function handleFileUpload() {
        if (!fileUpload || !fileList) return;
        fileList.innerHTML = '';
        const files = fileUpload.files;

        if (files.length > 3) {
            alert('Você pode anexar no máximo 3 arquivos.');
            fileUpload.value = '';
            return;
        }

        Array.from(files).forEach((file, i) => {
            const fileItem = document.createElement('div');
            fileItem.className = 'file-item';

            const fileIcon = document.createElement('i');
            fileIcon.className = 'fas fa-file-alt';

            const fileName = document.createElement('span');
            fileName.textContent = file.name.length > 20 ? file.name.slice(0, 20) + '...' : file.name;

            const removeBtn = document.createElement('span');
            removeBtn.className = 'remove-file';
            removeBtn.innerHTML = '&times;';
            removeBtn.dataset.index = i;
            removeBtn.addEventListener('click', removeFile);

            fileItem.appendChild(fileIcon);
            fileItem.appendChild(fileName);
            fileItem.appendChild(removeBtn);
            fileList.appendChild(fileItem);
        });
    }

    function removeFile(e) {
        if (!fileUpload) return;
        const index = e.target.dataset.index;
        const files = Array.from(fileUpload.files);
        files.splice(index, 1);
        const dataTransfer = new DataTransfer();
        files.forEach(file => dataTransfer.items.add(file));
        fileUpload.files = dataTransfer.files;
        handleFileUpload();
    }

    function validateForm() {
        const requestTypeRadio = document.querySelector('input[name="request-type"]:checked');
        const locationTypeRadio = document.querySelector('input[name="location-type"]:checked');
        if (!requestTypeRadio || !locationTypeRadio) return false;

        const isInstallation = requestTypeRadio.value === 'installation';
        const isLab = locationTypeRadio.value === 'lab';
        const locationSelect = isLab ? document.getElementById('lab') : document.getElementById('classroom');
        const location = locationSelect?.value;

        if (!location) {
            alert('Por favor, selecione um local válido.');
            return false;
        }

        if (!isInstallation) {
            if (!equipmentTypeSelect?.value) {
                alert('Por favor, selecione um equipamento.');
                return false;
            }
            if (!problemTypeSelect?.value) {
                alert('Por favor, selecione um tipo de problema.');
                return false;
            }
        } else {
            const appName = document.getElementById('app-name')?.value;
            if (!appName) {
                alert('Por favor, informe o nome do aplicativo.');
                return false;
            }
        }

        return true;
    }

    // ----------------------
    // Função de envio final
    // ----------------------
    async function submitFormFinal(e) {
        e.preventDefault();
        if (!validateForm()) return;

        const token = localStorage.getItem("authToken");
        const user = JSON.parse(localStorage.getItem("currentUser"));
        if (!token || !user) {
            alert("Usuário não autenticado. Faça login novamente.");
            window.location.href = "../../login.html";
            return;
        }

        const formData = new FormData(form);

        // Mapear valores para o banco
        const tipoSolicitacao = formData.get("request-type") === "problem" ? "problema" : "instalacao";
        const localTipo = formData.get("location-type") === "classroom" ? "sala" : "laboratorio";
        const localDetalhe = formData.get("classroom") || formData.get("lab") || "";
        const descricao = tipoSolicitacao === "problema" ? (formData.get("problem-description") || "Sem descrição") : "Ordem de instalação";
        const observacoes = formData.get("installation-notes") || null;
        const equipamento = tipoSolicitacao === "problema" ? (formData.get("equipment-type") || "Outro") : null;
        const tipoProblema = tipoSolicitacao === "problema" ? (formData.get("problem-type") || "Outro") : null;
        const appNome = tipoSolicitacao === "instalacao" ? (formData.get("app-name") || "Sem nome") : null;
        const appVersao = tipoSolicitacao === "instalacao" ? (formData.get("app-version") || null) : null;
        const appLink = tipoSolicitacao === "instalacao" ? (formData.get("app-link") || null) : null;

        const body = {
            usuario_id: user.id,
            tipo_solicitacao: tipoSolicitacao,
            local_tipo: localTipo,
            local_detalhe: localDetalhe,
            descricao,
            observacoes,
            equipamento,
            tipo_problema: tipoProblema,
            app_nome: appNome,
            app_versao: appVersao,
            app_link: appLink
        };

        console.log("=== Dados enviados para o backend ===", body);

        try {
            const res = await fetch("/api/ordens", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(body)
            });

            let data;
            try { data = await res.json(); } catch { data = {}; }

            console.log("=== Resposta do backend ===", res.status, data);

            if (!res.ok) {
                alert("Erro: " + (data.erro || "Não foi possível criar a ordem"));
                return;
            }

            const ordemId = data.ordem?.id;
            if (!ordemId) {
                alert("Ordem criada, mas ID não retornado pelo servidor.");
                return;
            }

            if (fileUpload?.files.length > 0) {
                const arquivosForm = new FormData();
                for (const file of fileUpload.files) arquivosForm.append("file-upload", file);

                const anexosRes = await fetch(`/api/ordens/${ordemId}/anexos`, {
                    method: "POST",
                    headers: { "Authorization": `Bearer ${token}` },
                    body: arquivosForm
                });

                if (!anexosRes.ok) alert("Ordem criada, mas erro ao enviar anexos.");
            }

            alert("Ordem criada com sucesso!");
            form.reset();
            if (fileList) fileList.innerHTML = '';
            window.location.href = "minhas-ordens.html";

        } catch (err) {
            console.error("Erro ao criar a ordem:", err);
            alert("Erro ao criar a ordem. Tente novamente.");
        }
    }

    // ----------------------
    // Event Listeners
    // ----------------------
    requestTypeRadios.forEach(r => r.addEventListener('change', toggleRequestType));
    locationTypeRadios.forEach(r => r.addEventListener('change', toggleLocationType));
    computerTypeSelect?.addEventListener('change', updateEquipmentOptions);
    equipmentTypeSelect?.addEventListener('change', updateProblemOptions);
    fileUpload?.addEventListener('change', handleFileUpload);
    form?.addEventListener('submit', submitFormFinal);
    cancelBtn?.addEventListener('click', () => {
        if (confirm('Deseja cancelar a criação desta ordem?')) window.location.href = 'painel-professor.html';
    });

    // Inicializações
    toggleRequestType();
    toggleLocationType();
});
