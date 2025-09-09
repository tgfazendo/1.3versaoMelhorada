document.addEventListener('DOMContentLoaded', function() {
    // Elementos do DOM
    const loginForm = document.getElementById('loginForm');
    const recoveryForm = document.getElementById('recoveryForm');
    const recoveryModal = document.getElementById('recoveryModal');
    const forgotPasswordLink = document.getElementById('forgotPassword');
    const modalClose = document.querySelector('.modal-close');
    const typeButtons = document.querySelectorAll('.type-btn');
    const showPasswordBtn = document.querySelector('.show-password');
    const passwordInput = document.getElementById('password');
    const recoveryFeedback = document.getElementById('recoveryFeedback');
    const emailInput = document.getElementById('email');
    const recoveryEmailInput = document.getElementById('recoveryEmail');

    let isLoading = false;

    // ================== TOGGLE DE TIPO ==================
    typeButtons.forEach(button => {
        button.addEventListener('click', function() {
            if (isLoading) return;
            typeButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
        });
    });

    // ================== SHOW/HIDE SENHA ==================
    if (showPasswordBtn && passwordInput) {
        showPasswordBtn.addEventListener('click', function() {
            const icon = this.querySelector('i');
            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                icon.classList.replace('fa-eye', 'fa-eye-slash');
            } else {
                passwordInput.type = 'password';
                icon.classList.replace('fa-eye-slash', 'fa-eye');
            }
        });
    }

    // ================== MODAL DE RECUPERAÇÃO ==================
    forgotPasswordLink.addEventListener('click', function(e) {
        e.preventDefault();
        if (isLoading) return;
        recoveryModal.classList.add('active');
        document.body.style.overflow = 'hidden';
        recoveryEmailInput.focus();
    });

    modalClose.addEventListener('click', closeModal);
    recoveryModal.addEventListener('click', function(e) {
        if (e.target === recoveryModal) closeModal();
    });
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && recoveryModal.classList.contains('active')) closeModal();
    });

    // ================== VALIDAÇÃO DE EMAIL ==================
    if (emailInput) emailInput.addEventListener('input', () => validateEmailInput(emailInput));
    if (recoveryEmailInput) recoveryEmailInput.addEventListener('input', () => validateEmailInput(recoveryEmailInput));

    // ================== LOGIN ==================
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            if (isLoading) return;

            const email = emailInput.value;
            const password = passwordInput.value;

            if (!validateFatecEmail(email)) return showError('Por favor, use seu email institucional (@fatec.sp.gov.br)');
            if (password.length < 6) return showError('A senha deve ter pelo menos 6 caracteres');

            setLoading(true);
            try {
                const data = await authenticateUser(email, password);
                const user = data.user;
                const token = data.token;

                // Salva token e usuário no localStorage
                localStorage.setItem('authToken', token);
                localStorage.setItem('currentUser', JSON.stringify(user));

                redirectUser(user.role);
            } catch (error) {
                showError(error.message);
            } finally {
                setLoading(false);
            }
        });
    }

    // ================== RECUPERAÇÃO DE SENHA ==================
    if (recoveryForm) {
        recoveryForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            if (isLoading) return;

            const email = recoveryEmailInput.value;
            if (!validateFatecEmail(email)) return showRecoveryError('Por favor, use seu email institucional (@fatec.sp.gov.br)');

            setLoading(true);
            try {
                await requestPasswordRecovery(email);
                showRecoverySuccess(`Link de recuperação enviado para: ${email}`);
                recoveryForm.reset();
                setTimeout(() => closeModal(), 3000);
            } catch (error) {
                showRecoveryError(error.message);
            } finally {
                setLoading(false);
            }
        });
    }

    // ================== FUNÇÕES DE AUTENTICAÇÃO ==================
    async function authenticateUser(email, senha) {
        const resp = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, senha })
        });

        if (!resp.ok) {
            const erro = await resp.json();
            throw new Error(erro.erro || 'Falha no login');
        }
        return await resp.json(); // { token, user: { id, nome, email, role } }
    }

    async function requestPasswordRecovery(email) {
        const resp = await fetch('/api/recuperar-senha', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });

        if (!resp.ok) {
            const erro = await resp.json();
            throw new Error(erro.erro || 'Erro ao solicitar recuperação');
        }
        return true;
    }

    async function redefinirSenha(token, novaSenha) {
        const resp = await fetch('/api/redefinir-senha', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token, novaSenha })
        });

        if (!resp.ok) {
            const erro = await resp.json();
            throw new Error(erro.erro || 'Falha ao redefinir senha');
        }
        return true;
    }

    // ================== FUNÇÕES AUXILIARES ==================
    function validateFatecEmail(email) {
        const regex = /^[a-zA-Z0-9._-]+@fatec\.sp\.gov\.br$/;
        return regex.test(email);
    }

    function validateEmailInput(input) {
        input.classList.toggle('invalid', input.value && !validateFatecEmail(input.value));
    }

    function showError(msg) {
        let el = document.querySelector('.login-error');
        if (!el) {
            el = document.createElement('div');
            el.className = 'login-error';
            loginForm.insertBefore(el, loginForm.firstChild);
        }
        el.textContent = msg;
        el.style.display = 'block';
        setTimeout(() => el.style.display = 'none', 5000);
    }

    function showRecoveryError(msg) {
        recoveryFeedback.textContent = msg;
        recoveryFeedback.className = 'error';
        recoveryFeedback.style.display = 'block';
    }

    function showRecoverySuccess(msg) {
        recoveryFeedback.textContent = msg;
        recoveryFeedback.className = 'success';
        recoveryFeedback.style.display = 'block';
    }

    function setLoading(loading) {
        isLoading = loading;
        const buttons = document.querySelectorAll('button[type="submit"]');
        buttons.forEach(btn => {
            if (loading) {
                btn.disabled = true;
                btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processando...';
            } else {
                btn.disabled = false;
                if (btn === loginForm?.querySelector('button[type="submit"]')) {
                    btn.innerHTML = '<span>Entrar</span><i class="fas fa-arrow-right"></i>';
                } else {
                    btn.innerHTML = '<span>Enviar Link</span><i class="fas fa-paper-plane"></i>';
                }
            }
        });
    }

    function closeModal() {
        recoveryModal.classList.remove('active');
        document.body.style.overflow = 'auto';
        recoveryFeedback.style.display = 'none';
        recoveryForm.reset();
    }

    function redirectUser(role) {
        const routes = {
            'professor': 'pages/professor/painel-professor.html',
            'suporte': 'pages/suporte/painel-suporte.html'
        };
        if (!routes[role]) return showError('Role de usuário desconhecido');
        window.location.href = routes[role];
    }

    function protegerRota() {
        if (!localStorage.getItem('authToken')) {
            window.location.href = 'login.html?redirect=' + encodeURIComponent(window.location.pathname);
        }
    }

    if (window.location.pathname.includes('pages/')) protegerRota();
});
