// Removed liquid.js import

gsap.registerPlugin(ScrollTrigger);

// Create a main timeline tied to ScrollTrigger to ensure all animations reverse together
const tl = gsap.timeline({
    scrollTrigger: {
        trigger: "main",
        start: "top 90%",
        toggleActions: "play none none none", // Do not reverse when scrolling down
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
const title1 = document.getElementById('hero-title-1');
const title2 = document.getElementById('hero-title-2');
const desc = document.getElementById('hero-desc');

const slidesData = [
    {
        bottles: [
            './assets/Bottle/Restaurant/bottle_1.webp',
            './assets/Bottle/Restaurant/bottle_2.webp',
            './assets/Bottle/Restaurant/bottle_3.webp'
        ],
        bgUrl: './assets/Hero_bg/Hero_bg_1.png',
        title1: 'CRAFTED FOR <br> GREAT FOOD.',
        title2: 'PURE BY NATURE..',
        desc: 'FIST-O Brings You Premium Packaged Drinking Water With 7-Stage Purification, Minerals Balance And 100% Trust.'
    },
    {
        bottles: [
            './assets/Bottle/Airlines/bottle_4.webp',
            './assets/Bottle/Airlines/bottle_5.webp',
            './assets/Bottle/Airlines/bottle_6.webp'
        ],
        bgUrl: './assets/Hero_bg/Hero_bg_2.png',
        title1: 'REFRESH YOUR <br> EVERYDAY.',
        title2: 'CRISP & CLEAR..',
        desc: 'Stay hydrated with our premium quality water, perfectly balanced for your active lifestyle.'
    },
    {
        bottles: [
            './assets/Bottle/Bus/bottle_7.webp',
            './assets/Bottle/Bus/bottle_8.webp',
            './assets/Bottle/Bus/bottle_9.webp'
        ],
        bgUrl: './assets/Hero_bg/Hero_bg_3.png',
        title1: 'VITALITY IN <br> EVERY DROP.',
        title2: 'MINERAL RICH..',
        desc: 'Enhanced with essential minerals to give you the perfect boost of energy and wellness.'
    },
    {
        bottles: [
            './assets/Bottle/Retail/bottle_10.webp',
            './assets/Bottle/Retail/bottle_11.webp',
            './assets/Bottle/Retail/bottle_12.webp'
        ],
        bgUrl: './assets/Hero_bg/Hero_bg_4.png',
        title1: 'ESSENCE OF <br> PURITY.',
        title2: 'SIMPLY BEST..',
        desc: 'Experience the pristine taste of naturally filtered water, untouched and pure as nature intended.'
    }
];

let currentIndex = 0;
let currentBottleIndex = 0;
let slideTimeout;
let isAnimating = false; // Prevent spam clicking

// Initialize jQuery Ripples Background on the main element so it captures all hover events
const heroCanvas = $('main');
heroCanvas.css({
    'background-image': `url(${slidesData[0].bgUrl})`,
    'background-size': 'cover',
    'background-position': 'center'
});
heroCanvas.ripples({
    resolution: 1080,
    perturbance: 0.01,
    interactive: true
});

// Initialize ripples on the Collection section independently
$('#collection').ripples({
    resolution: 1080,
    perturbance: 0.01,
    interactive: true
});

function scheduleNextStep() {
    clearTimeout(slideTimeout);
    slideTimeout = setTimeout(nextStep, 2000);
}

function nextStep() {
    if (isAnimating) {
        scheduleNextStep();
        return;
    }
    
    currentBottleIndex++;
    
    if (currentBottleIndex >= slidesData[currentIndex].bottles.length) {
        // Change category
        nextSlide();
    } else {
        // Change bottle
        changeBottle(slidesData[currentIndex].bottles[currentBottleIndex]);
    }
}

function changeBottle(newSrc) {
    // Create a clone of the current bottle for crossfading
    const clone = bottleImg.cloneNode(true);
    clone.removeAttribute('id'); // Avoid duplicate IDs
    clone.classList.add('absolute', 'top-0', 'left-0', 'w-full', 'h-full', 'z-10');
    
    // Append clone to overlay the original
    bottleImg.parentNode.appendChild(clone);
    
    // Update the original image to the new source and hide it initially
    bottleImg.src = newSrc;
    gsap.set(bottleImg, { opacity: 0 });
    
    // Fade in the new image
    gsap.to(bottleImg, {
        opacity: 1,
        duration: 0.6,
        ease: "power2.inOut"
    });
    
    // Fade out the old image (clone)
    gsap.to(clone, {
        opacity: 0,
        duration: 0.6,
        ease: "power2.inOut",
        onComplete: () => {
            clone.remove(); // Clean up clone
            scheduleNextStep();
        }
    });
}

function updateSlider(index) {
    if (isAnimating) return;
    isAnimating = true;
    
    clearTimeout(slideTimeout);
    
    const nextSlide = slidesData[index];
    currentIndex = index;
    currentBottleIndex = 0;

    // Crossfade ripples background on hero
    const newOverlay = $('<div class="absolute inset-0 w-full h-full bg-cover bg-center z-[0]" style="opacity:0;"></div>');
    newOverlay.css('background-image', `url(${nextSlide.bgUrl})`);
    heroCanvas.append(newOverlay);
    
    newOverlay.animate({opacity: 1}, 400, function() {
        heroCanvas.ripples('destroy');
        heroCanvas.css('background-image', `url(${nextSlide.bgUrl})`);
        heroCanvas.ripples({
            resolution: 1080,
            perturbance: 0.01,
            interactive: true
        });
        newOverlay.remove();
    });

    // Fade out text with a slight slide
    gsap.to([title1, title2, desc], {
        opacity: 0, 
        x: -20,
        duration: 0.3, 
        ease: "power1.in"
    });

    // Fade out bottle dynamically
    gsap.to(bottleImg, {
        opacity: 0, 
        scale: 0.5,
        y: 50,
        duration: 0.4, 
        ease: "power2.in",
        onComplete: () => {
            // Swap text and bottle content
            bottleImg.src = nextSlide.bottles[0];
            title1.innerHTML = nextSlide.title1;
            title2.innerHTML = nextSlide.title2;
            desc.innerHTML = nextSlide.desc;
            
            currentSlideEl.innerText = `0${index + 1}`;
            
            // Setup text and bottle for entrance
            gsap.set([title1, title2, desc], { x: 20 });
            gsap.set(bottleImg, { scale: 1.2, y: -50, rotation: 0 });
            
            // Stagger text in
            gsap.to([title1, title2, desc], {
                opacity: 1, 
                x: 0,
                duration: 0.5,
                stagger: 0.1,
                ease: "power2.out"
            });

            // Bounce bottle in
            gsap.to(bottleImg, {
                opacity: 1, 
                scale: 1,
                y: 0,
                duration: 0.8,
                ease: "elastic.out(1, 0.75)",
                onComplete: () => {
                    isAnimating = false;
                    scheduleNextStep();
                }
            });
        }
    });
}

function nextSlide() {
    if (isAnimating) return;
    let nextIndex = (currentIndex + 1) % slidesData.length;
    updateSlider(nextIndex);
}

function prevSlide() {
    if (isAnimating) return;
    let prevIndex = (currentIndex - 1 + slidesData.length) % slidesData.length;
    updateSlider(prevIndex);
}

// Event Listeners for manual navigation
if (nextBtn && prevBtn) {
    nextBtn.addEventListener('click', () => {
        clearTimeout(slideTimeout);
        nextSlide();
    });
    prevBtn.addEventListener('click', () => {
        clearTimeout(slideTimeout);
        prevSlide();
    });
}

// Start auto slider on load
scheduleNextStep();

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
    
    let cardInterval;

    function nextCard() {
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
                // Snap it to its new back position invisibly, then fade it in
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
    }

    function startCardInterval() {
        cardInterval = setInterval(nextCard, 2500); // Automatically cycle every 2.5 seconds
    }

    cardStackContainer.addEventListener('click', () => {
        clearInterval(cardInterval);
        nextCard();
        startCardInterval();
    });

    startCardInterval();
}

// ==========================================
// Gallery Infinite Scroll Animation
// ==========================================
// Column 1 moves UP continuously
gsap.to('.gallery-col-1', {
    yPercent: -50, // Moves up by exactly 50% (one full set of the duplicated images)
    ease: 'none',
    duration: 35,  // Slow, smooth continuous movement
    repeat: -1     // Infinite loop
});

// Column 2 moves DOWN continuously
// First, offset it to start at -50% so it can move down to 0
gsap.set('.gallery-col-2', { yPercent: -50 });
gsap.to('.gallery-col-2', {
    yPercent: 0,
    ease: 'none',
    duration: 40,  // Slightly different speed for variation
    repeat: -1
});
