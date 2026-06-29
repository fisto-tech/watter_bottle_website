import * as THREE from "https://cdnjs.cloudflare.com/ajax/libs/three.js/0.160.1/three.module.min.js";

/* ================================================================
   Liquid Glass - Modified for FISTO Water Bottles
   ================================================================ */

export class LiquidBackground {
    constructor(containerId, bgUrls) {
        this.container = document.getElementById(containerId);
        if (!this.container) return;

        this.MAX_DROPLETS = 40;
        this.FIXED_DT_MS = 8;
        this.MAX_FRAME_DT_MS = 100;
        this.MAX_CATCHUP = 6;
        
        this.renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true });
        this.renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.container.appendChild(this.renderer.domElement);

        this.scene = new THREE.Scene();
        this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

        // Load all background textures
        this.textureLoader = new THREE.TextureLoader();
        this.textures = bgUrls.map(url => {
            const tex = this.textureLoader.load(url);
            tex.minFilter = THREE.LinearFilter;
            tex.magFilter = THREE.LinearFilter;
            return tex;
        });

        this.currentIndex = 0;

        /* ── Droplet data ── */
        this.MAX_ENTRIES = this.MAX_DROPLETS * 2;
        this.dropletBuf = new Float32Array(this.MAX_ENTRIES * 4);
        this.dropletTex = new THREE.DataTexture(
            this.dropletBuf,
            this.MAX_ENTRIES,
            1,
            THREE.RGBAFormat,
            THREE.FloatType
        );
        this.dropletTex.minFilter = THREE.NearestFilter;
        this.dropletTex.magFilter = THREE.NearestFilter;
        this.dropletTex.needsUpdate = true;

        this.drops = [];
        this.uid = 0;
        this.aspect = this.container.clientWidth / this.container.clientHeight;

        /* ── Shader ── */
        const vertSrc = `void main(){ gl_Position = vec4(position, 1.0); }`;
        const fragSrc = `
precision highp float;
#define MAX_N ${this.MAX_ENTRIES}

uniform vec2      uRes;
uniform sampler2D uData;
uniform sampler2D uBg;
uniform sampler2D uBgNext;
uniform float     uMix;
uniform int       uCount;
uniform float     uTime;

vec2 getCoverUV(vec2 uv) {
    float rs = uRes.x / uRes.y;
    float ts = 1920.0 / 1080.0; // Assume hero bgs are 16:9
    vec2 offset = vec2(0.0);
    vec2 scale = vec2(1.0);
    if(rs > ts) {
        scale.y = ts / rs;
        offset.y = (1.0 - scale.y) * 0.5;
    } else {
        scale.x = rs / ts;
        offset.x = (1.0 - scale.x) * 0.5;
    }
    return uv * scale + offset;
}

void main(){
  vec2  uv  = gl_FragCoord.xy / uRes;
  float asp = uRes.x / uRes.y;
  vec2  p   = (uv - 0.5) * vec2(asp, 1.0);

  float field = 0.0;
  vec2  grad  = vec2(0.0);
  vec2  lens  = vec2(0.0);
  float lensW = 0.0;

  for(int i = 0; i < MAX_N; i++){
    if(i >= uCount) break;
    vec4  d = texture2D(uData, vec2((float(i)+0.5)/float(MAX_N), 0.5));
    vec2  c = d.xy;
    float r = d.z;
    if(r < 0.001) continue;
    vec2  delta = p - c;
    float dSq   = dot(delta, delta) + 1e-5;
    float contrib = r * r / dSq;
    field += contrib;
    grad  += -2.0 * contrib / dSq * delta;

    float w = r * r / (dSq + r * r);
    lens += (c - p) * w;
    lensW += w;
  }

  lens /= (lensW + 0.001);
  float lensLen = length(lens);

  float thr  = 1.0;
  float edge = smoothstep(thr - 0.08, thr + 0.03, field);

  float refractStrength = 0.035;
  float mappedLens = atan(lensLen * 6.0) * refractStrength;
  vec2  refractDir = (lensLen > 1e-5) ? lens / lensLen : vec2(0.0);
  float refractMask = smoothstep(thr - 0.2, thr + 1.5, field);
  vec2  refractedUV = clamp(uv + refractDir * mappedLens * refractMask, 0.001, 0.999);

  vec2 coverUV = getCoverUV(refractedUV);

  // Background crossfade
  vec3 bgClean1 = texture2D(uBg, coverUV).rgb;
  vec3 bgClean2 = texture2D(uBgNext, coverUV).rgb;
  vec3 bgClean = mix(bgClean1, bgClean2, uMix);

  float gradLen = length(grad);
  float nScale = atan(gradLen * 0.5) * 0.3;
  vec2  nGrad  = (gradLen > 1e-4) ? (grad / gradLen) * nScale : vec2(0.0);
  vec3  N = normalize(vec3(-nGrad, 1.0));
  vec3  L = normalize(vec3(0.3, 0.6, 1.0));
  vec3  V = vec3(0.0, 0.0, 1.0);
  vec3  H = normalize(L + V);
  float diff = max(dot(N, L), 0.0);
  float spec = pow(max(dot(N, H), 0.0), 180.0);

  float cosTheta = max(dot(N, V), 0.0);
  float fresnel  = 0.04 + 0.96 * pow(1.0 - cosTheta, 4.0);
  float rim = smoothstep(thr + 0.6, thr, field) * edge;

  float caStr = 0.0018 * edge;
  vec2 uvR = getCoverUV(refractedUV + vec2(caStr, caStr * 0.5));
  vec2 uvG = coverUV;
  vec2 uvB = getCoverUV(refractedUV - vec2(caStr, caStr * 0.5));
  
  vec3 bgCA1 = vec3(texture2D(uBg, uvR).r, texture2D(uBg, uvG).g, texture2D(uBg, uvB).b);
  vec3 bgCA2 = vec3(texture2D(uBgNext, uvR).r, texture2D(uBgNext, uvG).g, texture2D(uBgNext, uvB).b);
  vec3 bgCA = mix(bgCA1, bgCA2, uMix);

  float depth = smoothstep(thr, thr + 3.0, field);
  vec3  tint  = mix(vec3(1.0), vec3(0.93, 0.96, 1.0), depth * 0.45);

  vec3 glassColor = bgCA * tint * (0.92 + 0.08 * diff)
                  + vec3(1.0) * spec * 0.85
                  + vec3(0.9, 0.95, 1.0) * rim * 0.22
                  + vec3(1.0) * fresnel * 0.10;

  float shadowField = smoothstep(thr - 0.35, thr - 0.05, field);
  vec3 bg = bgClean * (1.0 - shadowField * 0.06);

  float borderOuter = smoothstep(thr - 0.10, thr - 0.01, field);
  float borderInner = smoothstep(thr + 0.0, thr + 0.06, field);
  float border = borderOuter * (1.0 - borderInner) * 0.28;

  vec3  col = mix(bg, glassColor, edge);
  col += vec3(1.0) * border;

  gl_FragColor = vec4(col, 1.0);
}
`;

        this.mat = new THREE.ShaderMaterial({
            vertexShader: vertSrc,
            fragmentShader: fragSrc,
            uniforms: {
                uRes: { value: new THREE.Vector2(this.renderer.domElement.width, this.renderer.domElement.height) },
                uData: { value: this.dropletTex },
                uBg: { value: this.textures[0] },
                uBgNext: { value: this.textures[0] },
                uMix: { value: 0 },
                uCount: { value: 0 },
                uTime: { value: 0 }
            }
        });

        this.scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.mat));

        this.setupInteraction();
        this.seedDroplets();
        
        this.lastTime = performance.now();
        this.acc = 0;
        this.spawnCD = 0;
        this.autoTimer = 0;
        this.paused = false;

        document.addEventListener("visibilitychange", () => {
            this.paused = document.hidden;
            if (!this.paused) this.lastTime = performance.now();
        });

        window.addEventListener("resize", () => {
            if (!this.container) return;
            this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
            this.renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
            this.aspect = this.container.clientWidth / this.container.clientHeight;
            this.mat.uniforms.uRes.value.set(this.renderer.domElement.width, this.renderer.domElement.height);
        });

        this.loop = this.loop.bind(this);
        requestAnimationFrame(this.loop);
    }

    crossfadeTo(index, duration = 0.8) {
        if (index === this.currentIndex || !this.textures[index]) return;
        
        this.mat.uniforms.uBgNext.value = this.textures[index];
        this.currentIndex = index;

        // Global gsap is available
        window.gsap.to(this.mat.uniforms.uMix, {
            value: 1,
            duration: duration,
            ease: "power2.inOut",
            onComplete: () => {
                this.mat.uniforms.uBg.value = this.textures[index];
                this.mat.uniforms.uMix.value = 0;
            }
        });
    }

    spawn(x, y, r, vx = 0, vy = 0) {
        if (this.drops.length >= this.MAX_DROPLETS) return null;
        const area = Math.PI * r * r;
        const angle = Math.random() * Math.PI * 2;
        const spd = 0.0003 + Math.random() * 0.0008;
        const d = {
            id: this.uid++, x, y, r, area,
            vx: vx || Math.cos(angle) * spd,
            vy: vy || Math.sin(angle) * spd,
            alive: true,
            wanderAngle: Math.random() * Math.PI * 2,
            wanderSpeed: 0.3 + Math.random() * 0.5,
            softPrevX: x, softPrevY: y,
            softOffX: 0, softOffY: 0,
            softVelX: 0, softVelY: 0
        };
        this.drops.push(d);
        return d;
    }

    seedDroplets() {
        for (let i = 0; i < 15; i++) {
            this.spawn((Math.random() - 0.5) * 0.7, (Math.random() - 0.5) * 0.5, 0.03 + Math.random() * 0.05);
        }
    }

    setupInteraction() {
        this.mouse = { x: 999, y: 999, active: false, down: false };
        
        // Bind to main hero section so it triggers behind other elements
        const triggerArea = document.querySelector('main');
        if(!triggerArea) return;

        triggerArea.addEventListener("pointermove", (e) => {
            const rect = triggerArea.getBoundingClientRect();
            this.mouse.x = ((e.clientX - rect.left) / rect.width - 0.5) * this.aspect;
            this.mouse.y = 0.5 - (e.clientY - rect.top) / rect.height;
            this.mouse.active = true;
        });
        triggerArea.addEventListener("pointerdown", () => this.mouse.down = true);
        triggerArea.addEventListener("pointerup", () => this.mouse.down = false);
        triggerArea.addEventListener("pointerleave", () => {
            this.mouse.active = false;
            this.mouse.down = false;
        });
    }

    applyForces(simTime) {
        const WANDER_F = 0.00004, CENTER_PULL = 0.000008;
        const MOUSE_R = 0.18, MOUSE_F = 0.004;
        const TENSION_RANGE = 0.12, TENSION_F = 0.0004;

        for (const d of this.drops) {
            d.wanderAngle += (Math.random() - 0.5) * d.wanderSpeed;
            d.vx += Math.cos(d.wanderAngle) * WANDER_F;
            d.vy += Math.sin(d.wanderAngle) * WANDER_F;
            d.vx -= d.x * CENTER_PULL;
            d.vy -= d.y * CENTER_PULL;

            if (this.mouse.active) {
                const dx = d.x - this.mouse.x;
                const dy = d.y - this.mouse.y;
                const dSq = dx * dx + dy * dy;
                const rr = MOUSE_R + d.r;
                if (dSq < rr * rr && dSq > 1e-5) {
                    const dist = Math.sqrt(dSq);
                    const f = Math.pow(1 - dist / rr, 2) * MOUSE_F;
                    d.vx += (dx / dist) * f;
                    d.vy += (dy / dist) * f;
                }
            }
        }

        for (let i = 0; i < this.drops.length; i++) {
            const a = this.drops[i];
            for (let j = i + 1; j < this.drops.length; j++) {
                const b = this.drops[j];
                const dx = b.x - a.x, dy = b.y - a.y;
                const dSq = dx * dx + dy * dy;
                const rng = TENSION_RANGE + a.r + b.r;
                if (dSq < rng * rng && dSq > 1e-5) {
                    const dist = Math.sqrt(dSq);
                    const f = (1 - dist / rng) * TENSION_F;
                    a.vx += (dx / dist) * f; a.vy += (dy / dist) * f;
                    b.vx -= (dx / dist) * f; b.vy -= (dy / dist) * f;
                }
            }
        }
    }

    integrate() {
        const MAX_SPEED = 0.015, DAMP = 0.993, BOUNCE = 0.4;
        for (const d of this.drops) {
            const sp = Math.sqrt(d.vx * d.vx + d.vy * d.vy);
            if (sp > MAX_SPEED) {
                d.vx *= MAX_SPEED / sp; d.vy *= MAX_SPEED / sp;
            }
            d.x += d.vx; d.y += d.vy;
            d.vx *= DAMP; d.vy *= DAMP;

            const wx = this.aspect * 0.5, wy = 0.5;
            if (d.x - d.r < -wx) { d.x = -wx + d.r; d.vx = Math.abs(d.vx) * BOUNCE; }
            if (d.x + d.r > wx)  { d.x = wx - d.r;  d.vx = -Math.abs(d.vx) * BOUNCE; }
            if (d.y - d.r < -wy) { d.y = -wy + d.r; d.vy = Math.abs(d.vy) * BOUNCE; }
            if (d.y + d.r > wy)  { d.y = wy - d.r;  d.vy = -Math.abs(d.vy) * BOUNCE; }
        }
    }

    mergeDroplets() {
        const MERGE_RATIO = 0.62;
        for (let i = 0; i < this.drops.length; i++) {
            const a = this.drops[i];
            if (!a.alive) continue;
            for (let j = i + 1; j < this.drops.length; j++) {
                const b = this.drops[j];
                if (!b.alive) continue;
                const dx = b.x - a.x, dy = b.y - a.y;
                if (Math.sqrt(dx * dx + dy * dy) < (a.r + b.r) * MERGE_RATIO) {
                    const na = a.area + b.area;
                    a.x = (a.x * a.area + b.x * b.area) / na;
                    a.y = (a.y * a.area + b.y * b.area) / na;
                    a.vx = (a.vx * a.area + b.vx * b.area) / na;
                    a.vy = (a.vy * a.area + b.vy * b.area) / na;
                    a.r = Math.sqrt(na / Math.PI);
                    a.area = na;
                    b.alive = false;
                }
            }
        }
        this.drops = this.drops.filter(d => d.alive);
    }

    splitDroplets() {
        const SPLIT_SPEED = 0.013, SPLIT_MIN_R = 0.04;
        const add = [];
        for (const d of this.drops) {
            if (d.r < SPLIT_MIN_R) continue;
            const sp = Math.sqrt(d.vx * d.vx + d.vy * d.vy);
            if (sp < SPLIT_SPEED) continue;

            const ha = d.area * 0.5, nr = Math.sqrt(ha / Math.PI);
            const nx = -d.vy / sp, ny = d.vx / sp, off = nr * 0.7;

            d.r = nr; d.area = ha;
            d.x -= nx * off; d.y -= ny * off;

            add.push({
                id: this.uid++,
                x: d.x + nx * off * 2, y: d.y + ny * off * 2,
                r: nr, area: ha,
                vx: d.vx + nx * sp * 0.35, vy: d.vy + ny * sp * 0.35,
                alive: true, wanderAngle: Math.random() * Math.PI * 2, wanderSpeed: 0.3 + Math.random() * 0.5,
                softPrevX: d.x + nx * off * 2, softPrevY: d.y + ny * off * 2,
                softOffX: 0, softOffY: 0, softVelX: 0, softVelY: 0
            });
        }
        for (const a of add) if (this.drops.length < this.MAX_DROPLETS) this.drops.push(a);
    }

    autoSpawn() {
        this.autoTimer += this.FIXED_DT_MS;
        if (this.autoTimer > 2000 && this.drops.length < 15) {
            this.autoTimer = 0;
            this.spawn((Math.random() - 0.5) * this.aspect * 0.6, (Math.random() - 0.5) * 0.6, 0.025 + Math.random() * 0.03);
        }
    }

    mouseSpawn() {
        if (!this.mouse.down || !this.mouse.active) return;
        this.spawnCD -= this.FIXED_DT_MS;
        if (this.spawnCD <= 0 && this.drops.length < this.MAX_DROPLETS) {
            this.spawnCD = 120;
            this.spawn(this.mouse.x + (Math.random() - 0.5) * 0.02, this.mouse.y + (Math.random() - 0.5) * 0.02, 0.02 + Math.random() * 0.015);
        }
    }

    updateSoftBodies() {
        const SOFT_STIFFNESS = 0.22, SOFT_DAMPING = 0.6;
        for (const d of this.drops) {
            d.softVelX += (d.x - d.softPrevX - d.softOffX) * SOFT_STIFFNESS;
            d.softVelY += (d.y - d.softPrevY - d.softOffY) * SOFT_STIFFNESS;
            d.softVelX *= SOFT_DAMPING; d.softVelY *= SOFT_DAMPING;
            d.softOffX += d.softVelX; d.softOffY += d.softVelY;
            d.softPrevX = d.x; d.softPrevY = d.y;
        }
    }

    fixedUpdate() {
        const simTime = performance.now();
        this.applyForces(simTime);
        this.integrate();
        this.mergeDroplets();
        this.splitDroplets();
        this.updateSoftBodies();
        this.autoSpawn();
        this.mouseSpawn();
    }

    sync() {
        this.dropletBuf.fill(0);
        const n = Math.min(this.drops.length, this.MAX_DROPLETS);
        for (let i = 0; i < n; i++) {
            const d = this.drops[i];
            this.dropletBuf[i * 4] = d.x; this.dropletBuf[i * 4 + 1] = d.y;
            this.dropletBuf[i * 4 + 2] = d.r; this.dropletBuf[i * 4 + 3] = 1;

            const ghostScale = 0.7, trailStr = 3.5, gi = (n + i) * 4;
            this.dropletBuf[gi] = d.x - d.softOffX * trailStr;
            this.dropletBuf[gi + 1] = d.y - d.softOffY * trailStr;
            this.dropletBuf[gi + 2] = d.r * ghostScale;
            this.dropletBuf[gi + 3] = 1;
        }
        this.dropletTex.needsUpdate = true;
        this.mat.uniforms.uCount.value = n * 2;
    }

    loop() {
        if (this.paused) { requestAnimationFrame(this.loop); return; }
        const now = performance.now();
        const dt = Math.min(now - this.lastTime, this.MAX_FRAME_DT_MS);
        this.lastTime = now;
        this.acc += dt;

        let g = 0;
        while (this.acc >= this.FIXED_DT_MS && g < this.MAX_CATCHUP) {
            this.fixedUpdate();
            this.acc -= this.FIXED_DT_MS;
            g++;
        }
        if (g >= this.MAX_CATCHUP) this.acc = 0;

        this.mat.uniforms.uTime.value = now * 0.001;
        this.sync();
        this.renderer.render(this.scene, this.camera);
        requestAnimationFrame(this.loop);
    }
}
