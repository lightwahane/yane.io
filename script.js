import * as THREE from "three";


/* =========================================================
   ASSETS
========================================================= */

const PHOTO_URLS = [
    "https://raw.githubusercontent.com/lightwahane/ana.github.io/refs/heads/main/photo1.jpg",
    "https://raw.githubusercontent.com/lightwahane/ana.github.io/refs/heads/main/photo2.jpg",
    "https://raw.githubusercontent.com/lightwahane/ana.github.io/refs/heads/main/photo3.JPG"
];

const MUSIC_URL =
    "https://github.com/lightwahane/meow.github.io/raw/refs/heads/main/love.mp3";


/* =========================================================
   MEMORY CONTENT
========================================================= */

const MEMORIES = [
    {
        title: "before I knew",
        description:
            "Some moments don't announce themselves. You only realize later that you wanted to keep them forever."
    },

    {
        title: "somewhere in between",
        description:
            "There are thousands of ordinary moments. Somehow, the ones with you never feel ordinary."
    },

    {
        title: "and then there was you",
        description:
            "I could probably explain a hundred things about us. The important part is that I don't need to."
    }
];


/* =========================================================
   DOM
========================================================= */

const canvas =
    document.getElementById("universe");

const intro =
    document.getElementById("intro");

const scannerMessage =
    document.getElementById("scannerMessage");

const memoryUI =
    document.getElementById("memoryUI");

const photoHint =
    document.getElementById("photoHint");

const finalSection =
    document.getElementById("finalSection");

const ending =
    document.getElementById("ending");

const statusText =
    document.getElementById("statusText");

const memoryTitle =
    document.getElementById("memoryTitle");

const memoryDescription =
    document.getElementById("memoryDescription");

const currentMemory =
    document.getElementById("currentMemory");

const memoryButtons =
    document.querySelectorAll(".memory-button");

const soundButton =
    document.getElementById("soundButton");

const soundText =
    document.getElementById("soundText");

const holdButton =
    document.getElementById("holdButton");

const holdProgress =
    document.querySelector(".hold-progress");

const restartButton =
    document.getElementById("restartButton");


/* =========================================================
   AUDIO
========================================================= */

const audio =
    new Audio(MUSIC_URL);

audio.loop = true;

audio.volume = 0.35;

let musicPlaying = false;


function startMusic() {

    if (musicPlaying) {
        return;
    }

    audio.play()
        .then(() => {

            musicPlaying = true;

            soundText.textContent = "sound on";

        })
        .catch(() => {

            soundText.textContent = "tap sound";

        });
}


soundButton.addEventListener("click", (event) => {

    event.stopPropagation();

    if (!musicPlaying) {

        startMusic();

        return;
    }

    if (audio.paused) {

        audio.play();

        soundText.textContent = "sound on";

    } else {

        audio.pause();

        soundText.textContent = "sound off";
    }

});


document.addEventListener(
    "pointerdown",
    () => {

        startMusic();

    },
    {
        once: true
    }
);


/* =========================================================
   THREE.JS SETUP
========================================================= */

const scene =
    new THREE.Scene();


const camera =
    new THREE.PerspectiveCamera(
        50,
        window.innerWidth / window.innerHeight,
        0.1,
        100
    );


camera.position.z = 8;


const renderer =
    new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        alpha: true,
        powerPreference: "high-performance"
    });


renderer.setPixelRatio(
    Math.min(window.devicePixelRatio, 2)
);


renderer.setSize(
    window.innerWidth,
    window.innerHeight
);


renderer.outputColorSpace =
    THREE.SRGBColorSpace;


/* =========================================================
   PARTICLE CONFIG
========================================================= */

const isMobile =
    window.innerWidth < 700;


const PARTICLE_COUNT =
    isMobile ? 15000 : 26000;


const CLOUD_RADIUS =
    isMobile ? 6.8 : 8.5;


const cloudPositions =
    new Float32Array(
        PARTICLE_COUNT * 3
    );


const targetPositions =
    new Float32Array(
        PARTICLE_COUNT * 3
    );


const randomValues =
    new Float32Array(
        PARTICLE_COUNT * 4
    );


