document.addEventListener('DOMContentLoaded', function() {
    // Controle do Menu Lateral
    const menuToggle = document.querySelector('.menu-toggle');
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.createElement('div');
    overlay.className = 'overlay';
    document.body.appendChild(overlay);

    menuToggle.addEventListener('click', () => {
        sidebar.classList.toggle('active');
        overlay.classList.toggle('active');
    });

    overlay.addEventListener('click', () => {
        sidebar.classList.remove('active');
        overlay.classList.remove('active');
    });
    // Clicar no perfil
    let dropdownVisible = false;

    document.querySelector('.profile-avatar').addEventListener('click', (e) => {
        e.stopPropagation();
        const dropdown = document.querySelector('.dropdown-content');
        dropdownVisible = !dropdownVisible;
        dropdown.style.display = dropdownVisible ? 'block' : 'none';
    });

    // Fechar ao clicar fora
    document.addEventListener('click', () => {
        if(dropdownVisible) {
            document.querySelector('.dropdown-content').style.display = 'none';
            dropdownVisible = false;
        }
    });
});