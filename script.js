// Removed liquid.js import

gsap.registerPlugin(ScrollTrigger);

// ==========================================
// Mobile Menu Toggle Logic
// ==========================================
const mobileMenuBtn = document.getElementById('mobile-menu-btn');
const mobileMenu = document.getElementById('mobile-menu');
const hamburgerIcon = document.getElementById('hamburger-icon');
const closeIcon = document.getElementById('close-icon');
const mobileLinks = document.querySelectorAll('.mobile-link');

if (mobileMenuBtn && mobileMenu) {
    function toggleMobileMenu() {
        const isHidden = mobileMenu.classList.contains('hidden');
        if (isHidden) {
            mobileMenu.classList.remove('hidden');
            // small delay to allow display:block to apply before opacity transition
            setTimeout(() => mobileMenu.classList.remove('opacity-0'), 10);
            hamburgerIcon.classList.add('hidden');
            closeIcon.classList.remove('hidden');
            document.body.style.overflow = 'hidden'; // Prevent background scrolling
        } else {
            mobileMenu.classList.add('opacity-0');
            setTimeout(() => {
                mobileMenu.classList.add('hidden');
            }, 300); // match duration-300
            hamburgerIcon.classList.remove('hidden');
            closeIcon.classList.add('hidden');
            document.body.style.overflow = '';
        }
    }

    mobileMenuBtn.addEventListener('click', toggleMobileMenu);

    // Close menu when a link is clicked
    mobileLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (!mobileMenu.classList.contains('hidden')) toggleMobileMenu();
        });
    });
}

// ==========================================
// Lenis Smooth Scroll Initialization
// ==========================================
const lenis = new Lenis({
  duration: 1.2,
  easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), 
  direction: 'vertical',
  gestureDirection: 'vertical',
  smooth: true,
  mouseMultiplier: 1,
  smoothTouch: false,
  touchMultiplier: 2,
  infinite: false,
});

// Synchronize Lenis scrolling with GSAP ScrollTrigger
lenis.on('scroll', ScrollTrigger.update);

gsap.ticker.add((time) => {
  lenis.raf(time * 1000);
});

gsap.ticker.lagSmoothing(0);

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

// Initialize ripples on the Gallery section (handle inverted mouse due to CSS scaleX(-1))
$('#gallery-ripple').ripples({
    resolution: 1080,
    perturbance: 0.01,
    interactive: false // Disable built-in to manually handle inverted X
});
$('#gallery').on('mousemove', function(e) {
    const $el = $('#gallery-ripple');
    let x = e.pageX - $el.offset().left;
    let y = e.pageY - $el.offset().top;
    
    // Invert X because the element is scaled by -1 horizontally
    x = $el.outerWidth() - x;

    $el.ripples('drop', x, y, 20, 0.04);
});

// Initialize ripples on the Banner section
$('#banner-ripple').ripples({
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

// ==========================================
// Unique Text Animations for Each Section (with reverse)
// ==========================================

// 1. Collection Section: Slide in from the left
const collectionText = document.querySelectorAll('#collection h2, #collection p, #collection a, #collection button');
if (collectionText.length > 0) {
    gsap.from(collectionText, {
        scrollTrigger: {
            trigger: '#collection',
            start: "top 80%",
            toggleActions: "play reverse play reverse",
        },
        x: -80,
        opacity: 0,
        duration: 1,
        stagger: 0.2,
        ease: "power3.out",
        clearProps: "all"
    });
}

// 2. Banner Section: Dramatic scale and elastic bounce
const bannerText = document.querySelectorAll('#banner h2, #banner p, #banner button');
if (bannerText.length > 0) {
    gsap.from(bannerText, {
        scrollTrigger: {
            trigger: '#banner',
            start: "top 75%",
            toggleActions: "play reverse play reverse",
        },
        scale: 0.5,
        opacity: 0,
        duration: 1.5,
        stagger: 0.2,
        ease: "elastic.out(1, 0.7)",
        clearProps: "all"
    });
}

// 3. Contact Us Section: Bouncy slide up
const contactText = document.querySelectorAll('#contact h2, #contact span, #contact p, #contact button, #contact form');
if (contactText.length > 0) {
    gsap.from(contactText, {
        scrollTrigger: {
            trigger: '#contact',
            start: "top 80%",
            toggleActions: "play reverse play reverse",
        },
        y: 80,
        opacity: 0,
        duration: 1,
        stagger: 0.1,
        ease: "back.out(1.5)",
        clearProps: "all"
    });
}

// 4. Footer Section: Smooth slow fade up
const footerText = document.querySelectorAll('footer h2, footer p, footer span');
if (footerText.length > 0) {
    gsap.from(footerText, {
        scrollTrigger: {
            trigger: 'footer',
            start: "top 95%",
            toggleActions: "play reverse play reverse",
        },
        y: 30,
        opacity: 0,
        duration: 1.5,
        stagger: 0.1,
        ease: "power2.out",
        clearProps: "all"
    });
}

// ==========================================
// Interactive Cards Hover Logic (Reference JS)
// ==========================================
const icCards = document.querySelectorAll("#interactive-cards .card");

if (icCards.length > 0) {
    icCards.forEach((card) => {
        card.addEventListener("mouseenter", () => {
            icCards.forEach((c) => {
                if (c === card) c.classList.add("active");
                else c.classList.add("not-active");
            });
        });

        card.addEventListener("mouseleave", () => {
            icCards.forEach((c) => {
                c.classList.remove("active", "not-active");
            });
        });
    });

    gsap.from("#interactive-cards h2, #interactive-cards p, #interactive-cards .card", {
        scrollTrigger: {
            trigger: '#interactive-cards',
            start: "top 75%",
            toggleActions: "play reverse play reverse",
        },
        y: 50,
        opacity: 0,
        duration: 1,
        stagger: 0.1,
        ease: "power3.out",
        clearProps: "transform,opacity" // <--- CRITICAL FIX: clear inline styles so CSS hover transform works
    });
}

