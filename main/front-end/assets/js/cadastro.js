document.addEventListener("DOMContentLoaded", function () {
  // 🔗 URL do backend
  const API_URL = "https://bdd339d3-9d30-4502-bb65-c2df41043c71-00-19kadynhvjmtz.spock.replit.dev/api"; // Inclui /api

  // Elementos do DOM
  const registerForm = document.getElementById("registerForm");
  const typeButtons = document.querySelectorAll(".type-btn");
  const showPasswordBtns = document.querySelectorAll(".show-password");
  const passwordInput = document.getElementById("password");
  const confirmPasswordInput = document.getElementById("confirmPassword");
  const passwordMatchFeedback = document.querySelector(".password-match-feedback");
  const strengthBar = document.querySelector(".strength-bar");
  const strengthText = document.querySelector(".strength-text strong");
  const phoneInput = document.getElementById("phone");
  const submitBtn = document.querySelector(".btn-submit");

  // Máscara para telefone
  if (phoneInput) {
      phoneInput.addEventListener("input", function (e) {
          const value = e.target.value.replace(/\D/g, "");
          const formattedValue = formatPhoneNumber(value);
          e.target.value = formattedValue;
      });
  }

  // Toggle de tipo de usuário (apenas visual)
  typeButtons.forEach((button) => {
      button.addEventListener("click", function () {
          typeButtons.forEach((btn) => btn.classList.remove("active"));
          this.classList.add("active");
      });
  });

  // Mostrar/ocultar senha
  showPasswordBtns.forEach((btn) => {
      btn.addEventListener("click", function () {
          const input = this.parentElement.querySelector("input");
          const icon = this.querySelector("i");

          if (input.type === "password") {
              input.type = "text";
              icon.classList.replace("fa-eye", "fa-eye-slash");
          } else {
              input.type = "password";
              icon.classList.replace("fa-eye-slash", "fa-eye");
          }
      });
  });

  // Verificar correspondência de senhas
  if (confirmPasswordInput) {
      confirmPasswordInput.addEventListener("input", checkPasswordMatch);
  }

  // Medidor de força da senha
  if (passwordInput) {
      passwordInput.addEventListener("input", function () {
          checkPasswordStrength(this.value);
          checkPasswordMatch();
      });
  }

  // Validação do formulário e envio
  if (registerForm) {
      registerForm.addEventListener("submit", function (e) {
          e.preventDefault();

          if (validateForm()) {
              submitBtn.disabled = true;
              submitBtn.innerHTML =
                  '<i class="fas fa-spinner fa-spin"></i> Cadastrando...';

              // Criar objeto com os dados do formulário (sem enviar role)
              const formData = {
                  nome: document.getElementById("fullName").value,
                  email: document.getElementById("email").value,
                  senha: document.getElementById("password").value,
                  matricula: document.getElementById("employeeId").value
              };

              // Enviar para o backend
              fetch(`${API_URL}/cadastro`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(formData),
              })
                  .then(async (response) => {
                      if (!response.ok) {
                          const error = await response.json();
                          throw new Error(error.message || "Erro no servidor");
                      }
                      return response.json();
                  })
                  .then((data) => {
                      console.log("Cadastro realizado:", data);
                      localStorage.setItem("showRegistrationSuccess", "true");
                      window.location.href = "login.html";
                  })
                  .catch((error) => {
                      console.error("Erro no cadastro:", error);
                      alert(error.message || "Ocorreu um erro no cadastro. Por favor, tente novamente.");
                      submitBtn.disabled = false;
                      submitBtn.innerHTML =
                          '<i class="fas fa-save"></i> Cadastrar Usuário';
                  });
          }
      });
  }

  // ---------------- Funções auxiliares ----------------

  function formatPhoneNumber(value) {
      if (!value) return "";

      if (value.length <= 2) return `(${value}`;
      else if (value.length <= 7) return `(${value.slice(0, 2)}) ${value.slice(2)}`;
      else return `(${value.slice(0, 2)}) ${value.slice(2, 7)}-${value.slice(7, 11)}`;
  }

  function checkPasswordMatch() {
      if (passwordInput.value && confirmPasswordInput.value) {
          if (passwordInput.value !== confirmPasswordInput.value) {
              passwordMatchFeedback.textContent = "As senhas não coincidem";
              passwordMatchFeedback.className = "password-match-feedback visible no-match";
              return false;
          } else {
              passwordMatchFeedback.textContent = "As senhas coincidem";
              passwordMatchFeedback.className = "password-match-feedback visible match";
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

      if (strength <= 2) return { percentage: 33, color: "#ff3860", text: "fraca" };
      else if (strength <= 4) return { percentage: 66, color: "#ffdd57", text: "média" };
      else return { percentage: 100, color: "#09c372", text: "forte" };
  }

  function validateForm() {
      let isValid = true;
      const emailInput = document.getElementById("email");

      if (emailInput && !emailInput.value.endsWith("@fatec.sp.gov.br")) {
          emailInput.classList.add("invalid");
          alert("Por favor, use seu email institucional (@fatec.sp.gov.br)");
          isValid = false;
      }

      if (!checkPasswordMatch()) isValid = false;

      return isValid;
  }
});

// Mostrar mensagem de sucesso após cadastro
document.addEventListener("DOMContentLoaded", function () {
  if (localStorage.getItem("showRegistrationSuccess") === "true") {
      const successMessage = document.createElement("div");
      successMessage.className = "alert alert-success";
      successMessage.innerHTML =
          '<i class="fas fa-check-circle"></i> Usuário cadastrado com sucesso!';
      document.querySelector("main").prepend(successMessage);

      localStorage.removeItem("showRegistrationSuccess");

      setTimeout(() => successMessage.remove(), 5000);
  }
});
