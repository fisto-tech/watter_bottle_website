gsap.registerPlugin(ScrollTrigger);

// Create a main timeline tied to ScrollTrigger to ensure all animations reverse together
const tl = gsap.timeline({
    scrollTrigger: {
        trigger: "main",
        start: "top 90%",
        toggleActions: "play reverse play reverse",
    }
});

// 1. Navbar items (Slide down from top)
tl.from('nav h1, nav > div.hidden > a, nav button', {
    y: -20,
    opacity: 0,
    duration: 0.6,
    stagger: 0.05,
    ease: "power2.out"
})
// 2. Left Panel Headings (Slide in from left)
.from('main h2', {
    x: -40,
    opacity: 0,
    duration: 0.7,
    stagger: 0.1,
    ease: "power3.out"
}, "-=0.3") // start 0.3s before previous animation ends
// 3. Left Panel Paragraph (Slide up)
.from('main p', {
    y: 20,
    opacity: 0,
    duration: 0.6,
    ease: "power2.out"
}, "-=0.4")
// 4. Features Text (Subtle scale up)
.from('.text-\\[8px\\]', {
    scale: 0.8,
    opacity: 0,
    duration: 0.5,
    stagger: 0.05,
    ease: "back.out(1.5)"
}, "-=0.3")
// 5. Right Card Texts (Slide in from right)
.from('main h3, main li', {
    x: 30,
    opacity: 0,
    duration: 0.6,
    stagger: 0.05,
    ease: "power2.out"
}, "-=0.4");

// ==========================================
// Image Slider Logic
// ==========================================
const bottleImg = document.getElementById('hero-bottle');
const currentSlideEl = document.getElementById('current-slide');
const prevBtn = document.getElementById('prev-slide');
const nextBtn = document.getElementById('next-slide');
const heroBg = document.getElementById('hero-bg');
const title1 = document.getElementById('hero-title-1');
const title2 = document.getElementById('hero-title-2');
const desc = document.getElementById('hero-desc');

const slidesData = [
    {
        bottle: './assets/Bottle/bottle_1.png',
        bg: 'url("./assets/Hero_bg/Hero_bg_1.png")',
        title1: 'CRAFTED FOR <br> GREAT FOOD.',
        title2: 'PURE BY NATURE..',
        desc: 'FIST-O Brings You Premium Packaged Drinking Water With 7-Stage Purification, Minerals Balance And 100% Trust.'
    },
    {
        bottle: './assets/Bottle/bottle_2.png',
        bg: 'url("./assets/Hero_bg/Hero_bg_2.png")',
        title1: 'REFRESH YOUR <br> EVERYDAY.',
        title2: 'CRISP & CLEAR..',
        desc: 'Stay hydrated with our premium quality water, perfectly balanced for your active lifestyle.'
    },
    {
        bottle: './assets/Bottle/bottle_3.png',
        bg: 'url("./assets/Hero_bg/Hero_bg_3.png")',
        title1: 'VITALITY IN <br> EVERY DROP.',
        title2: 'MINERAL RICH..',
        desc: 'Enhanced with essential minerals to give you the perfect boost of energy and wellness.'
    },
    {
        bottle: './assets/Bottle/bottle_4.png',
        bg: 'url("./assets/Hero_bg/Hero_bg_4.png")',
        title1: 'ESSENCE OF <br> PURITY.',
        title2: 'SIMPLY BEST..',
        desc: 'Experience the pristine taste of naturally filtered water, untouched and pure as nature intended.'
    }
];

let currentIndex = 0;
let slideInterval;
let isAnimating = false; // Prevent spam clicking

