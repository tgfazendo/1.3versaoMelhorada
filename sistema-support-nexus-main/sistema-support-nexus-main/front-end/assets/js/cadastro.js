document.addEventListener('DOMContentLoaded', function() {
    // Elementos do DOM
    const registerForm = document.getElementById('registerForm');
    const typeButtons = document.querySelectorAll('.type-btn');
    const showPasswordBtns = document.querySelectorAll('.show-password');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const passwordMatchFeedback = document.querySelector('.password-match-feedback');
    const strengthBar = document.querySelector('.strength-bar');
    const strengthText = document.querySelector('.strength-text strong');
    const phoneInput = document.getElementById('phone');
    const submitBtn = document.querySelector('.btn-submit');

    // Máscara para telefone
    if (phoneInput) {
        phoneInput.addEventListener('input', function(e) {
            const value = e.target.value.replace(/\D/g, '');
            const formattedValue = formatPhoneNumber(value);
            e.target.value = formattedValue;
        });
    }

    // Toggle de tipo de usuário
    typeButtons.forEach(button => {
        button.addEventListener('click', function() {
            typeButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
        });
    });

    // Mostrar/ocultar senha
    showPasswordBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const input = this.parentElement.querySelector('input');
            const icon = this.querySelector('i');
            
            if (input.type === 'password') {
                input.type = 'text';
                icon.classList.replace('fa-eye', 'fa-eye-slash');
            } else {
                input.type = 'password';
                icon.classList.replace('fa-eye-slash', 'fa-eye');
            }
        });
    });

    // Verificar correspondência de senhas
    if (confirmPasswordInput) {
        confirmPasswordInput.addEventListener('input', checkPasswordMatch);
    }

    // Medidor de força da senha
    if (passwordInput) {
        passwordInput.addEventListener('input', function() {
            checkPasswordStrength(this.value);
            checkPasswordMatch();
        });
    }

    // Validação do formulário
    if (registerForm) {
        registerForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            if (validateForm()) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Cadastrando...';
                
                // Criar objeto com os dados do formulário
                const formData = {
                    userType: document.querySelector('.type-btn.active').dataset.type,
                    employeeId: document.getElementById('employeeId').value,
                    fullName: document.getElementById('fullName').value,
                    birthDate: document.getElementById('birthDate').value,
                    email: document.getElementById('email').value,
                    phone: document.getElementById('phone').value,
                    password: document.getElementById('password').value,
                    registrationDate: new Date().toISOString()
                };

                // Converter para JSON
                const formDataJSON = JSON.stringify(formData);
                console.log('Dados em JSON:', formDataJSON);

                // 1. Salvar no localStorage (para persistência local)
                saveToLocalStorage(formData);
                
                // 2. Simular envio para um servidor (substituir por chamada real)
                simulateServerSubmission(formDataJSON)
                    .then(response => {
                        // Salvar flag de cadastro bem-sucedido
                        localStorage.setItem('showRegistrationSuccess', 'true');
                        // Redirecionar
                        window.location.href = 'login.html';
                    })
                    .catch(error => {
                        console.error('Erro no cadastro:', error);
                        alert('Ocorreu um erro no cadastro. Por favor, tente novamente.');
                        submitBtn.disabled = false;
                        submitBtn.innerHTML = '<i class="fas fa-save"></i> Cadastrar Usuário';
                    });
            }
        });
    }

    // Função para salvar no localStorage
    function saveToLocalStorage(userData) {
        try {
            // Obter usuários existentes ou criar um novo array
            const existingUsers = JSON.parse(localStorage.getItem('users')) || [];
            
            // Verificar se o usuário já existe
            const userExists = existingUsers.some(user => 
                user.email === userData.email || user.employeeId === userData.employeeId
            );
            
            if (userExists) {
                throw new Error('Usuário já cadastrado');
            }
            
            // Adicionar novo usuário
            existingUsers.push(userData);
            
            // Salvar no localStorage
            localStorage.setItem('users', JSON.stringify(existingUsers));
            console.log('Usuário salvo no localStorage');
        } catch (error) {
            console.error('Erro ao salvar no localStorage:', error);
            throw error;
        }
    }

    // Função para simular envio ao servidor
    function simulateServerSubmission(data) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                // Simular erro aleatório (apenas para demonstração)
                const shouldFail = Math.random() < 0.1; // 10% de chance de falha
                
                if (shouldFail) {
                    reject({ status: 500, message: 'Erro interno do servidor' });
                } else {
                    resolve({ status: 200, message: 'Sucesso', data: JSON.parse(data) });
                }
            }, 1500);
        });
    }

    // Funções auxiliares (mantidas as mesmas)
    function formatPhoneNumber(value) {
        if (!value) return '';
        
        if (value.length <= 2) {
            return `(${value}`;
        } else if (value.length <= 7) {
            return `(${value.slice(0, 2)}) ${value.slice(2)}`;
        } else {
            return `(${value.slice(0, 2)}) ${value.slice(2, 7)}-${value.slice(7, 11)}`;
        }
    }

    function checkPasswordMatch() {
        if (passwordInput.value && confirmPasswordInput.value) {
            if (passwordInput.value !== confirmPasswordInput.value) {
                passwordMatchFeedback.textContent = 'As senhas não coincidem';
                passwordMatchFeedback.className = 'password-match-feedback visible no-match';
                return false;
            } else {
                passwordMatchFeedback.textContent = 'As senhas coincidem';
                passwordMatchFeedback.className = 'password-match-feedback visible match';
                return true;
            }
        }
        return false;
    }

    function checkPasswordStrength(password) {
        const strength = calculatePasswordStrength(password);
        strengthBar.style.width = `${strength.percentage}%`;
        strengthBar.style.backgroundColor = strength.color;
        strengthText.textContent = strength.text;
        strengthText.style.color = strength.color;
    }

    function calculatePasswordStrength(password) {
        let strength = 0;
        
        if (password.length > 5) strength += 1;
        if (password.length > 8) strength += 1;
        if (/[A-Z]/.test(password)) strength += 1;
        if (/[0-9]/.test(password)) strength += 1;
        if (/[^A-Za-z0-9]/.test(password)) strength += 1;
        
        if (strength <= 2) {
            return { percentage: 33, color: '#ff3860', text: 'fraca' };
        } else if (strength <= 4) {
            return { percentage: 66, color: '#ffdd57', text: 'média' };
        } else {
            return { percentage: 100, color: '#09c372', text: 'forte' };
        }
    }

    function validateForm() {
        let isValid = true;
        const emailInput = document.getElementById('email');
        
        // Validar email institucional
        if (emailInput && !emailInput.value.endsWith('@fatec.sp.gov.br')) {
            emailInput.classList.add('invalid');
            alert('Por favor, use seu email institucional (@fatec.sp.gov.br)');
            isValid = false;
        }
        
        // Validar correspondência de senhas
        if (!checkPasswordMatch()) {
            isValid = false;
        }
        
        return isValid;
    }
});

// Verificar se deve mostrar mensagem de sucesso
document.addEventListener('DOMContentLoaded', function() {
    if (localStorage.getItem('showRegistrationSuccess') === 'true') {
        // Criar e mostrar mensagem
        const successMessage = document.createElement('div');
        successMessage.className = 'alert alert-success';
        successMessage.innerHTML = '<i class="fas fa-check-circle"></i> Usuário cadastrado com sucesso!';
        document.querySelector('main').prepend(successMessage);
        
        // Remover a flag para não mostrar novamente
        localStorage.removeItem('showRegistrationSuccess');
        
        // Remover a mensagem após 5 segundos
        setTimeout(() => {
            successMessage.remove();
        }, 5000);
    }
});