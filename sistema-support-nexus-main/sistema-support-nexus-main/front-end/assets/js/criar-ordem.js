// criar-ordem.js
document.addEventListener('DOMContentLoaded', function() {
    // Elementos do DOM
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

    // Dados dos equipamentos e problemas
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

    // Função para popular selects
    function populateSelect(selectElement, options, placeholder = 'Selecione...') {
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

    // Atualizar equipamentos baseado no local e tipo de computador
    function updateEquipmentOptions() {
        const isLab = document.querySelector('input[name="location-type"]:checked').value === 'lab';
        const computerType = computerTypeSelect.value;

        if (isLab && computerType === 'desktop') {
            populateSelect(equipmentTypeSelect, equipmentData.labDesktop);
        } else if (isLab && computerType === 'notebook') {
            populateSelect(equipmentTypeSelect, equipmentData.labNotebook);
        } else {
            populateSelect(equipmentTypeSelect, equipmentData.classroom);
        }

        // Resetar o select de problemas
        populateSelect(problemTypeSelect, [], 'Selecione o equipamento primeiro');
        problemTypeSelect.disabled = true;
    }

    // Atualizar problemas baseado no equipamento selecionado
    function updateProblemOptions() {
        const equipment = equipmentTypeSelect.value;
        let problems = problemData.default;

        if (equipment === 'kit-professor') {
            problems = problemData['kit-professor'];
        } else if (equipment === 'app') {
            problems = problemData.app;
        }

        populateSelect(problemTypeSelect, problems);
        problemTypeSelect.disabled = false;
    }

    // Alternar entre seções de problema e instalação
    function toggleRequestType() {
        const isInstallation = document.querySelector('input[name="request-type"]:checked').value === 'installation';
        
        if (isInstallation) {
            problemSection.style.display = 'none';
            installationSection.style.display = 'block';
            // Definir valores padrão para instalação
            populateSelect(problemTypeSelect, problemData.app);
            equipmentTypeSelect.value = 'app';
        } else {
            problemSection.style.display = 'block';
            installationSection.style.display = 'none';
            updateEquipmentOptions();
        }
    }

    // Alternar entre sala de aula e laboratório
    function toggleLocationType() {
        const isLab = document.querySelector('input[name="location-type"]:checked').value === 'lab';
        
        if (isLab) {
            classroomFields.style.display = 'none';
            labFields.style.display = 'block';
            positionGroup.style.display = 'block';
        } else {
            classroomFields.style.display = 'block';
            labFields.style.display = 'none';
            positionGroup.style.display = 'none';
        }
        
        updateEquipmentOptions();
    }

    // Gerenciar upload de arquivos
    function handleFileUpload() {
        fileList.innerHTML = '';
        const files = fileUpload.files;
        
        if (files.length > 3) {
            alert('Você pode anexar no máximo 3 arquivos.');
            fileUpload.value = '';
            return;
        }
        
        for (let i = 0; i < files.length; i++) {
            const fileItem = document.createElement('div');
            fileItem.className = 'file-item';
            
            const fileIcon = document.createElement('i');
            fileIcon.className = 'fas fa-file-alt';
            
            const fileName = document.createElement('span');
            fileName.textContent = files[i].name.length > 20 
                ? files[i].name.substring(0, 20) + '...' 
                : files[i].name;
            
            const removeBtn = document.createElement('span');
            removeBtn.className = 'remove-file';
            removeBtn.innerHTML = '&times;';
            removeBtn.dataset.index = i;
            removeBtn.addEventListener('click', removeFile);
            
            fileItem.appendChild(fileIcon);
            fileItem.appendChild(fileName);
            fileItem.appendChild(removeBtn);
            fileList.appendChild(fileItem);
        }
    }

    // Remover arquivo da lista
    function removeFile(e) {
        const index = e.target.dataset.index;
        const files = Array.from(fileUpload.files);
        files.splice(index, 1);
        
        // Criar nova FileList (não é diretamente mutável)
        const dataTransfer = new DataTransfer();
        files.forEach(file => dataTransfer.items.add(file));
        fileUpload.files = dataTransfer.files;
        
        handleFileUpload();
    }

    // Validar formulário antes de enviar
    function validateForm() {
        const isInstallation = document.querySelector('input[name="request-type"]:checked').value === 'installation';
        const isLab = document.querySelector('input[name="location-type"]:checked').value === 'lab';
        const location = isLab ? document.getElementById('lab').value : document.getElementById('classroom').value;
        
        if (!location) {
            alert('Por favor, selecione um local válido.');
            return false;
        }
        
        if (!isInstallation) {
            if (!equipmentTypeSelect.value) {
                alert('Por favor, selecione um equipamento.');
                return false;
            }
            
            if (!problemTypeSelect.value) {
                alert('Por favor, selecione um tipo de problema.');
                return false;
            }
        } else {
            const appName = document.getElementById('app-name').value;
            if (!appName) {
                alert('Por favor, informe o nome do aplicativo.');
                return false;
            }
        }
        
        return true;
    }

    // Enviar formulário
    function submitForm(e) {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }
        
        // Simular envio (substituir por AJAX/API real)
        const formData = new FormData(form);
        const orderData = {};
        
        formData.forEach((value, key) => {
            orderData[key] = value;
        });
        
        console.log('Dados da ordem:', orderData);
        
        // Mostrar mensagem de sucesso
        alert('Ordem criada com sucesso! Número: ORD-' + Date.now());
        form.reset();
        fileList.innerHTML = '';
        
        // Redirecionar para o painel (opcional)
        // window.location.href = 'painel-professor.html';
    }

    // Event Listeners
    requestTypeRadios.forEach(radio => {
        radio.addEventListener('change', toggleRequestType);
    });

    locationTypeRadios.forEach(radio => {
        radio.addEventListener('change', toggleLocationType);
    });

    computerTypeSelect.addEventListener('change', updateEquipmentOptions);
    equipmentTypeSelect.addEventListener('change', updateProblemOptions);
    fileUpload.addEventListener('change', handleFileUpload);
    form.addEventListener('submit', submitForm);
    
    cancelBtn.addEventListener('click', function() {
        if (confirm('Deseja cancelar a criação desta ordem?')) {
            window.location.href = 'painel-professor.html';
        }
    });

    // Inicialização
    toggleRequestType();
    toggleLocationType();
});