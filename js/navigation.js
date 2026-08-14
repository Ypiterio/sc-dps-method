document.addEventListener('DOMContentLoaded', () => {
    const mobileBtn = document.getElementById('mobileMenuBtn');
    const nav = document.getElementById('mainNav');
    
    if (mobileBtn && nav) {
        mobileBtn.addEventListener('click', () => {
            nav.classList.toggle('nav--open');
            mobileBtn.classList.toggle('active');
        });
    }
    
    document.querySelectorAll('.nav__link').forEach(link => {
        link.addEventListener('click', () => {
            if (nav) nav.classList.remove('nav--open');
            if (mobileBtn) mobileBtn.classList.remove('active');
        });
    });
});