/* =========================================================
   CREATE COSMIC CLOUD
========================================================= */

for (
    let i = 0;
    i < PARTICLE_COUNT;
    i++
) {

    const i3 = i * 3;

    const radius =
        Math.pow(
            Math.random(),
            0.55
        ) * CLOUD_RADIUS;


    const theta =
        Math.random() *
        Math.PI *
        2;


    const phi =
        Math.acos(
            2 * Math.random() - 1
        );


    let x =
        radius *
        Math.sin(phi) *
        Math.cos(theta);


    let y =
        radius *
        Math.sin(phi) *
        Math.sin(theta);


    let z =
        radius *
        Math.cos(phi);


    /*
     * Flatten the cloud slightly so
     * it feels like a floating universe.
     */

    y *= 0.7;

    z *= 0.75;


    /*
     * Add several soft spiral structures.
     */

    const spiral =
        Math.sin(
            theta * 3 +
            radius * 1.2
        );


    x += spiral * 0.3;

    y +=
        Math.cos(
            theta * 2 +
            radius
        ) * 0.2;


    cloudPositions[i3] =
        x;

    cloudPositions[i3 + 1] =
        y;

    cloudPositions[i3 + 2] =
        z;


    randomValues[i * 4] =
        Math.random();

    randomValues[i * 4 + 1] =
        Math.random();

    randomValues[i * 4 + 2] =
        Math.random();

    randomValues[i * 4 + 3] =
        Math.random();
}


/* =========================================================
   IMAGE -> PARTICLE TARGET
========================================================= */

function loadImage(url) {

    return new Promise(
        (resolve, reject) => {

            const image =
                new Image();

            image.crossOrigin =
                "anonymous";

            image.onload = () => {
                resolve(image);
            };

            image.onerror =
                reject;

            image.src = url;
        }
    );
}


async function imageToParticles(url) {

    const image =
        await loadImage(url);


    /*
     * Small canvas keeps the effect performant.
     */

    const width =
        isMobile ? 150 : 190;

    const height =
        Math.round(
            width *
            image.height /
            image.width
        );


    const offscreen =
        document.createElement("canvas");


    offscreen.width =
        width;

    offscreen.height =
        height;


    const context =
        offscreen.getContext("2d", {
            willReadFrequently: true
        });


    context.drawImage(
        image,
        0,
        0,
        width,
        height
    );


    const pixels =
        context.getImageData(
            0,
            0,
            width,
            height
        ).data;


    /*
     * Build a list of useful pixels.
     */

    const visiblePixels = [];


    for (
        let y = 0;
        y < height;
        y++
    ) {

        for (
            let x = 0;
            x < width;
            x++
        ) {

            const index =
                (y * width + x) * 4;


            const r =
                pixels[index];

            const g =
                pixels[index + 1];

            const b =
                pixels[index + 2];

            const a =
                pixels[index + 3];


            if (a < 20) {
                continue;
            }


            /*
             * Avoid completely black
             * invisible points.
             */

            const brightness =
                (r + g + b) / 3;


            if (brightness < 8) {
                continue;
            }


            visiblePixels.push({
                x,
                y,
                brightness,
                r,
                g,
                b
            });
        }
    }


    const result =
        new Float32Array(
            PARTICLE_COUNT * 3
        );


    const imageAspect =
        width / height;


    /*
     * The image lives in the center
     * of the particle universe.
     */

    const imageHeight =
        isMobile ? 4.2 : 4.8;

    const imageWidth =
        imageHeight *
        imageAspect;


    const scale =
        imageWidth > 7
            ? 7 / imageWidth
            : 1;


    const finalWidth =
        imageWidth * scale;

    const finalHeight =
        imageHeight * scale;


    for (
        let i = 0;
        i < PARTICLE_COUNT;
        i++
    ) {

        const i3 =
            i * 3;


        /*
         * Choose a visible image pixel.
         */

        const pixel =
            visiblePixels[
                Math.floor(
                    Math.random() *
                    visiblePixels.length
                )
            ];


        const px =
            pixel.x / (width - 1);

        const py =
            pixel.y / (height - 1);


        /*
         * Center image around 0,0.
         */

        const x =
            (px - 0.5) *
            finalWidth;


        const y =
            (0.5 - py) *
            finalHeight;


        /*
         * Give every particle a tiny
         * amount of depth.
         */

        const brightness =
            pixel.brightness / 255;


        const depth =
            (
                Math.random() -
                0.5
            ) *
            0.45;


        result[i3] =
            x;

        result[i3 + 1] =
            y;

        result[i3 + 2] =
            depth +
            brightness * 0.15;
    }


    return result;
}


