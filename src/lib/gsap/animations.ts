/**
 * Animaciones de scroll del sitio. Se aplican por atributo `data-anim`
 * (nunca por clases de estilo), así el diseño puede cambiar sin romperlas.
 *
 * Reglas comunes (ver la propuesta de animación del proyecto):
 *   - Solo `transform`, `opacity`, `clip-path` (en piezas pequeñas) y
 *     variables CSS que alimentan transforms. Nada de width/height/padding:
 *     sin saltos de layout. Sin rebotes, elásticos, rotaciones ni bucles.
 *   - Cada elemento se anima UNA vez (`once: true`), con curvas
 *     `power3.out` / `expo.out` y recorridos cortos (12–36 px, escala ≤ 1.04).
 *   - Todo vive dentro de `respetaMovimiento` (gsap.matchMedia): con
 *     `prefers-reduced-motion: reduce` no se registra nada y la página se ve
 *     directamente en su estado final.
 *
 * Robustez — `html.gsap-listo`: los estados iniciales ocultos de global.css
 * solo aplican bajo esa clase, y la clase la añade ESTE módulo justo antes de
 * crear las animaciones. Si el JS no carga o falla, la clase nunca aparece y
 * nada queda invisible. Al terminar, cada elemento recibe `data-anim-hecho`
 * (deja de coincidir con el estado inicial) y se limpian sus estilos en línea,
 * para no pisar transiciones propias (p. ej. el hover de las fichas).
 */

import { gsap, ScrollTrigger, SplitText, respetaMovimiento } from './setup';

const SIN_PREFERENCIA = '(prefers-reduced-motion: no-preference)';
const CON_PUNTERO_FINO =
  '(prefers-reduced-motion: no-preference) and (pointer: fine) and (min-width: 1024px)';
const EASE = 'power3.out';
const EASE_LARGA = 'expo.out';
const HECHO = 'data-anim-hecho';
const INICIO = 'top 88%';

const todos = (selector: string, raiz: Element | Document = document) =>
  Array.from(raiz.querySelectorAll<HTMLElement>(selector));

const retraso = (el: HTMLElement) => Number(el.dataset.animRetraso ?? 0) || 0;

/** Marca como terminado y limpia los estilos en línea indicados. */
function marcarHecho(elementos: Element | Element[], limpiar = '') {
  for (const el of ([] as Element[]).concat(elementos)) {
    el.setAttribute(HECHO, '');
    if (!(el instanceof HTMLElement) || !limpiar) continue;
    for (const prop of limpiar.split(',')) {
      if (prop.startsWith('--')) el.style.removeProperty(prop);
      else gsap.set(el, { clearProps: prop });
    }
  }
}

/* ------------------------------------------------------------------ */
/* Encabezados: línea dorada del antetítulo y títulos por líneas       */
/* ------------------------------------------------------------------ */

function lineasDeAntetitulo() {
  // La línea es un ::before (no animable directamente): su scaleX lee la
  // variable --escala-linea, que es lo que anima GSAP (ver global.css).
  for (const el of todos('[data-anim="linea"]')) {
    gsap.fromTo(
      el,
      { '--escala-linea': 0, opacity: 0 },
      {
        '--escala-linea': 1,
        opacity: 1,
        duration: 0.9,
        ease: EASE,
        delay: retraso(el),
        scrollTrigger: { trigger: el, start: INICIO, once: true },
        onComplete: () => marcarHecho(el, 'opacity,--escala-linea'),
      },
    );
  }
}

function titulosPorLineas() {
  // SplitText con máscara por línea: cada línea sube desde debajo de su
  // propio recorte. autoSplit vuelve a partir al cambiar el ancho o al
  // cargar las fuentes, y al devolver la animación desde onSplit SplitText
  // conserva su progreso (una vez terminada, no se repite). Accesibilidad:
  // por defecto (aria: 'auto') pone aria-label con el texto completo en el
  // título y oculta las líneas partidas a los lectores de pantalla.
  for (const el of todos('[data-anim="titulo"]')) {
    SplitText.create(el, {
      type: 'lines',
      mask: 'lines',
      autoSplit: true,
      onSplit(partido) {
        el.style.visibility = 'visible';
        return gsap.from(partido.lines, {
          yPercent: 105,
          duration: 1,
          ease: EASE,
          stagger: 0.1,
          delay: retraso(el),
          scrollTrigger: { trigger: el, start: INICIO, once: true },
          onComplete: () => el.setAttribute(HECHO, ''),
        });
      },
    });
  }
}

