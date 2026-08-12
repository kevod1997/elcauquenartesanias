(function () {
  'use strict';

  var TELEFONO = '542284580320';
  var INSTAGRAM = '@elcauquen_artesanias/';

  /* Cada imagen existe en tres tamaños: completo (visor), -640 (grilla)
     y -160 (swatches y tira de miniaturas). */
  function img(base, tam) {
    return 'assets/' + base + (tam ? '-' + tam : '') + '.webp';
  }

  var mates = [
    { base: 'mate-floral', label: 'Fleje floral' },
    { base: 'mate-pampa', label: 'Fleje pampa' },
    { base: 'mate-greca', label: 'Fleje greca' },
    { base: 'mate-aves', label: 'Fleje aves' }
  ];

  var productos = [
    {
      nombre: 'Cazuelas artesanales', precio: '$5.000', placa: 'cazuelas-placa',
      desc: 'Madera maciza de guayubira con terminación de alta calidad. Ideales para aceitunas, frutos secos, salsas y condimentos.',
      medidas: ['Ø 13 cm', 'Alto 4 cm']
    },
    {
      nombre: 'Cuencos o bowls', precio: '$7.000', placa: 'cuencos-placa',
      desc: 'Torneados a mano, pequeños y versátiles. Vetas y tonos irrepetibles en cada pieza.',
      medidas: ['Ø 12 cm', 'Alto 7 cm']
    },
    {
      nombre: 'Bowls de guayubira', precio: '$12.000', placa: 'bowls-placa',
      desc: 'Acabado natural que realza las vetas. Para ensaladas, frutas, picadas, panes y postres.',
      medidas: ['Ø 23 cm', 'Alto 4 cm']
    },
    {
      nombre: 'Ensaladeras', precio: '$13.000', placa: 'ensaladeras-placa',
      desc: 'Belleza natural y diseño atemporal para la mesa. Acabado suave, ideales para uso diario.',
      medidas: ['Ø 22,5 cm', 'Alto 4 cm']
    },
    {
      nombre: 'Platos cóncavos', precio: '$8.000', placa: 'concavos-placa',
      desc: 'Hechos para compartir: quesos, fiambres, aceitunas y snacks. Resistentes y fáciles de mantener.',
      medidas: ['Ø 19 cm', 'Alto 4 y 3,5 cm']
    },
    {
      nombre: 'Plato para asado', precio: '$9.000', placa: 'asado-placa',
      desc: 'Con borde interior que evita derrames y realza la presentación. Para asados, picadas y parrilladas.',
      medidas: ['Ø 23 cm', 'Alto 2 cm']
    },
    {
      nombre: 'Mate de caldén', precio: '$15.000', placa: 'mate-placa',
      desc: 'Madera de caldén, reconocida por su dureza y belleza natural, con fleje de alpaca grabado. Cuatro Diseños para elegir.',
      medidas: ['Ø interior 5 cm', 'Prof. 6 cm'],
      variantes: mates
    },
    {
      nombre: 'Mortero de palo santo', precio: '$14.000', placa: 'mortero-placa',
      desc: 'Tallado a mano en palo santo, apreciado por su dureza y su aroma. Para especias, semillas y hierbas.',
      medidas: ['Ø exterior 10,5 cm', 'Alto 12 cm']
    },
    {
      nombre: 'Pinchos para picadas', precio: '$6.000', placa: 'pinchos-placa',
      desc: 'Juego con base torneada y dos modelos de pincho. Un detalle práctico para tapas y aperitivos.',
      medidas: ['Alto base 7,5 cm', 'Largo 9 cm']
    }
  ];

  function wa(txt) {
    return 'https://wa.me/' + TELEFONO + '?text=' + encodeURIComponent(txt);
  }

  var ICONO_WA = '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"></path></svg>';

  var ICONO_LUPA = '<svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" aria-hidden="true"><circle cx="6" cy="6" r="4.6"></circle><path d="M9.4 9.4L13 13"></path></svg>';

  /* ---------- Catálogo ---------- */

  function crearTarjeta(p) {
    var art = document.createElement('article');
    art.className = 'card';

    var foto = document.createElement('button');
    foto.type = 'button';
    foto.className = 'card__foto';
    foto.setAttribute('aria-label', 'Ver ficha completa de ' + p.nombre);

    var imagen = document.createElement('img');
    imagen.src = img(p.placa, 640);
    imagen.width = 640;
    imagen.height = 640;
    imagen.alt = 'Ficha de ' + p.nombre;
    imagen.loading = 'lazy';
    imagen.decoding = 'async';
    foto.appendChild(imagen);

    var lupa = document.createElement('span');
    lupa.className = 'card__lupa';
    lupa.innerHTML = ICONO_LUPA + '<span>Ver ficha</span>';
    foto.appendChild(lupa);

    foto.addEventListener('click', function () { abrir(p, 0); });
    art.appendChild(foto);

    var body = document.createElement('div');
    body.className = 'card__body';

    var head = document.createElement('div');
    head.className = 'card__head';
    var h3 = document.createElement('h3');
    h3.className = 'card__nombre';
    h3.textContent = p.nombre;
    var precio = document.createElement('span');
    precio.className = 'card__precio';
    precio.textContent = p.precio;
    head.appendChild(h3);
    head.appendChild(precio);
    body.appendChild(head);

    var desc = document.createElement('p');
    desc.className = 'card__desc';
    desc.textContent = p.desc;
    body.appendChild(desc);

    var medidas = document.createElement('div');
    medidas.className = 'medidas';
    p.medidas.forEach(function (m) {
      var chip = document.createElement('span');
      chip.textContent = m;
      medidas.appendChild(chip);
    });
    body.appendChild(medidas);

    if (p.variantes) {
      var bloque = document.createElement('div');
      bloque.className = 'variantes';
      var label = document.createElement('span');
      label.className = 'variantes__label';
      label.textContent = 'Diseños';
      var lista = document.createElement('div');
      lista.className = 'variantes__lista';
      p.variantes.forEach(function (v, vi) {
        var b = document.createElement('button');
        b.type = 'button';
        b.title = v.label;
        b.setAttribute('aria-label', 'Ver ' + v.label.toLowerCase());
        var vimg = document.createElement('img');
        vimg.src = img(v.base, 160);
        vimg.width = 160;
        vimg.height = 160;
        vimg.alt = v.label;
        vimg.loading = 'lazy';
        vimg.decoding = 'async';
        b.appendChild(vimg);
        b.addEventListener('click', function () { abrir(p, vi + 1); });
        lista.appendChild(b);
      });
      bloque.appendChild(label);
      bloque.appendChild(lista);
      body.appendChild(bloque);
    }

    var link = document.createElement('a');
    link.className = 'btn-wa';
    link.href = wa('Hola! Vi ' + p.nombre.toLowerCase() + ' y me interesa comprar. ¿Tenés disponibilidad?');
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.innerHTML = ICONO_WA + ' Consultar por WhatsApp';
    body.appendChild(link);

    art.appendChild(body);
    return art;
  }

  /* ---------- Visor ---------- */

  var visor = document.getElementById('visor');
  var visorTitulo = document.getElementById('visorTitulo');
  var visorContador = document.getElementById('visorContador');
  var visorTiras = document.getElementById('visorTiras');
  var capas = [document.getElementById('visorFotoA'), document.getElementById('visorFotoB')];
  var panel = visor.querySelector('.visor__panel');

  var items = [];
  var idx = 0;
  var activa = 0;

  function abrir(producto, i) {
    items = [{ base: producto.placa, previa: 640, label: 'Ficha · ' + producto.nombre }]
      .concat((producto.variantes || []).map(function (v) {
        return { base: v.base, previa: 160, label: v.label };
      }));
    idx = i || 0;
    visor.classList.toggle('visor--unica', items.length <= 1);
    document.body.style.overflow = 'hidden';
    pintarTiras();

    /* Arranca con el tamaño que la tarjeta ya dejó en caché: el visor abre
       con imagen desde el primer cuadro y la completa entra en el fundido. */
    var previa = capas[activa];
    previa.src = img(items[idx].base, items[idx].previa);
    previa.alt = items[idx].label;
    previa.classList.add('is-activa');

    visor.showModal();
    pintar();
  }

  function cerrar() {
    if (visor.classList.contains('is-closing')) return;
    visor.classList.add('is-closing');

    var terminar = function () {
      visor.close();
      visor.classList.remove('is-closing');
      document.body.style.overflow = '';
    };

    /* La propiedad `overlay` es solo Chrome, así que el cierre se espera a mano.
       El temporizador cubre el caso en que transitionend no llegue a dispararse. */
    var hecho = false;
    var unaVez = function (e) {
      if (e && e.target !== panel) return;
      if (hecho) return;
      hecho = true;
      panel.removeEventListener('transitionend', unaVez);
      terminar();
    };
    panel.addEventListener('transitionend', unaVez);
    setTimeout(unaVez, 450);
  }

  function mover(d) {
    var n = items.length || 1;
    idx = (idx + d + n) % n;
    pintar();
  }

  function pintarTiras() {
    visorTiras.innerHTML = '';
    items.forEach(function (it, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.title = it.label;
      b.setAttribute('aria-label', it.label);
      b.style.backgroundImage = 'url("' + img(it.base, 160) + '")';
      b.addEventListener('click', function () { idx = i; pintar(); });
      visorTiras.appendChild(b);
    });
  }

  function pintar() {
    var actual = items[idx];
    if (!actual) return;

    var src = img(actual.base);
    var entrante = capas[1 - activa];
    var saliente = capas[activa];

    entrante.src = src;
    entrante.alt = actual.label;

    var aplicar = function () {
      saliente.classList.remove('is-activa');
      saliente.setAttribute('aria-hidden', 'true');
      saliente.alt = '';
      entrante.classList.add('is-activa');
      entrante.removeAttribute('aria-hidden');
      activa = 1 - activa;
      precargarVecinas();
    };

    if (entrante.decode) entrante.decode().then(aplicar, aplicar);
    else aplicar();

    visorTitulo.textContent = actual.label;
    visorContador.textContent = (idx + 1) + ' / ' + items.length;
    Array.prototype.forEach.call(visorTiras.children, function (b, i) {
      b.setAttribute('aria-current', i === idx ? 'true' : 'false');
    });
  }

  /* Precarga las vecinas para que el fundido no tenga que esperar la red.
     Se dispara con el visor ya abierto, así que no compite con la portada. */
  function precargarVecinas() {
    if (items.length < 2) return;
    [-1, 1].forEach(function (d) {
      var v = items[(idx + d + items.length) % items.length];
      if (!v) return;
      var pre = new Image();
      pre.fetchPriority = 'low';
      pre.src = img(v.base);
    });
  }

  /* ---------- Controles ---------- */

  visor.addEventListener('click', function (e) {
    if (e.target === visor) cerrar();
  });

  visor.addEventListener('cancel', function (e) {
    e.preventDefault();   /* Esc: cerramos con la animación, no de golpe */
    cerrar();
  });

  visor.querySelector('[data-cerrar]').addEventListener('click', cerrar);
  document.getElementById('btnAnterior').addEventListener('click', function () { mover(-1); });
  document.getElementById('btnSiguiente').addEventListener('click', function () { mover(1); });

  visor.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowRight') mover(1);
    if (e.key === 'ArrowLeft') mover(-1);
  });

  /* ---------- Arranque ---------- */

  var grid = document.getElementById('grid');
  var filasMobile = [[0, 1, 2, 3], [4, 5, 7, 8], [6]];

  filasMobile.forEach(function (indices) {
    var fila = document.createElement('div');
    fila.className = 'product-row' + (indices.length === 1 ? ' product-row--single' : '');

    var carril = document.createElement('div');
    carril.className = 'product-row__track';

    indices.forEach(function (indice) {
      var tarjeta = crearTarjeta(productos[indice]);
      /* display: contents deja estas tarjetas como items directos de la grilla
         en desktop; order recupera allÃ­ el orden original del catÃ¡logo. */
      tarjeta.style.setProperty('--orden-producto', indice);
      carril.appendChild(tarjeta);
    });

    fila.appendChild(carril);

    if (indices.length > 1) {
      var retroceder = document.createElement('button');
      retroceder.className = 'product-row__arrow product-row__arrow--prev is-hidden';
      retroceder.type = 'button';
      retroceder.disabled = true;
      retroceder.setAttribute('aria-label', 'Ver productos anteriores de esta hilera');
      retroceder.innerHTML = '<svg width="11" height="18" viewBox="0 0 11 18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 1L2 9l7 8"></path></svg>';

      var avanzar = document.createElement('button');
      avanzar.className = 'product-row__arrow product-row__arrow--next';
      avanzar.type = 'button';
      avanzar.setAttribute('aria-label', 'Ver mÃ¡s productos de esta hilera');
      avanzar.innerHTML = '<svg width="11" height="18" viewBox="0 0 11 18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 1l7 8-7 8"></path></svg>';
      fila.appendChild(retroceder);
      fila.appendChild(avanzar);

      var actualizarFlechas = function () {
        var estaAlInicio = carril.scrollLeft <= 2;
        var llegoAlFinal = carril.scrollLeft >= carril.scrollWidth - carril.clientWidth - 2;
        retroceder.classList.toggle('is-hidden', estaAlInicio);
        avanzar.classList.toggle('is-hidden', llegoAlFinal);
        retroceder.disabled = estaAlInicio;
        avanzar.disabled = llegoAlFinal;
      };

      var moverHilera = function (direccion) {
        var tarjeta = carril.querySelector('.card');
        var distancia = tarjeta ? tarjeta.getBoundingClientRect().width + 14 : carril.clientWidth;
        var reducirMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        carril.scrollBy({ left: direccion * distancia, behavior: reducirMovimiento ? 'auto' : 'smooth' });
      };

      carril.addEventListener('scroll', actualizarFlechas, { passive: true });
      retroceder.addEventListener('click', function () {
        moverHilera(-1);
      });
      avanzar.addEventListener('click', function () {
        moverHilera(1);
      });

      if ('IntersectionObserver' in window) {
        var observador = new IntersectionObserver(function (entradas) {
          if (entradas[0].isIntersecting) {
            avanzar.classList.add('is-prompting');
            observador.disconnect();
          }
        }, { threshold: 0.45 });
        observador.observe(fila);
      } else {
        avanzar.classList.add('is-prompting');
      }

      requestAnimationFrame(actualizarFlechas);
    }

    grid.appendChild(fila);
  });

  /* Los accesos del hero y los de la sección de contacto son los mismos
     destinos, así que se resuelven juntos por atributo. */
  var hrefWa = wa('Hola! Vi la página de El Cauquén Artesanías y quería hacer una consulta.');
  var hrefIg = 'https://instagram.com/' + INSTAGRAM.replace('@', '');

  Array.prototype.forEach.call(document.querySelectorAll('[data-wa]'), function (a) {
    a.href = hrefWa;
  });

  Array.prototype.forEach.call(document.querySelectorAll('[data-ig]'), function (a) {
    a.href = hrefIg;
    a.title = INSTAGRAM;
  });
})();