/* =========================================================
   INITIAL TARGET
========================================================= */

for (
    let i = 0;
    i < PARTICLE_COUNT * 3;
    i++
) {

    targetPositions[i] =
        cloudPositions[i] +
        (
            Math.random() -
            0.5
        ) *
        0.3;
}


/* =========================================================
   GEOMETRY
========================================================= */

const geometry =
    new THREE.BufferGeometry();


geometry.setAttribute(
    "position",
    new THREE.BufferAttribute(
        cloudPositions,
        3
    )
);


geometry.setAttribute(
    "aCloud",
    new THREE.BufferAttribute(
        cloudPositions,
        3
    )
);


geometry.setAttribute(
    "aTarget",
    new THREE.BufferAttribute(
        targetPositions,
        3
    )
);


geometry.setAttribute(
    "aRandom",
    new THREE.BufferAttribute(
        randomValues,
        4
    )
);


/* =========================================================
   SHADER
========================================================= */

const vertexShader = `

uniform float uTime;
uniform float uReveal;
uniform vec2 uMouse;
uniform float uPixelRatio;

attribute vec3 aCloud;
attribute vec3 aTarget;
attribute vec4 aRandom;

varying float vReveal;
varying float vRandom;

void main() {

    vec3 cloud =
        aCloud;

    vec3 target =
        aTarget;


    /*
     * Slowly rotate the cloud.
     */

    float angle =
        uTime * 0.018;

    float cosA =
        cos(angle);

    float sinA =
        sin(angle);


    vec3 rotatedCloud;

    rotatedCloud.x =
        cloud.x * cosA -
        cloud.z * sinA;

    rotatedCloud.z =
        cloud.x * sinA +
        cloud.z * cosA;

    rotatedCloud.y =
        cloud.y;


    cloud =
        rotatedCloud;


    /*
     * Project target position so
     * we can compare it with the cursor.
     */

    vec4 targetClip =
        projectionMatrix *
        modelViewMatrix *
        vec4(target, 1.0);


    vec2 targetScreen =
        targetClip.xy /
        targetClip.w;


    float distanceFromMouse =
        distance(
            targetScreen,
            uMouse
        );


    /*
     * Cursor scanning radius.
     */

    float scan =
        1.0 -
        smoothstep(
            0.0,
            0.42,
            distanceFromMouse
        );


    /*
     * Global reveal + local scanner.
     */

    float reveal =
        max(
            uReveal,
            scan
        );


    /*
     * Add a tiny amount of
     * particle instability.
     */

    float noise =
        sin(
            uTime * 0.7 +
            aRandom.x * 30.0
        ) *
        0.025;


    vec3 finalPosition =
        mix(
            cloud,
            target,
            reveal
        );


    finalPosition.z +=
        noise;


    /*
     * Push focused particles
     * slightly toward the viewer.
     */

    finalPosition.z +=
        scan * 0.25;


    vec4 mvPosition =
        modelViewMatrix *
        vec4(
            finalPosition,
            1.0
        );


    float size =
        1.0 +
        aRandom.y * 1.8;


    size +=
        scan * 3.5;


    gl_PointSize =
        size *
        uPixelRatio *
        (6.0 / -mvPosition.z);


    gl_Position =
        projectionMatrix *
        mvPosition;


    vReveal =
        reveal;

    vRandom =
        aRandom.x;
}
`;


