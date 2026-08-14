document.addEventListener('DOMContentLoaded', () => {
    initParticles();
    initTabs();
    initCardAnimation();
    initSidebarToggle();
    initScrollSpy();
    handleImageErrors();
});

function initParticles() {
    const canvas = document.getElementById('particles');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    function resizeParticles() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    resizeParticles();
    window.addEventListener('resize', resizeParticles);

    const particles = [];
    for (let i = 0; i < 120; i++) {
        particles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            r: Math.random() * 2 + 1,
            dx: (Math.random() - 0.5) * 0.3,
            dy: (Math.random() - 0.5) * 0.3,
        });
    }

    let mousePX = canvas.width / 2, mousePY = canvas.height / 2;
    document.addEventListener('mousemove', (e) => {
        mousePX = e.clientX;
        mousePY = e.clientY;
    });

    function animateParticles() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach(p => {
            p.x += p.dx;
            p.y += p.dy;
            if (p.x < 0 || p.x > canvas.width) p.dx *= -1;
            if (p.y < 0 || p.y > canvas.height) p.dy *= -1;

            const dist = Math.hypot(mousePX - p.x, mousePY - p.y);
            if (dist < 150) {
                const angle = Math.atan2(p.y - mousePY, p.x - mousePX);
                const force = (150 - dist) / 150 * 0.15;
                p.dx += Math.cos(angle) * force;
                p.dy += Math.sin(angle) * force;
                const speed = Math.hypot(p.dx, p.dy);
                if (speed > 2) {
                    p.dx = (p.dx / speed) * 2;
                    p.dy = (p.dy / speed) * 2;
                }
            }

            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(56, 189, 248, 0.5)';
            ctx.fill();
        });
        requestAnimationFrame(animateParticles);
    }
    animateParticles();
}

function initTabs() {
    const tabsBtns = document.querySelectorAll('.tabs__btn');
    
    tabsBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const parent = btn.closest('.tabs');
            const targetId = btn.getAttribute('data-tab');
            
            if (!parent) return;
            
            parent.querySelectorAll('.tabs__btn').forEach(b => b.classList.remove('active'));
            parent.querySelectorAll('.tabs__content').forEach(c => c.classList.remove('active'));
            
            btn.classList.add('active');
            const target = document.getElementById(targetId);
            if (target) target.classList.add('active');
        });
    });
}

function initCardAnimation() {
    const cards = document.querySelectorAll('.card');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, {
        threshold: 0.05,
        rootMargin: '0px 0px -50px 0px'
    });
    
    cards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        card.style.transition = `opacity 0.5s ease ${index * 0.08}s, transform 0.5s ease ${index * 0.08}s`;
        observer.observe(card);
    });
}

function initSidebarToggle() {
    const toggleBtn = document.getElementById('sidebarToggle');
    const sidebar = document.getElementById('sidebar');
    
    if (!toggleBtn || !sidebar) return;
    
    toggleBtn.addEventListener('click', () => {
        sidebar.classList.toggle('sidebar--open');
    });
    
    document.addEventListener('click', (e) => {
        if (window.innerWidth <= 768) {
            const isClickInside = sidebar.contains(e.target) || toggleBtn.contains(e.target);
            if (!isClickInside) {
                sidebar.classList.remove('sidebar--open');
            }
        }
    });
    
    sidebar.querySelectorAll('.sidebar__link').forEach(link => {
        link.addEventListener('click', () => {
            if (window.innerWidth <= 768) {
                sidebar.classList.remove('sidebar--open');
            }
        });
    });
}

function initScrollSpy() {
    const sections = document.querySelectorAll('.section');
    const links = document.querySelectorAll('.sidebar__link');
    
    if (sections.length === 0 || links.length === 0) return;
    
    window.addEventListener('scroll', () => {
        let current = '';
        const scrollPos = window.scrollY + 150;
        
        sections.forEach(section => {
            const offset = section.offsetTop;
            const height = section.offsetHeight;
            
            if (scrollPos >= offset && scrollPos < offset + height) {
                current = section.id;
            }
        });
        
        links.forEach(link => {
            link.classList.remove('active');
            const href = link.getAttribute('href');
            if (href === `#${current}`) {
                link.classList.add('active');
            }
        });
    });
}

function handleImageErrors() {
    document.querySelectorAll('img').forEach(img => {
        img.addEventListener('error', () => {
            img.style.display = 'none';
        });
    });
}

window.copyCode = function(button) {
    const block = button.closest('.code-block');
    if (!block) return;
    
    const code = block.querySelector('.code-block__content');
    if (!code) return;
    
    const text = code.textContent.trim();
    
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => {
            showCopyFeedback(button, '✅ Скопировано!');
        }).catch(() => {
            fallbackCopy(text, button);
        });
    } else {
        fallbackCopy(text, button);
    }
};

function fallbackCopy(text, button) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    textarea.style.pointerEvents = 'none';
    document.body.appendChild(textarea);
    textarea.select();
    
    try {
        document.execCommand('copy');
        showCopyFeedback(button, '✅ Скопировано!');
    } catch (e) {
        showCopyFeedback(button, '❌ Ошибка');
    }
    
    textarea.remove();
}

function showCopyFeedback(button, message) {
    const originalText = button.textContent;
    button.textContent = message;
    button.style.color = '#22c55e';
    
    setTimeout(() => {
        button.textContent = originalText;
        button.style.color = '';
    }, 2000);
}

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        const href = this.getAttribute('href');
        if (href === '#') return;
        
        const target = document.querySelector(href);
        if (target) {
            e.preventDefault();
            const headerOffset = 80;
            const elementPosition = target.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
            
            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
        }
    });
});