/* ------------------------------------------------------------------ */
/* Bloques sueltos que suben (párrafos, cita, CTA del footer)          */
/* ------------------------------------------------------------------ */

function destelloUnico(boton: HTMLElement) {
  // Un solo barrido dorado por el botón al terminar de entrar. Nunca en bucle.
  const destello = boton.querySelector<HTMLElement>('[data-anim-destello]');
  if (!destello) return;
  gsap.fromTo(
    destello,
    { xPercent: -120, opacity: 1 },
    {
      xPercent: 300,
      duration: 1.2,
      ease: 'power2.inOut',
      delay: 0.1,
      onComplete: () => gsap.set(destello, { opacity: 0, clearProps: 'transform' }),
    },
  );
}

function bloquesQueSuben() {
  for (const el of todos('[data-anim="subir"]')) {
    gsap.fromTo(
      el,
      { opacity: 0, y: 28 },
      {
        opacity: 1,
        y: 0,
        duration: 0.9,
        ease: EASE,
        delay: retraso(el),
        scrollTrigger: { trigger: el, start: INICIO, once: true },
        onComplete: () => {
          marcarHecho(el, 'opacity,transform');
          destelloUnico(el);
        },
      },
    );
  }
}

/* ------------------------------------------------------------------ */
/* Lotes: fichas de abogados, tarjetas de servicio, columnas del footer */
/* ------------------------------------------------------------------ */

/** Interior de una ficha de Sobre nosotros: telón de la foto + filete. */
function interiorDeFicha(ficha: HTMLElement, demora: number) {
  const telon = ficha.querySelector<HTMLElement>('[data-anim="telon"]');
  const asentar = ficha.querySelector<HTMLElement>('[data-anim="asentar"]');
  const filete = ficha.querySelector<HTMLElement>('[data-anim="filete"]');
  const tl = gsap.timeline({ delay: demora });

  // El telón recorta el PANEL (clip-path) y la foto se asienta en un
  // contenedor propio (y + scale): ni .ficha-foto ni .ficha-filete reciben
  // transform de GSAP, así su hover (zoom de la foto, filete que se alarga)
  // sigue intacto. El filete se "dibuja" con clip-path, independiente de su
  // transform de hover.
  if (telon) {
    tl.fromTo(
      telon,
      { clipPath: 'inset(100% 0% 0% 0%)' },
      {
        clipPath: 'inset(0% 0% 0% 0%)',
        duration: 1.2,
        ease: EASE_LARGA,
        onComplete: () => marcarHecho(telon, 'clipPath'),
      },
      0.1,
    );
  }
  if (asentar) {
    tl.fromTo(
      asentar,
      { y: 24, scale: 1.04, transformOrigin: '50% 100%' },
      {
        y: 0,
        scale: 1,
        duration: 1.4,
        ease: EASE_LARGA,
        onComplete: () => marcarHecho(asentar, 'transform'),
      },
      0.1,
    );
  }
  if (filete) {
    tl.fromTo(
      filete,
      { clipPath: 'inset(0% 100% 0% 0%)' },
      {
        clipPath: 'inset(0% 0% 0% 0%)',
        duration: 0.9,
        ease: EASE,
        onComplete: () => marcarHecho(filete, 'clipPath'),
      },
      0.45,
    );
  }
}

/** Interior de una tarjeta de servicio: icono y número, tras la tarjeta. */
function interiorDeServicio(tarjeta: HTMLElement, demora: number) {
  const icono = tarjeta.querySelector<HTMLElement>('[data-anim-icono]');
  const numero = tarjeta.querySelector<HTMLElement>('[data-anim-numero]');
  const tl = gsap.timeline({ delay: demora });
  // El hover de la tarjeta solo cambia colores del icono (y usa la
  // propiedad `translate` de Tailwind v4 en la tarjeta), así que el scale
  // de GSAP aquí no compite con él.
  if (icono) {
    tl.fromTo(
      icono,
      { scale: 0.85, opacity: 0 },
      {
        scale: 1,
        opacity: 1,
        duration: 0.7,
        ease: EASE,
        onComplete: () => marcarHecho(icono, 'transform,opacity'),
      },
      0.25,
    );
  }
  if (numero) {
    tl.fromTo(
      numero,
      { opacity: 0 },
      {
        opacity: 1,
        duration: 0.6,
        ease: 'power1.out',
        onComplete: () => marcarHecho(numero, 'opacity'),
      },
      0.35,
    );
  }
}