const fragmentShader = `

uniform float uTime;

varying float vReveal;
varying float vRandom;

void main() {

    vec2 uv =
        gl_PointCoord -
        0.5;


    float distanceFromCenter =
        length(uv);


    if (
        distanceFromCenter >
        0.5
    ) {
        discard;
    }


    /*
     * Soft particle glow.
     */

    float glow =
        1.0 -
        smoothstep(
            0.05,
            0.5,
            distanceFromCenter
        );


    /*
     * Mostly pink/purple,
     * with occasional white particles.
     */

    vec3 pink =
        vec3(
            1.0,
            0.30,
            0.68
        );


    vec3 purple =
        vec3(
            0.55,
            0.32,
            1.0
        );


    vec3 white =
        vec3(
            1.0,
            0.92,
            0.98
        );


    vec3 color =
        mix(
            pink,
            purple,
            vRandom
        );


    color =
        mix(
            color,
            white,
            smoothstep(
                0.88,
                1.0,
                vRandom
            )
        );


    float alpha =
        glow *
        (
            0.18 +
            vReveal * 0.75
        );


    gl_FragColor =
        vec4(
            color,
            alpha
        );
}
`;


/* =========================================================
   MATERIAL
========================================================= */

const material =
    new THREE.ShaderMaterial({

        uniforms: {

            uTime: {
                value: 0
            },

            uReveal: {
                value: 0
            },

            uMouse: {
                value: new THREE.Vector2(
                    99,
                    99
                )
            },

            uPixelRatio: {
                value:
                    Math.min(
                        window.devicePixelRatio,
                        2
                    )
            }

        },

        vertexShader,

        fragmentShader,

        transparent: true,

        depthWrite: false,

        blending:
            THREE.AdditiveBlending
    });


/* =========================================================
   PARTICLE SYSTEM
========================================================= */

const particles =
    new THREE.Points(
        geometry,
        material
    );


scene.add(
    particles
);


/* =========================================================
   EXTRA STAR FIELD
========================================================= */

function createStars() {

    const count =
        isMobile
            ? 900
            : 1800;


    const positions =
        new Float32Array(
            count * 3
        );


    for (
        let i = 0;
        i < count;
        i++
    ) {

        const i3 =
            i * 3;


        const radius =
            12 +
            Math.random() * 20;


        const angle =
            Math.random() *
            Math.PI *
            2;


        const vertical =
            (
                Math.random() -
                0.5
            ) * 18;


        positions[i3] =
            Math.cos(angle) *
            radius;


        positions[i3 + 1] =
            vertical;


        positions[i3 + 2] =
            (
                Math.random() -
                0.5
            ) * 18;
    }


    const starGeometry =
        new THREE.BufferGeometry();


    starGeometry.setAttribute(
        "position",
        new THREE.BufferAttribute(
            positions,
            3
        )
    );


    const starMaterial =
        new THREE.PointsMaterial({

            color: 0xffffff,

            size:
                isMobile
                    ? 0.025
                    : 0.035,

            transparent: true,

            opacity: 0.25,

            depthWrite: false,

            blending:
                THREE.AdditiveBlending
        });


    const stars =
        new THREE.Points(
            starGeometry,
            starMaterial
        );


    scene.add(stars);

    return stars;
}


const stars =
    createStars();


/* =========================================================
   MOUSE
========================================================= */

const mouse =
    new THREE.Vector2(
        99,
        99
    );


const mouseScreen =
    new THREE.Vector2(
        window.innerWidth / 2,
        window.innerHeight / 2
    );


let hasInteracted =
    false;


function updateMouse(
    clientX,
    clientY
) {

    mouseScreen.x =
        clientX;

    mouseScreen.y =
        clientY;


    mouse.x =
        (
            clientX /
            window.innerWidth
        ) * 2 - 1;


    mouse.y =
        -(
            clientY /
            window.innerHeight
        ) * 2 + 1;


    material.uniforms.uMouse.value.copy(
        mouse
    );


    hasInteracted =
        true;
}


window.addEventListener(
    "pointermove",
    (event) => {

        updateMouse(
            event.clientX,
            event.clientY
        );

    },
    {
        passive: true
    }
);


/* =========================================================
   TOUCH
========================================================= */

window.addEventListener(
    "touchmove",
    (event) => {

        if (!event.touches.length) {
            return;
        }

        const touch =
            event.touches[0];


        updateMouse(
            touch.clientX,
            touch.clientY
        );

    },
    {
        passive: true
    }
);


