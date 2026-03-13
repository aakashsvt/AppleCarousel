var Carousel = (function () {

    // -------------------------
    // State
    // -------------------------

    var state = {
        container: undefined,
        totalCards: 15,
        maxCards: 100,
        radiusMultiplier: 1.2, // Adjusts how far cards are from center
        radius: 0,
        axis: "y",
        generateCards: true,
        showBackface: true,
        generateColors: true,
        currentPos: 0,
        rotation: 0,
        targetRotation: 0,
        rotationSpeed: 0.5,
        autoRotate: true,
        snap: true,
        isDragging: false,
        gui: null,
        posController: null,
        autoRotateSpeed: 0.2,
        velocity: 0,
        friction: 0.95,
        lastMouseX: 0,
        currentMouseX: 0,
        isSpinning: false
    };

    var AXIS_ROTATION = { x: "rotateX", y: "rotateY" };

    // -------------------------
    // DOM Helpers
    // -------------------------

    function getChildren(el) {
        return el.children;
    }

    function addCSSClass(el, className) {
        el.classList.add(className);
    }

    function removeCSSClass(el, className) {
        el.classList.remove(className);
    }

    // -------------------------
    // Layout / Render
    // -------------------------

    function calculateRadius() {
        var container = state.container;
        var nodeSize = container[state.axis === "x" ? "offsetHeight" : "offsetWidth"];
        // Standard formula for radius based on chord length (nodeSize)
        var baseRadius = (nodeSize / 2) / Math.tan(Math.PI / state.totalCards);
        state.radius = baseRadius * state.radiusMultiplier;
    }

    function renderCarousel() {
        var container = state.container;
        var sliceAngle = 360 / state.totalCards;

        calculateRadius();

        for (var i = 0; i < state.totalCards; i++) {
            var angle = sliceAngle * i;
            var card = container.children[i];

            if (!card) continue;
            card.style.display = "block";

            if (state.generateColors && !card.style.backgroundColor)
                card.style.backgroundColor = "hsla(" + angle + ", 70%, 50%, 1)";

            // Position card
            card.style.transform =
                AXIS_ROTATION[state.axis] + "(" + (angle * (state.axis === "y" ? 1 : -1)) + "deg) " +
                "translateZ(" + state.radius + "px)";
        }

        // Hide unused cards
        for (var j = state.totalCards; j < container.children.length; j++) {
            container.children[j].style.display = "none";
        }

        updateContainerTransform();
    }

    function updateContainerTransform() {
        state.container.style.transform =
            "translateZ(-" + state.radius + "px) " +
            AXIS_ROTATION[state.axis] + "(" + state.rotation + "deg)";
    }

    // -------------------------
    // Animation Logic
    // -------------------------

    function animate() {
        if (!state.isDragging && !state.isSpinning) {
            if (state.autoRotate) {
                state.velocity += (state.autoRotateSpeed - state.velocity) * 0.05;
                state.rotation += state.velocity;
            } else {
                state.velocity *= state.friction;
                state.rotation += state.velocity;

                // Snap logic if enabled and velocity is low
                if (state.snap && Math.abs(state.velocity) < 0.1) {
                    snapToClosest();
                }
            }
        }

        updateContainerTransform();
        updateCurrentPos();
        requestAnimationFrame(animate);
    }

    function updateCurrentPos() {
        var sliceAngle = 360 / state.totalCards;
        // Calculate current index based on rotation
        var normalizedRotation = ((-state.rotation % 360) + 360) % 360;
        var index = Math.round(normalizedRotation / sliceAngle) % state.totalCards;
        
        // Internal index is 0-based, GUI is 1-based
        var guiIndex = index + 1;
        
        if (state.currentPos !== guiIndex) {
            state.currentPos = guiIndex;
            if (state.posController) state.posController.updateDisplay();
        }
    }

    function snapToClosest() {
        var sliceAngle = 360 / state.totalCards;
        var targetRotation = Math.round(state.rotation / sliceAngle) * sliceAngle;
        
        gsap.to(state, {
            rotation: targetRotation,
            duration: 0.5,
            ease: "power2.out",
            onUpdate: updateContainerTransform
        });
        state.velocity = 0;
    }

    // -------------------------
    // Interaction
    // -------------------------

    function handleDragStart(e) {
        state.isDragging = true;
        state.isSpinning = false;
        state.lastMouseX = e.pageX || e.touches[0].pageX;
        state.velocity = 0;
        gsap.killTweensOf(state);
    }

    function handleDragMove(e) {
        if (!state.isDragging) return;
        
        var x = e.pageX || e.touches[0].pageX;
        var deltaX = x - state.lastMouseX;
        state.lastMouseX = x;
        var speedFactor = 15 / state.totalCards;
        state.velocity = deltaX * state.rotationSpeed * speedFactor;
        state.rotation += state.velocity;
        updateContainerTransform();
    }

    function handleDragEnd() {
        state.isDragging = false;
    }

    // -------------------------
    // Special Actions
    // -------------------------

    function spinToCard(index) {
        state.isSpinning = true;
        state.autoRotate = false;
        
        var sliceAngle = 360 / state.totalCards;
        var currentRotation = state.rotation;
        
        var spins = 2 + Math.floor(Math.random() * 3);
        var targetRotation = -(index * sliceAngle) - (spins * 360);
        var normalizedCurrent = currentRotation % 360;
        var baseRotation = currentRotation - normalizedCurrent;
        targetRotation = baseRotation + (targetRotation % 360) - (spins * 360);

        gsap.to(state, {
            rotation: targetRotation,
            duration: 3,
            ease: "expo.inOut",
            onUpdate: updateContainerTransform,
            onComplete: function() {
                state.isSpinning = false;
                state.rotation = targetRotation;
                state.currentPos = index;
                if (state.posController) state.posController.updateDisplay();
            }
        });
    }

    // -------------------------
    // Navigation
    // -------------------------

    function goToCard(index) {
        state.isSpinning = true;
        state.autoRotate = false;
        
        var sliceAngle = 360 / state.totalCards;
        var currentRotation = state.rotation;
        
        var spins = 2 + Math.floor(Math.random() * 3);
        
        var targetAngle = -(index * sliceAngle);
        
        var targetRotation = targetAngle - (spins * 360);
        
        var baseRotation = Math.floor(currentRotation / 360) * 360;
        targetRotation = baseRotation + (targetRotation % 360) - (spins * 360);

        gsap.to(state, {
            rotation: targetRotation,
            duration: 3,
            ease: "expo.inOut",
            onUpdate: updateContainerTransform,
            onComplete: function() {
                state.isSpinning = false;
                state.rotation = targetRotation;
                state.currentPos = index + 1; // For GUI display (1-based)
                if (state.posController) state.posController.updateDisplay();
            }
        });
    }

    // -------------------------
    // GUI Setup
    // -------------------------

    function setupGUI() {
        if (state.gui) state.gui.destroy();

        var gui = new lil.GUI({ title: "Carousel Controls" });
        state.gui = gui;

        gui.add(state, "totalCards", 2, 50, 1)
            .name("Total Cards")
            .onChange(function(val) {
                rebuildCards();
                renderCarousel();
                // Update the range of the currentPos controller
                if (state.posController) {
                    state.posController.max(val);
                    if (state.currentPos > val) {
                        state.currentPos = val;
                        state.posController.updateDisplay();
                    }
                }
            });

        // Use 1-based indexing for the GUI to match card labels
        state.currentPos = 1; 
        state.posController = gui.add(state, "currentPos", 1, state.totalCards, 1)
            .name("Go to Card #")
            .listen()
            .onChange(function(val) {
                // Convert 1-based GUI value to 0-based index for logic
                goToCard(val - 1);
            });

        gui.add(state, "radiusMultiplier", 0.5, 3, 0.1)
            .name("Radius Space")
            .onChange(renderCarousel);

        gui.add(state, "rotationSpeed", 0.1, 2, 0.1)
            .name("Drag Speed");

        gui.add(state, "autoRotate")
            .name("Auto Rotate");

        gui.add(state, "autoRotateSpeed", -2, 2, 0.1)
            .name("Auto Rotate Speed");

        gui.add(state, "snap")
            .name("Snap to Card");

        gui.add({ spin: function() {
            var randomCard = Math.floor(Math.random() * state.totalCards);
            spinToCard(randomCard);
        }}, "spin").name("Random Spin");

        gui.add(state, "showBackface")
            .name("Show Backface")
            .onChange(function(val) {
                if (val) removeCSSClass(state.container, "backface");
                else addCSSClass(state.container, "backface");
            });
    }

    function rebuildCards() {
        var container = state.container;
        container.innerHTML = "";
        for (var i = 0; i < state.totalCards; i++) {
            var card = document.createElement("figure");
            card.innerHTML = "<span>" + (i + 1) + "</span>";
            container.appendChild(card);
        }
    }

    function handleWheel(e) {
        // Prevent default to avoid page scrolling
        e.preventDefault();
        
        // Kill any ongoing tweens
        gsap.killTweensOf(state);
        state.isSpinning = false;

        // Base speed factor for wheel
        var wheelSpeed = 0.05;
        var speedFactor = 15 / state.totalCards;
        
        state.velocity = e.deltaY * wheelSpeed * state.rotationSpeed * speedFactor;
        state.rotation += state.velocity;
        updateContainerTransform();
    }

    // -------------------------
    // Init
    // -------------------------

    function init(options) {
        state.container = options.elem;
        state.totalCards = options.nodes || state.totalCards;
        state.generateCards = options.generateElems !== undefined ? options.generateElems : state.generateCards;
        state.showBackface = options.displayBackface !== undefined ? options.displayBackface : state.showBackface;

        if (state.generateCards) {
            rebuildCards();
        }

        if (!state.showBackface) addCSSClass(state.container, "backface");

        // Global listeners for "swipe from anywhere"
        window.addEventListener("mousedown", handleDragStart);
        window.addEventListener("mousemove", handleDragMove);
        window.addEventListener("mouseup", handleDragEnd);
        window.addEventListener("touchstart", handleDragStart, { passive: false });
        window.addEventListener("touchmove", handleDragMove, { passive: false });
        window.addEventListener("touchend", handleDragEnd);
        window.addEventListener("wheel", handleWheel, { passive: false });

        window.addEventListener("resize", renderCarousel);

        renderCarousel();
        setupGUI();
        animate();

        return this;
    }

    return {
        init: init,
        spinToCard: spinToCard,
        goToCard: goToCard
    };

})();

document.addEventListener("DOMContentLoaded", function () {
    Carousel.init({
        elem: document.querySelector("#carousel"),
        nodes: 11,
        generateElems: true,
        displayBackface: true
    });
});