const LOTES: Record<
  string,
  {
    y: number;
    duracion: number;
    escalonado: number;
    interior?: (el: HTMLElement, demora: number) => void;
  }
> = {
  ficha: { y: 32, duracion: 1, escalonado: 0.15, interior: interiorDeFicha },
  servicio: { y: 28, duracion: 0.9, escalonado: 0.1, interior: interiorDeServicio },
  columna: { y: 18, duracion: 0.8, escalonado: 0.08 },
};

function lotes() {
  // ScrollTrigger.batch agrupa los elementos que entran en pantalla en el
  // mismo instante: en escritorio las dos fichas (o una fila de servicios)
  // entran juntas con un escalonado sutil; en móvil cada una se dispara
  // cuando ELLA entra, no cuando lo hace el contenedor (antes la segunda
  // tarjeta terminaba su animación fuera de pantalla).
  for (const [nombre, cfg] of Object.entries(LOTES)) {
    const selector = `[data-anim="${nombre}"]`;
    if (!document.querySelector(selector)) continue;

    // transition:none mientras dura: algunas tarjetas tienen
    // `transition-all` en CSS, que si no "suavizaría" cada fotograma de GSAP.
    gsap.set(selector, { opacity: 0, y: cfg.y, transition: 'none' });
    ScrollTrigger.batch(selector, {
      start: INICIO,
      once: true,
      onEnter: (elementos) => {
        const lista = elementos as HTMLElement[];
        gsap.to(lista, {
          opacity: 1,
          y: 0,
          duration: cfg.duracion,
          ease: EASE,
          stagger: cfg.escalonado,
          overwrite: true,
          onComplete: () => marcarHecho(lista, 'opacity,transform,transition'),
        });
        lista.forEach((el, i) => cfg.interior?.(el, i * cfg.escalonado));
      },
    });
  }
}

/* ------------------------------------------------------------------ */
/* Línea de tiempo de la trayectoria (formación / experiencia)         */
/* ------------------------------------------------------------------ */

function lineasDeTiempo() {
  // El trazo vertical es un ::before que lee --escala-trazo; los hitos
  // (li) entran en cascada mientras se dibuja.
  for (const lista of todos('[data-anim="hitos"]')) {
    const hitos = todos(':scope > li', lista);
    const tl = gsap.timeline({
      scrollTrigger: { trigger: lista, start: 'top 85%', once: true },
      onComplete: () => {
        marcarHecho(lista, '--escala-trazo');
        gsap.set(hitos, { clearProps: 'opacity,transform' });
      },
    });
    tl.fromTo(
      lista,
      { '--escala-trazo': 0 },
      { '--escala-trazo': 1, duration: 1.1, ease: 'power2.inOut' },
      0,
    ).fromTo(
      hitos,
      { opacity: 0, y: 12 },
      { opacity: 1, y: 0, duration: 0.7, ease: EASE, stagger: 0.07 },
      0.15,
    );
  }
}

/* ------------------------------------------------------------------ */
/* Cifras clave: separadores, subida de cifras, contadores y etiquetas */
/* ------------------------------------------------------------------ */

const DURACION_CONTADOR = 1.75;

function contador(el: HTMLElement) {
  // El HTML ya trae el valor final (fallback de accesibilidad/SEO); solo
  // se sobrescribe mientras dura la cuenta.
  const valorFinal = Number(el.dataset.counter);
  const sufijo = el.dataset.suffix ?? '';
  if (Number.isNaN(valorFinal)) return gsap.timeline();
  const proxy = { valor: 0 };
  return gsap.to(proxy, {
    valor: valorFinal,
    duration: DURACION_CONTADOR,
    ease: 'power2.out',
    onUpdate: () => {
      el.textContent = `${Math.round(proxy.valor)}${sufijo}`;
    },
  });
}