/* =========================================================
   FRAGMENT SCANNER
========================================================= */

const fragments =
    document.querySelectorAll(
        ".fragment"
    );


function updateFragments() {

    if (!hasInteracted) {
        return;
    }


    fragments.forEach(
        (fragment) => {

            const rect =
                fragment.getBoundingClientRect();


            const centerX =
                rect.left +
                rect.width / 2;


            const centerY =
                rect.top +
                rect.height / 2;


            const dx =
                mouseScreen.x -
                centerX;


            const dy =
                mouseScreen.y -
                centerY;


            const distance =
                Math.sqrt(
                    dx * dx +
                    dy * dy
                );


            const revealRadius =
                160;


            if (
                distance <
                revealRadius
            ) {

                fragment.classList.add(
                    "visible"
                );

            } else {

                fragment.classList.remove(
                    "visible"
                );
            }

        }
    );
}


/* =========================================================
   INTRO LOGIC
========================================================= */

let introFinished =
    false;


setTimeout(() => {

    introFinished =
        true;

    scannerMessage.classList.remove(
        "hidden"
    );

}, 2500);


let explorationStarted =
    false;


function startExploration() {

    if (explorationStarted) {
        return;
    }


    explorationStarted =
        true;


    intro.classList.remove(
        "active"
    );


    scannerMessage.classList.add(
        "hidden"
    );


    memoryUI.classList.add(
        "visible"
    );


    photoHint.classList.remove(
        "hide"
    );


    statusText.textContent =
        "MEMORY FIELD";
}


window.addEventListener(
    "pointermove",
    () => {

        if (
            introFinished &&
            !explorationStarted
        ) {

            startExploration();
        }

    },
    {
        once: true
    }
);


/* =========================================================
   MEMORY SYSTEM
========================================================= */

let selectedMemory =
    0;


let photoTargets =
    [];


async function prepareImages() {

    try {

        statusText.textContent =
            "LOADING MEMORIES";


        photoTargets =
            await Promise.all(
                PHOTO_URLS.map(
                    (url) =>
                        imageToParticles(url)
                )
            );


        setMemory(
            0,
            true
        );


        statusText.textContent =
            "MEMORY FIELD";


    } catch (error) {

        console.error(
            "Could not load images:",
            error
        );


        statusText.textContent =
            "FIELD ERROR";
    }
}


function setMemory(
    index,
    firstLoad = false
) {

    if (
        !photoTargets[index]
    ) {
        return;
    }


    selectedMemory =
        index;


    const target =
        photoTargets[index];


    for (
        let i = 0;
        i < target.length;
        i++
    ) {

        targetPositions[i] =
            target[i];
    }


    geometry
        .attributes
        .aTarget
        .needsUpdate = true;


    /*
     * Start mostly hidden each time
     * so the user has to discover
     * the photograph again.
     */

    material.uniforms.uReveal.value =
        firstLoad
            ? 0.03
            : 0;


    memoryTitle.textContent =
        MEMORIES[index].title;


    memoryDescription.textContent =
        MEMORIES[index].description;


    currentMemory.textContent =
        String(index + 1).padStart(
            2,
            "0"
        );


    memoryButtons.forEach(
        (button, buttonIndex) => {

            button.classList.toggle(
                "active",
                buttonIndex === index
            );

        }
    );


    photoHint.classList.remove(
        "hide"
    );
}


memoryButtons.forEach(
    (button) => {

        button.addEventListener(
            "click",
            () => {

                const index =
                    Number(
                        button.dataset.memory
                    );


                setMemory(index);

            }
        );

    }
);


/* =========================================================
   REVEAL CONTROL
========================================================= */

let reveal =
    0;


let targetReveal =
    0;


let mouseStillTime =
    0;


let lastMouseX =
    mouseScreen.x;


let lastMouseY =
    mouseScreen.y;