function updateSlider(index) {
    if (isAnimating) return;
    isAnimating = true;
    
    const nextSlide = slidesData[index];

    // Create a temporary div for smooth background crossfade (avoids white flash)
    const tempBg = document.createElement('div');
    tempBg.className = 'absolute inset-0 w-full h-full bg-cover bg-center z-[-1]';
    tempBg.style.backgroundImage = nextSlide.bg;
    tempBg.style.opacity = 0;
    heroBg.parentNode.insertBefore(tempBg, heroBg.nextSibling);

    // Crossfade the new background ON TOP of the old one
    gsap.to(tempBg, {
        opacity: 1,
        duration: 0.8,
        ease: "power2.inOut",
        onComplete: () => {
            heroBg.style.backgroundImage = nextSlide.bg;
            tempBg.remove();
        }
    });

    // Fade out text and bottle
    gsap.to([bottleImg, title1, title2, desc], {
        opacity: 0, 
        y: 15,
        duration: 0.3, 
        ease: "power1.in",
        onComplete: () => {
            // Swap text and bottle content
            bottleImg.src = nextSlide.bottle;
            title1.innerHTML = nextSlide.title1;
            title2.innerHTML = nextSlide.title2;
            desc.innerHTML = nextSlide.desc;
            
            currentSlideEl.innerText = `0${index + 1}`;
            
            // Fade back in
            gsap.to([bottleImg, title1, title2, desc], {
                opacity: 1, 
                y: 0,
                duration: 0.5,
                ease: "power2.out",
                onComplete: () => {
                    isAnimating = false;
                }
            });
        }
    });
}

function nextSlide() {
    if (isAnimating) return;
    currentIndex = (currentIndex + 1) % slidesData.length;
    updateSlider(currentIndex);
    resetInterval();
}

function prevSlide() {
    if (isAnimating) return;
    currentIndex = (currentIndex - 1 + slidesData.length) % slidesData.length;
    updateSlider(currentIndex);
    resetInterval();
}

function startInterval() {
    slideInterval = setInterval(nextSlide, 4500); // Auto slide every 4.5 seconds
}

function resetInterval() {
    clearInterval(slideInterval);
    startInterval();
}

// Event Listeners for manual navigation
if (nextBtn && prevBtn) {
    nextBtn.addEventListener('click', nextSlide);
    prevBtn.addEventListener('click', prevSlide);
}

// Start auto slider on load
startInterval();

// ==========================================
// Collection Card Stack Logic
// ==========================================
const cardStackContainer = document.getElementById('card-stack-container');
let stackedCards = Array.from(document.querySelectorAll('.stacked-card'));

function initCards() {
    stackedCards.forEach((card, i) => {
        gsap.set(card, {
            y: -i * 45,
            scale: 1 - (i * 0.05),
            zIndex: stackedCards.length - i,
            opacity: 1
        });
    });
}

if (stackedCards.length > 0) {
    initCards();
    
    cardStackContainer.addEventListener('click', () => {
        // Prevent spam clicking while animating
        if (gsap.isTweening(stackedCards[0])) return; 
        
        // Pop the front card and move it to the back of the array
        const frontCard = stackedCards.shift();
        stackedCards.push(frontCard);
        
        // 1. Animate the front card flying up and fading out
        gsap.to(frontCard, {
            y: -300,
            scale: 0.85,
            opacity: 0,
            duration: 0.35,
            ease: "power2.in",
            onComplete: () => {
                // Snap it to its new back position (index 5) invisibly, then fade it in
                const newIndex = stackedCards.length - 1;
                gsap.set(frontCard, { 
                    y: -newIndex * 45, 
                    scale: 1 - (newIndex * 0.05),
                    zIndex: 1 
                });
                gsap.to(frontCard, { opacity: 1, duration: 0.3 });
            }
        });
        
        // 2. Animate the rest of the cards stepping forward
        stackedCards.forEach((card, i) => {
            if (i === stackedCards.length - 1) return; // Skip the card we just handled
            
            gsap.to(card, {
                y: -i * 45,
                scale: 1 - (i * 0.05),
                zIndex: stackedCards.length - i,
                duration: 0.5,
                ease: "back.out(1.2)",
                delay: 0.1 // Slight delay makes it feel like it waits for the front card to clear
            });
        });
    });
}