function cifrasClave() {
  for (const banda of todos('[data-anim="cifras"]')) {
    const items = todos('[data-anim-item]', banda);
    const cifras = todos('[data-anim-cifra]', banda);
    const etiquetas = todos('[data-anim-etiqueta]', banda);

    const tl = gsap.timeline({
      scrollTrigger: { trigger: banda, start: 'top 85%', once: true },
      onComplete: () => {
        marcarHecho(banda);
        items.forEach((el) => el.style.removeProperty('--escala-separador'));
        gsap.set([...cifras, ...etiquetas], { clearProps: 'opacity,transform' });
      },
    });

    // Separadores verticales (::before, ver CifrasClave.astro) de izquierda
    // a derecha; cada cifra sube y empieza a contar; su etiqueta aparece
    // cuando la cuenta va por la mitad.
    tl.fromTo(
      items,
      { '--escala-separador': 0 },
      { '--escala-separador': 1, duration: 1, ease: 'power2.inOut', stagger: 0.12 },
      0,
    );
    cifras.forEach((cifra, i) => {
      const inicio = 0.05 + i * 0.1;
      tl.fromTo(
        cifra,
        { opacity: 0, y: 16 },
        { opacity: 1, y: 0, duration: 0.8, ease: EASE },
        inicio,
      );
      const numero = cifra.querySelector<HTMLElement>('[data-counter]');
      if (numero) tl.add(contador(numero), inicio);
      if (etiquetas[i]) {
        tl.fromTo(
          etiquetas[i],
          { opacity: 0, y: 10 },
          { opacity: 1, y: 0, duration: 0.7, ease: EASE },
          inicio + DURACION_CONTADOR / 2,
        );
      }
    });
  }
}

/* ------------------------------------------------------------------ */
/* Punto de entrada principal                                          */
/* ------------------------------------------------------------------ */

export function inicializarAnimacionesScroll(): void {
  respetaMovimiento.add(SIN_PREFERENCIA, () => {
    // Primero la clase (activa los estados iniciales de global.css), luego
    // las animaciones que los llevan a su estado final.
    document.documentElement.classList.add('gsap-listo');

    lineasDeAntetitulo();
    titulosPorLineas();
    bloquesQueSuben();
    lotes();
    lineasDeTiempo();
    cifrasClave();

    // Las fuentes web cambian alturas: recalcular posiciones al cargarlas.
    document.fonts?.ready.then(() => ScrollTrigger.refresh());

    return () => document.documentElement.classList.remove('gsap-listo');
  });
}

/* ------------------------------------------------------------------ */
/* Profundidad sutil ligada al scroll (solo escritorio con ratón)      */
/* ------------------------------------------------------------------ */

export function inicializarProfundidad(): void {
  // Recorridos cortos y nunca sobre bloques de texto largos: el panel
  // "Cómo empezamos" del Hero se queda un poco atrás al salir, las luces
  // del fondo ambiental se desplazan levemente y las fotos de los socios
  // flotan unos pocos píxeles dentro de su panel.
  respetaMovimiento.add(CON_PUNTERO_FINO, () => {
    const asideHero = document.querySelector<HTMLElement>('[data-anim-profundidad="hero"]');
    if (asideHero) {
      gsap.to(asideHero, {
        y: -40,
        ease: 'none',
        scrollTrigger: {
          trigger: asideHero.closest('section') ?? asideHero,
          start: 'top top',
          end: 'bottom top',
          scrub: true,
        },
      });
    }

    const fondo = document.getElementById('fondo-ambiental');
    if (fondo) {
      gsap.to(fondo, {
        y: -90,
        ease: 'none',
        scrollTrigger: { start: 0, end: 'max', scrub: true },
      });
    }

    for (const foto of todos('[data-anim-profundidad="foto"]')) {
      gsap.fromTo(
        foto,
        { yPercent: 3 },
        {
          yPercent: -3,
          ease: 'none',
          scrollTrigger: {
            trigger: foto.closest('article') ?? foto,
            start: 'top bottom',
            end: 'bottom top',
            scrub: true,
          },
        },
      );
    }
  });
}

/* ------------------------------------------------------------------ */
/* Header al desplazarse: fondo algo más opaco y sombra suave          */
/* ------------------------------------------------------------------ */

export function inicializarHeaderAlDesplazar(): void {
  // Es un cambio de estado, no un movimiento: aplica también con
  // prefers-reduced-motion (global.css quita ahí la transición). Solo se
  // alterna una clase; el CSS cambia color de fondo y sombra, nunca el
  // padding ni la altura (sin saltos de layout).
  const header = document.querySelector('header.site-header');
  if (!header) return;
  // onEnter/onLeaveBack (y no onToggle): con onToggle el estado se
  // desactivaba al llegar al final exacto de la página (fin del trigger).
  ScrollTrigger.create({
    start: 80,
    end: 'max',
    onEnter: () => header.classList.add('header-desplazado'),
    onLeaveBack: () => header.classList.remove('header-desplazado'),
  });
}