function updateReveal() {

    const dx =
        mouseScreen.x -
        lastMouseX;


    const dy =
        mouseScreen.y -
        lastMouseY;


    const movement =
        Math.sqrt(
            dx * dx +
            dy * dy
        );


    if (
        movement < 0.5
    ) {

        mouseStillTime +=
            0.016;

    } else {

        mouseStillTime = 0;
    }


    lastMouseX =
        mouseScreen.x;

    lastMouseY =
        mouseScreen.y;


    /*
     * Slowly scanning around the
     * image gives the actual reveal.
     */

    targetReveal =
        Math.max(
            0,
            targetReveal -
            0.002
        );


    /*
     * If the cursor stays around
     * the central image, slowly reveal
     * more of it.
     */

    const centerDistance =
        Math.sqrt(
            Math.pow(
                mouse.x,
                2
            ) +
            Math.pow(
                mouse.y,
                2
            )
        );


    if (
        centerDistance < 0.7
    ) {

        targetReveal =
            Math.min(
                0.22,
                targetReveal +
                0.0015
            );
    }


    reveal +=
        (
            targetReveal -
            reveal
        ) * 0.04;


    material.uniforms.uReveal.value =
        reveal;
}


/* =========================================================
   PHOTO DISCOVERED DETECTION
========================================================= */

let photoFullySeen =
    false;


function checkPhotoDiscovery() {

    if (
        photoFullySeen
    ) {
        return;
    }


    if (
        reveal > 0.18
    ) {

        photoFullySeen =
            true;

        photoHint.classList.add(
            "hide"
        );


        statusText.textContent =
            "MEMORY FOUND";
    }
}


/* =========================================================
   FINAL SECTION TRIGGER
========================================================= */

let finalUnlocked =
    false;


function unlockFinal() {

    if (finalUnlocked) {
        return;
    }


    /*
     * Require all three memories
     * to have been visited.
     */

    if (
        visitedMemories.size < 3
    ) {

        return;
    }


    finalUnlocked =
        true;


    memoryUI.classList.remove(
        "visible"
    );


    photoHint.classList.add(
        "hide"
    );


    scannerMessage.classList.add(
        "hidden"
    );


    finalSection.classList.add(
        "visible"
    );


    statusText.textContent =
        "ONE LAST THING";
}


/* =========================================================
   TRACK VISITED MEMORIES
========================================================= */

const visitedMemories =
    new Set();


function markMemoryVisited() {

    if (
        reveal > 0.15
    ) {

        visitedMemories.add(
            selectedMemory
        );
    }


    if (
        visitedMemories.size === 3
    ) {

        setTimeout(
            unlockFinal,
            800
        );
    }
}


/* =========================================================
   HOLD BUTTON
========================================================= */

let holdTimer =
    null;


let holdStart =
    0;


let isHolding =
    false;


const HOLD_DURATION =
    3000;


function startHold() {

    if (isHolding) {
        return;
    }


    isHolding =
        true;


    holdStart =
        performance.now();


    holdButton.classList.add(
        "holding"
    );


    requestAnimationFrame(
        updateHold
    );
}


function updateHold(now) {

    if (!isHolding) {
        return;
    }


    const elapsed =
        now -
        holdStart;


    const progress =
        Math.min(
            1,
            elapsed /
            HOLD_DURATION
        );


    const degrees =
        progress *
        360;


    holdProgress.style.background =
        `
        conic-gradient(
            var(--pink) ${degrees}deg,
            transparent ${degrees}deg
        )
        `;


    if (
        progress >= 1
    ) {

        finishHold();

        return;
    }


    requestAnimationFrame(
        updateHold
    );
}


function cancelHold() {

    isHolding =
        false;


    holdButton.classList.remove(
        "holding"
    );


    holdProgress.style.background =
        `
        conic-gradient(
            var(--pink) 0deg,
            transparent 0deg
        )
        `;
}


function finishHold() {

    isHolding =
        false;


    holdButton.classList.remove(
        "holding"
    );


    holdProgress.style.background =
        `
        conic-gradient(
            var(--pink) 360deg,
            transparent 360deg
        )
        `;


    showEnding();
}


holdButton.addEventListener(
    "pointerdown",
    (event) => {

        event.preventDefault();

        startHold();

    }
);


holdButton.addEventListener(
    "pointerup",
    cancelHold
);


holdButton.addEventListener(
    "pointercancel",
    cancelHold
);


holdButton.addEventListener(
    "pointerleave",
    () => {

        if (isHolding) {
            cancelHold();
        }

    }
);


/* =========================================================
   ENDING
========================================================= */

let endingShown =
    false;


function showEnding() {

    if (endingShown) {
        return;
    }


    endingShown =
        true;


    finalSection.classList.remove(
        "visible"
    );


    memoryUI.classList.remove(
        "visible"
    );


    scannerMessage.classList.add(
        "hidden"
    );


    /*
     * Let the particles become
     * almost completely visible.
     */

    material.uniforms.uReveal.value =
        1;


    statusText.textContent =
        "FOUND";


    setTimeout(
        () => {

            ending.classList.add(
                "visible"
            );

        },
        1800
    );
}


/* =========================================================
   RESTART
========================================================= */

restartButton.addEventListener(
    "click",
    () => {

        ending.classList.remove(
            "visible"
        );


        endingShown =
            false;

        finalUnlocked =
            false;

        explorationStarted =
            false;

        photoFullySeen =
            false;


        visitedMemories.clear();


        reveal =
            0;


        targetReveal =
            0;


        material.uniforms.uReveal.value =
            0;


        memoryUI.classList.remove(
            "visible"
        );


        finalSection.classList.remove(
            "visible"
        );


        intro.classList.add(
            "active"
        );


        scannerMessage.classList.remove(
            "hidden"
        );


        setTimeout(
            () => {

                introFinished =
                    true;

            },
            1000
        );


        setMemory(
            0,
            true
        );

    }
);


/* =========================================================
   RESIZE
========================================================= */

window.addEventListener(
    "resize",
    () => {

        camera.aspect =
            window.innerWidth /
            window.innerHeight;


        camera.updateProjectionMatrix();


        renderer.setSize(
            window.innerWidth,
            window.innerHeight
        );


        renderer.setPixelRatio(
            Math.min(
                window.devicePixelRatio,
                2
            )
        );


        material.uniforms.uPixelRatio.value =
            Math.min(
                window.devicePixelRatio,
                2
            );

    }
);


/* =========================================================
   ANIMATION
========================================================= */

const clock =
    new THREE.Clock();


function animate() {

    requestAnimationFrame(
        animate
    );


    const elapsed =
        clock.getElapsedTime();


    material.uniforms.uTime.value =
        elapsed;


    /*
     * Very slow universe rotation.
     */

    particles.rotation.y =
        Math.sin(
            elapsed * 0.04
        ) * 0.08;


    particles.rotation.x =
        Math.cos(
            elapsed * 0.035
        ) * 0.025;


    /*
     * Background stars move
     * almost imperceptibly.
     */

    stars.rotation.y =
        elapsed * 0.003;


    stars.rotation.x =
        Math.sin(
            elapsed * 0.01
        ) * 0.02;


    updateFragments();

    updateReveal();

    checkPhotoDiscovery();

    markMemoryVisited();


    renderer.render(
        scene,
        camera
    );
}


animate();


/* =========================================================
   PRELOAD
========================================================= */

prepareImages();


/* =========================================================
   KEYBOARD SUPPORT
========================================================= */

window.addEventListener(
    "keydown",
    (event) => {

        if (
            event.code ===
            "Space"
        ) {

            if (
                finalSection.classList.contains(
                    "visible"
                )
            ) {

                event.preventDefault();

                startHold();
            }
        }


        if (
            event.key === "1"
        ) {

            setMemory(0);
        }


        if (
            event.key === "2"
        ) {

            setMemory(1);
        }


        if (
            event.key === "3"
        ) {

            setMemory(2);
        }

    }
);


window.addEventListener(
    "keyup",
    (event) => {

        if (
            event.code ===
            "Space"
        ) {

            cancelHold();
        }

    }
);


/* =========================================================
   PREVENT ACCIDENTAL CONTEXT MENU
========================================================= */

canvas.addEventListener(
    "contextmenu",
    (event) => {

        event.preventDefault();

    }
);
