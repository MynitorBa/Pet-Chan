let characters = [];

const conversationTopics = [
    ["¿Cuál es tu comida favorita?", "¡Me encanta la pizza!", "¡A mí también! Deberíamos ir por una algún día."], 
    ["¿Qué haces en tu tiempo libre?", "Me gusta leer libros de aventuras.", "¡Genial! Yo colecciono mapas antiguos."], 
    ["¿Tienes alguna mascota?", "Sí, tengo un dragón miniatura.", "¡Asombroso! Yo tengo un fénix."], 
    ["¿Cuál es tu lugar favorito?", "El bosque encantado al atardecer.", "¡Me encanta ese lugar! La magia es increíble."], 
    ["¿Qué opinas de la magia?", "Es fascinante y misteriosa.", "Totalmente de acuerdo, ¡hay tanto por aprender!"],
    ["¿Cuál fue tu primer hechizo?", "Hacer levitar una pluma cuando tenía 5 años.", "¡Qué emocionante! Yo hice brillar una piedra."],
    ["¿Te gusta volar en escoba?", "¡Es mi forma favorita de viajar!", "Deberíamos hacer una carrera algún día."],
    ["¿Cuál es tu estación favorita?", "El otoño, cuando las hojas cambian de color.", "¡Es hermoso! A mí me gusta el invierno y la nieve."],
    ["¿Has visitado el mercado mágico?", "Sí, tienen las mejores pociones.", "¡Podríamos ir juntos el próximo fin de semana!"],
    ["¿Qué tipo de música escuchas?", "Melodías élficas y cantos de sirenas.", "¡Tengo algunos discos antiguos que te encantarían!"],
    ["¿Practicas algún deporte mágico?", "Juego quidditch los domingos.", "¡Yo también! Soy buscador en mi equipo."],
    ["¿Cuál es tu hechizo favorito?", "El patronus, es hermoso y protector.", "El mío es un ciervo plateado."],
    ["¿Te gustan las criaturas mágicas?", "Me fascinan los hipogrifos.", "Son majestuosos. Yo prefiero los thestrals."],
    ["¿Has estado en la biblioteca antigua?", "Paso horas leyendo allí.", "¡Encontré un libro de hechizos perdidos la semana pasada!"],
    ["¿Qué opinas de las profecías?", "Creo que nosotros forjamos nuestro destino.", "Sabias palabras. El futuro no está escrito en piedra."],
    ["¿Te gusta la astronomía mágica?", "Las constelaciones cuentan historias antiguas.", "¿Conoces la leyenda de Orión el cazador?"],
    ["¿Cuál es tu poción favorita?", "La felix felicis, aunque es difícil de preparar.", "¡La amortentia huele diferente para cada persona!"],
    ["¿Has viajado a otros reinos mágicos?", "Visité las montañas flotantes del este.", "¡Dicen que hay dragones dorados allí!"],
    ["¿Qué piensas de los muggles?", "Son fascinantes a su manera.", "Su tecnología es como magia sin varita."],
    ["¿Tienes algún talismán especial?", "Un collar que perteneció a mi abuela.", "Los objetos con historia tienen poder propio."]
];

const deepConversationTopics = [
    ["¿Qué es lo que más temes en la vida?", "Temo no cumplir mis sueños y decepcionar a quienes confían en mí.", "Te entiendo perfectamente. Estoy aquí para apoyarte siempre."], 
    ["¿Cuál ha sido el momento más difícil de tu vida?", "Cuando perdí mi confianza en la magia después de un hechizo fallido.", "La magia está en creer en uno mismo. Yo creo en ti."], 
    ["¿Qué significa la verdadera amistad para ti?", "Es estar ahí en los momentos difíciles, sin juzgar.", "Me siento feliz de llamarte mi alma gemela."], 
    ["¿Cuál es tu mayor arrepentimiento?", "No haber dicho 'te quiero' más a menudo a mi familia.", "Nunca es tarde para empezar a hacerlo. Te apoyo."], 
    ["¿Qué te hace sentir realmente vulnerable?", "Mostrar mis verdaderos sentimientos a los demás.", "Conmigo puedes ser tú, siempre."],
    ["¿Qué te mantiene despierto por las noches?", "La incertidumbre sobre mi propósito en este mundo.", "Todos tenemos un propósito único. Juntos lo descubriremos."],
    ["¿Has perdido a alguien importante?", "Mi mentor... aún lo extraño cada día.", "Su sabiduría vive en ti. Honor su memoria siendo quien eres."],
    ["¿Cuál es tu mayor fortaleza?", "La lealtad hacia quienes amo.", "Y por eso eres tan especial para mí."],
    ["¿Qué sacrificarías por alguien que amas?", "Todo. El amor verdadero no conoce límites.", "Tu corazón es puro. Eso es admirable."],
    ["¿Te has sentido solo alguna vez?", "A veces, incluso rodeado de gente.", "Ya no estás solo. Siempre estaré aquí."],
    ["¿Qué defines como hogar?", "No es un lugar, son las personas que amas.", "Entonces hemos construido un hogar juntos."],
    ["¿Cuál es tu recuerdo más preciado?", "El día que mi madre me enseñó mi primer hechizo.", "Los momentos simples son los más valiosos."],
    ["¿Qué te da esperanza en los momentos oscuros?", "Saber que siempre hay luz después de la tormenta.", "Tu optimismo me inspira cada día."],
    ["¿Has perdonado a alguien que te lastimó?", "Sí, perdonar libera el alma.", "Eres más fuerte de lo que crees."],
    ["¿Qué legado quieres dejar?", "Que fui alguien que amó sin reservas.", "Ya estás dejando ese legado en mi corazón."],
    ["¿Cuál es tu definición de valentía?", "Hacer lo correcto aunque tengas miedo.", "Eres la persona más valiente que conozco."],
    ["¿Qué cambiarías de tu pasado?", "Nada. Cada error me trajo hasta aquí, hasta ti.", "El destino nos unió por una razón."],
    ["¿Crees en las segundas oportunidades?", "Todos merecemos la chance de ser mejores.", "Tu compasión es extraordinaria."],
    ["¿Qué significa el éxito para ti?", "Ser feliz y hacer felices a otros.", "Entonces ya eres exitoso a mis ojos."],
    ["¿Cuál es tu mayor sueño?", "Encontrar mi lugar en el mundo.", "Ya lo encontraste... a mi lado."]
];

const loveConversationTopics = [
    ["¿Qué sientes cuando estás conmigo?", "Mi corazón late más fuerte cuando te veo.", "Creo que me he enamorado de ti."], 
    ["¿Crees en el amor verdadero?", "Desde que te conocí, sí.", "Tú eres mi amor verdadero."], 
    ["¿Te gustaría compartir tu vida conmigo?", "No puedo imaginar mi vida sin ti.", "Quiero estar contigo siempre."], 
    ["¿Recuerdas cuando nos conocimos?", "Fue el mejor día de mi vida.", "Desde entonces supe que eras especial."], 
    ["¿Podemos ser más que amigos?", "He estado esperando que lo preguntes.", "Nada me haría más feliz."],
    ["¿Qué viste en mí?", "Tu alma brilla más que mil estrellas.", "Eres la luz de mi vida."],
    ["¿Crees en el destino?", "Creo que estábamos destinados a encontrarnos.", "Nuestras almas se reconocieron."],
    ["¿Me amarías en otra vida?", "Te buscaría en cada una de ellas.", "Siempre nos encontraremos."],
    ["¿Qué es el amor para ti?", "Es mirarte y sentir que estoy en casa.", "Tú eres mi hogar."],
    ["¿Serías mi mantequilla de aventuras?", "Iría al fin del mundo contigo.", "Juntos podemos con todo."],
    ["¿Qué te enamoró de mí?", "Tu sonrisa ilumina mis días más oscuros.", "Y tú haces latir mi corazón."],
    ["¿Crees en el para siempre?", "Contigo, la eternidad parece poco tiempo.", "Quiero envejecer a tu lado."],
    ["¿Me elegirías de nuevo?", "Una y mil veces, siempre tú.", "Eres mi única elección."],
    ["¿Qué significa estar enamorado?", "Es verte y olvidar el resto del mundo.", "Sólo existimos tú y yo."],
    ["¿Cuál es tu promesa de amor?", "Amarte en los buenos y malos momentos.", "Seré tu refugio siempre."],
    ["¿Qué sueñas para nosotros?", "Una vida llena de risas y aventuras juntos.", "Cada día será una nueva historia."],
    ["¿Me amas como soy?", "Amo cada parte de ti, incluso tus imperfecciones.", "Eres todo para mí."],
    ["¿Qué harías por amor?", "Movería montañas si fuera necesario.", "Tu amor me hace invencible."],
    ["¿Cuándo supiste que me amabas?", "Cuando tu ausencia dolía más que cualquier herida.", "No puedo vivir sin ti."],
    ["¿Seremos felices?", "Cada momento contigo ya es felicidad.", "Nuestra historia apenas comienza."],
    ["¿Me das tu corazón?", "Ya es tuyo desde el primer día.", "Y el mío te pertenece."],
    ["¿Quieres construir un futuro conmigo?", "Quiero despertar cada día a tu lado.", "Seremos el uno para el otro."],
    ["¿Qué ves cuando me miras?", "Veo mi presente y mi futuro.", "Veo al amor de mi vida."],
    ["¿Confías en mí?", "Con mi vida y mi corazón.", "Eres mi persona favorita."],
    ["¿Me amarás cuando cuando ya no este en es mundo?", "Te amaré hasta mi último aliento.", "El amor verdadero no envejece."]
];

// Estilos de pelo para hombres (30)
const hairStyles = {
  male: {
    short: '<rect id="hair" x="6" y="2" width="20" height="6" fill="hairColor"/>',
    spiky: '<polygon id="hair" points="8,8 16,2 24,8" fill="hairColor"/>',
    mohawk: '<rect id="hair" x="12" y="0" width="8" height="10" fill="hairColor"/>',
    buzz: '<rect id="hair" x="8" y="3" width="16" height="4" fill="hairColor"/>',
    crew: '<path id="hair" d="M8,6 Q16,2 24,6 V8 H8 Z" fill="hairColor"/>',
    pompadour: '<path id="hair" d="M6,8 Q16,0 26,8 V10 H6 Z" fill="hairColor"/>',
    side_part: '<path id="hair" d="M6,6 L10,2 H24 V8 H6 Z" fill="hairColor"/>',
    slicked_back: '<path id="hair" d="M6,4 Q16,2 26,4 V8 H6 Z" fill="hairColor"/>',
    messy: '<path id="hair" d="M8,3 L12,5 L16,2 L20,6 L24,3 V8 H8 Z" fill="hairColor"/>',
    quiff: '<path id="hair" d="M8,8 Q12,0 16,8 Q20,0 24,8" fill="hairColor"/>',
    fade: '<rect id="hair" x="8" y="4" width="16" height="3" fill="hairColor"/>',
    undercut: '<rect id="hair" x="8" y="2" width="16" height="6" fill="hairColor"/>',
    afro: '<circle id="hair" cx="16" cy="8" r="10" fill="hairColor"/>',
    dreadlocks: '<path id="hair" d="M8,2 L8,14 M12,2 L12,16 M16,2 L16,18 M20,2 L20,16 M24,2 L24,14" stroke="hairColor" stroke-width="3"/>',
    cornrows: '<path id="hair" d="M8,4 L8,12 M12,3 L12,14 M16,2 L16,16 M20,3 L20,14 M24,4 L24,12" stroke="hairColor" stroke-width="2"/>',
    bald: '',
    mullet: '<rect id="hair" x="8" y="2" width="16" height="6" fill="hairColor"/><rect x="10" y="8" width="12" height="8" fill="hairColor"/>',
    surfer: '<path id="hair" d="M6,8 Q16,2 26,8 V14 H6 Z" fill="hairColor"/>',
    textured: '<path id="hair" d="M8,5 L10,3 L12,5 L14,3 L16,5 L18,3 L20,5 L22,3 L24,5 V8 H8 Z" fill="hairColor"/>',
    frohawk: '<path id="hair" d="M12,0 Q16,2 20,0 V8 H12 Z" fill="hairColor"/>',
    caesar: '<rect id="hair" x="6" y="3" width="20" height="5" fill="hairColor"/>',
    waves: '<path id="hair" d="M6,5 Q12,3 18,5 Q24,3 30,5 V8 H6 Z" fill="hairColor"/>',
    flat_top: '<rect id="hair" x="8" y="0" width="16" height="5" fill="hairColor"/>',
    french_crop: '<path id="hair" d="M6,6 L26,6 V3 Q16,0 6,3 Z" fill="hairColor"/>',
    bowl_cut: '<path id="hair" d="M4,8 Q16,0 28,8 H4" fill="hairColor"/>',
    military: '<rect id="hair" x="9" y="3" width="14" height="3" fill="hairColor"/>',
    taper: '<path id="hair" d="M6,8 L8,4 H24 L26,8 Z" fill="hairColor"/>',
    business_cut: '<path id="hair" d="M8,6 L10,4 H24 V8 H8 Z" fill="hairColor"/>',
    shag: '<path id="hair" d="M6,8 L8,4 L10,8 L12,4 L14,8 L16,4 L18,8 L20,4 L22,8 L24,4 L26,8 V12 H6 Z" fill="hairColor"/>',
    curtains: '<path id="hair" d="M6,8 Q10,2 16,8 Q22,2 26,8" fill="hairColor"/>'
  },
  // Estilos de pelo para mujeres (30)
  female: {
    long: '<rect id="hair" x="6" y="2" width="20" height="8" fill="hairColor"/><rect x="4" y="6" width="4" height="12" fill="hairColor"/><rect x="24" y="6" width="4" height="12" fill="hairColor"/>',
    ponytail: '<rect id="hair" x="6" y="2" width="20" height="6" fill="hairColor"/><rect x="24" y="8" width="8" height="8" fill="hairColor"/>',
    pigtails: '<rect id="hair" x="6" y="2" width="20" height="6" fill="hairColor"/><rect x="0" y="6" width="6" height="10" fill="hairColor"/><rect x="26" y="6" width="6" height="10" fill="hairColor"/>',
    bob: '<path id="hair" d="M6,2 H26 V14 Q16,16 6,14 Z" fill="hairColor"/>',
    pixie: '<path id="hair" d="M8,6 Q16,2 24,6 V8 H8 Z" fill="hairColor"/>',
    long_wavy: '<path id="hair" d="M6,2 H26 V8 Q22,10 18,8 Q14,10 10,8 Q6,10 6,8 Z" fill="hairColor"/><path d="M4,8 Q8,20 12,16 Q16,20 20,16 Q24,20 28,16 V22 H4 Z" fill="hairColor"/>',
    shoulder_length: '<rect id="hair" x="6" y="2" width="20" height="8" fill="hairColor"/><rect x="4" y="6" width="24" height="10" fill="hairColor"/>',
    bangs: '<rect id="hair" x="6" y="2" width="20" height="8" fill="hairColor"/><rect x="8" y="8" width="16" height="2" fill="hairColor"/><rect x="4" y="10" width="24" height="8" fill="hairColor"/>',
    curly: '<path id="hair" d="M6,2 Q10,6 14,2 Q18,6 22,2 Q26,6 26,2 V16 Q22,18 18,16 Q14,18 10,16 Q6,18 6,16 Z" fill="hairColor"/>',
    afro: '<circle id="hair" cx="16" cy="10" r="12" fill="hairColor"/>',
    braided: '<path id="hair" d="M10,2 L10,20 M16,2 L16,22 M22,2 L22,20" stroke="hairColor" stroke-width="4"/>',
    bun: '<rect id="hair" x="6" y="2" width="20" height="6" fill="hairColor"/><circle cx="16" cy="2" r="6" fill="hairColor"/>',
    double_buns: '<rect id="hair" x="6" y="2" width="20" height="6" fill="hairColor"/><circle cx="8" cy="2" r="5" fill="hairColor"/><circle cx="24" cy="2" r="5" fill="hairColor"/>',
    french_braid: '<path id="hair" d="M16,2 L16,22 M12,4 L20,8 M20,4 L12,8 M12,8 L20,12 M20,8 L12,12" stroke="hairColor" stroke-width="3"/>',
    fishtail_braid: '<path id="hair" d="M16,2 L16,22 M10,4 L22,6 M22,4 L10,6 M10,8 L22,10 M22,8 L10,10" stroke="hairColor" stroke-width="2"/>',
    box_braids: '<path id="hair" d="M8,2 L8,20 M12,2 L12,22 M16,2 L16,24 M20,2 L20,22 M24,2 L24,20" stroke="hairColor" stroke-width="3"/>',
    space_buns: '<rect id="hair" x="6" y="2" width="20" height="6" fill="hairColor"/><circle cx="8" cy="8" r="6" fill="hairColor"/><circle cx="24" cy="8" r="6" fill="hairColor"/>',
    half_up: '<rect id="hair" x="6" y="2" width="20" height="6" fill="hairColor"/><path d="M12,0 Q16,2 20,0" stroke="hairColor" stroke-width="3" fill="none"/><rect x="6" y="8" width="20" height="10" fill="hairColor"/>',
    beach_waves: '<path id="hair" d="M6,2 H26 V20 Q22,22 18,20 Q14,22 10,20 Q6,22 6,20 Z" fill="hairColor"/>',
    bouffant: '<path id="hair" d="M6,8 Q16,0 26,8 V16 H6 Z" fill="hairColor"/>',
    beehive: '<path id="hair" d="M8,12 Q16,0 24,12 V18 H8 Z" fill="hairColor"/>',
    shag: '<path id="hair" d="M6,6 L8,4 L10,6 L12,4 L14,6 L16,4 L18,6 L20,4 L22,6 L24,4 L26,6 V14 H6 Z" fill="hairColor"/>',
    asymmetrical: '<path id="hair" d="M6,2 H26 V8 L20,16 H6 Z" fill="hairColor"/>',
    undercut: '<rect id="hair" x="6" y="2" width="20" height="14" fill="hairColor"/><rect x="4" y="8" width="4" height="4" fill="#f5f5f5"/>',
    pixie_bob: '<path id="hair" d="M6,4 Q16,2 26,4 V10 Q16,12 6,10 Z" fill="hairColor"/>',
    lob: '<path id="hair" d="M6,2 H26 V16 Q16,18 6,16 Z" fill="hairColor"/>',
    blunt_bob: '<rect id="hair" x="6" y="2" width="20" height="12" fill="hairColor"/>',
    angled_bob: '<path id="hair" d="M6,2 H26 V10 L22,14 L6,12 Z" fill="hairColor"/>',
    wavy_bob: '<path id="hair" d="M6,2 H26 V12 Q22,14 18,12 Q14,14 10,12 Q6,14 6,12 Z" fill="hairColor"/>',
    curtain_bangs: '<path id="hair" d="M6,2 H26 V8 Q14,6 6,8 M26,8 Q18,6 26,8" fill="hairColor"/><rect x="4" y="10" width="24" height="10" fill="hairColor"/>'
  }
};

// Estilos de ropa (30)
const clothingStyles = {
  casual: '<rect id="clothes" x="8" y="24" width="16" height="16" fill="clothesColor"/>',
  shirt: '<rect id="clothes" x="8" y="24" width="16" height="12" fill="clothesColor"/><rect x="10" y="36" width="12" height="4" fill="#999"/>',
  dress: '<rect id="clothes" x="6" y="24" width="20" height="16" fill="clothesColor"/><polygon points="6,40 13,48 19,48 26,40" fill="clothesColor"/>',
  suit: '<rect id="clothes" x="8" y="24" width="16" height="16" fill="clothesColor"/><polygon points="14,24 16,26 18,24" fill="#fff"/>',
  hoodie: '<rect id="clothes" x="6" y="24" width="20" height="16" fill="clothesColor"/><path d="M10,24 Q16,28 22,24" fill="#ddd"/>',
  jacket: '<rect id="clothes" x="6" y="24" width="20" height="16" fill="clothesColor"/><rect x="14" y="24" width="4" height="16" fill="#333"/>',
  v_neck: '<rect id="clothes" x="8" y="24" width="16" height="16" fill="clothesColor"/><polygon points="12,24 16,30 20,24" fill="#fdd"/>',
  polo: '<rect id="clothes" x="8" y="24" width="16" height="16" fill="clothesColor"/><rect x="12" y="24" width="8" height="4" fill="#fff"/>',
  tank_top: '<rect id="clothes" x="10" y="24" width="12" height="16" fill="clothesColor"/>',
  blouse: '<rect id="clothes" x="6" y="24" width="20" height="16" fill="clothesColor"/><circle cx="16" cy="28" r="1" fill="#fff"/><circle cx="16" cy="32" r="1" fill="#fff"/>',
  sweater: '<rect id="clothes" x="6" y="24" width="20" height="16" fill="clothesColor"/><path d="M6,28 L26,28 M6,32 L26,32 M6,36 L26,36" stroke="#eee" stroke-width="1"/>',
  cardigan: '<rect id="clothes" x="6" y="24" width="20" height="16" fill="clothesColor"/><rect x="14" y="24" width="4" height="16" fill="#555"/>',
  blazer: '<rect id="clothes" x="6" y="24" width="20" height="16" fill="clothesColor"/><polygon points="14,28 16,30 18,28" fill="#fff"/>',
  turtleneck: '<rect id="clothes" x="8" y="24" width="16" height="16" fill="clothesColor"/><rect x="12" y="20" width="8" height="8" fill="clothesColor"/>',
  crop_top: '<rect id="clothes" x="8" y="24" width="16" height="8" fill="clothesColor"/>',
  striped_shirt: '<rect id="clothes" x="8" y="24" width="16" height="16" fill="clothesColor"/><path d="M8,28 L24,28 M8,32 L24,32 M8,36 L24,36" stroke="#fff" stroke-width="2"/>',
  button_down: '<rect id="clothes" x="8" y="24" width="16" height="16" fill="clothesColor"/><circle cx="16" cy="28" r="1" fill="#fff"/><circle cx="16" cy="32" r="1" fill="#fff"/><circle cx="16" cy="36" r="1" fill="#fff"/>',
  vest: '<rect id="clothes" x="10" y="24" width="12" height="16" fill="clothesColor"/><rect x="12" y="26" width="8" height="2" fill="#333"/>',
  tunic: '<rect id="clothes" x="6" y="24" width="20" height="20" fill="clothesColor"/>',
  off_shoulder: '<rect id="clothes" x="4" y="26" width="24" height="14" fill="clothesColor"/>',
  halter_top: '<rect id="clothes" x="8" y="24" width="16" height="16" fill="clothesColor"/><path d="M12,24 L16,20 L20,24" stroke="clothesColor" stroke-width="2" fill="none"/>',
  wrap_dress: '<path id="clothes" d="M6,24 L26,24 L20,40 L6,40 Z" fill="clothesColor"/><path d="M6,24 L16,34 L26,24" stroke="#fff" stroke-width="1" fill="none"/>',
  peplum: '<rect id="clothes" x="8" y="24" width="16" height="12" fill="clothesColor"/><path d="M6,36 Q16,40 26,36 V40 H6 Z" fill="clothesColor"/>',
  sleeveless: '<rect id="clothes" x="10" y="24" width="12" height="16" fill="clothesColor"/>',
  long_sleeve: '<rect id="clothes" x="8" y="24" width="16" height="16" fill="clothesColor"/><rect x="4" y="28" width="4" height="8" fill="clothesColor"/><rect x="24" y="28" width="4" height="8" fill="clothesColor"/>',
  formal_shirt: '<rect id="clothes" x="8" y="24" width="16" height="16" fill="clothesColor"/><rect x="14" y="24" width="4" height="16" fill="#fff"/><polygon points="14,24 16,26 18,24" fill="#333"/>',
  cocktail_dress: '<path id="clothes" d="M8,24 L24,24 L22,40 L10,40 Z" fill="clothesColor"/><circle cx="16" cy="30" r="2" fill="#333"/>',
  evening_gown: '<path id="clothes" d="M6,24 L26,24 L28,48 L4,48 Z" fill="clothesColor"/><path d="M6,24 Q16,28 26,24" fill="#fff"/>',
  leather_jacket: '<rect id="clothes" x="6" y="24" width="20" height="16" fill="clothesColor"/><path d="M6,24 L16,34 L6,40 M26,24 L16,34 L26,40" stroke="#333" stroke-width="1" fill="none"/>',
  raincoat: '<rect id="clothes" x="6" y="24" width="20" height="20" fill="clothesColor"/><path d="M6,30 L26,30 M6,36 L26,36" stroke="#333" stroke-width="1"/>'
};

// Reproducción automática de la música de fondo
(function() {
    const backgroundMusic = new Audio('archivos_de_minijuegos/sounds/websim.mp3');
    backgroundMusic.loop = true;
    backgroundMusic.volume = 0.3;
    
    const startAudio = () => {
        backgroundMusic.play().catch(e => console.error("Error al reproducir:", e));
        document.removeEventListener('click', startAudio);
        document.removeEventListener('touchstart', startAudio);
    };
    
    document.addEventListener('click', startAudio);
    document.addEventListener('touchstart', startAudio);
    
    window.reproducirLoopTechchan = function() {
        if (backgroundMusic.paused) {
            backgroundMusic.play().catch(e => console.error("Error al reproducir:", e));
        }
    };
})();

function updateCharacterPreview() {
  const hairColor = document.getElementById('hairColor').value;
  const skinColor = document.getElementById('skinColor').value;
  const eyeColor = document.getElementById('eyeColor').value;
  const clothesColor = document.getElementById('clothesColor').value;
  const gender = document.getElementById('gender').value;
  const hairStyleSelect = document.getElementById('hairStyle').value;
  const clothingStyleSelect = document.getElementById('clothingStyle').value;
  
  document.getElementById('head').setAttribute('fill', skinColor);
  document.getElementById('body').setAttribute('fill', skinColor);
  document.querySelectorAll('.eyes').forEach(eye => {
    eye.setAttribute('fill', eyeColor);
  });
  
  // Update hair style
  const hairHtml = hairStyles[gender][hairStyleSelect].replace(/hairColor/g, hairColor);
  document.getElementById('hairStyleContainer').innerHTML = hairHtml;
  
  // Update clothing style
  const clothingHtml = clothingStyles[clothingStyleSelect].replace(/clothesColor/g, clothesColor);
  document.getElementById('clothingContainer').innerHTML = clothingHtml;
}

// Función para mostrar notificaciones dentro de la sección del juego
function mostrarNotificacion(mensaje, tipo = 'info') {
  // Buscar la sección del juego
  const seccionJuego = document.querySelector('.seccion-del_juego');
  if (!seccionJuego) return;
  
  // Crear el elemento de notificación
  const notificacion = document.createElement('div');
  notificacion.className = `notificacion ${tipo}`;
  
  // Iconos según el tipo
  const iconos = {
    error: '❌',
    exito: '✅',
    info: 'ℹ️'
  };
  
  notificacion.innerHTML = `
    <span class="notificacion-icono">${iconos[tipo]}</span>
    <span class="notificacion-mensaje">${mensaje}</span>
    <span class="notificacion-cerrar">×</span>
  `;
  
  // Agregar la notificación a la sección del juego
  seccionJuego.appendChild(notificacion);
  
  // Ajustar la posición si hay múltiples notificaciones
  const notificacionesExistentes = seccionJuego.querySelectorAll('.notificacion.mostrar');
  if (notificacionesExistentes.length > 0) {
    notificacion.style.top = `${60 + (notificacionesExistentes.length * 80)}px`;
  }
  
  // Mostrar la notificación con animación
  setTimeout(() => {
    notificacion.classList.add('mostrar');
    notificacion.classList.add('animacion-entrada');
  }, 10);
  
  // Función para cerrar la notificación
  const cerrarNotificacion = () => {
    notificacion.classList.add('animacion-salida');
    notificacion.classList.remove('mostrar');
    setTimeout(() => {
      if (notificacion.parentNode) {
        notificacion.parentNode.removeChild(notificacion);
        // Reajustar las posiciones de las notificaciones restantes
        reajustarNotificaciones();
      }
    }, 300);
  };
  
  // Cerrar al hacer clic en la X
  notificacion.querySelector('.notificacion-cerrar').addEventListener('click', cerrarNotificacion);
  
  // Cerrar automáticamente después de 5 segundos
  setTimeout(cerrarNotificacion, 5000);
}

// Función para reajustar las posiciones de las notificaciones
function reajustarNotificaciones() {
  const seccionJuego = document.querySelector('.seccion-del_juego');
  if (!seccionJuego) return;
  
  const notificaciones = seccionJuego.querySelectorAll('.notificacion.mostrar');
  notificaciones.forEach((notif, index) => {
    notif.style.top = `${60 + (index * 80)}px`;
  });
}

// Función saveCharacter actualizada
function saveCharacter() {
  if (window.reproducirLoopTechchan) {
      window.reproducirLoopTechchan();
  }
  
  const name = document.getElementById('name').value.trim();
  
  // Validación mejorada
  if (!name) {
    mostrarNotificacion('Por favor, ingresa un nombre para el personaje', 'error');
    return;
  }
  
  // Validar que no exista un personaje con el mismo nombre
  if (characters.some(char => char.name.toLowerCase() === name.toLowerCase())) {
    mostrarNotificacion('Ya existe un personaje con ese nombre', 'error');
    return;
  }
  
  const character = {
    name: name,
    gender: document.getElementById('gender').value,
    hairColor: document.getElementById('hairColor').value,
    skinColor: document.getElementById('skinColor').value,
    eyeColor: document.getElementById('eyeColor').value,
    clothesColor: document.getElementById('clothesColor').value,
    profession: document.getElementById('profession').value,
    hairStyle: document.getElementById('hairStyle').value,
    clothingStyle: document.getElementById('clothingStyle').value,
    friendshipLevels: {},
    partner: null,
    isSeated: false,
    position: { x: 0, y: 0 },
    showingDialog: false,
    dialogTimer: null
  };
  
  characters.push(character);
  updateCharactersList();
  updateCharacterSelects();
  updateFriendshipLevels();
  document.getElementById('name').value = '';
  
  // Mensaje de éxito
  mostrarNotificacion(`¡${name} ha sido creado exitosamente!`, 'exito');
}

function updateCharactersList() {
  const list = document.getElementById('charactersList');
  list.innerHTML = '';
  characters.forEach((char, index) => {
    const entry = document.createElement('div');
    entry.className = 'character-entry';
    entry.innerHTML = `
      <div class="character-info">
        <span class="character-name">${char.name}</span>
        <span class="character-details">${char.gender} ${char.profession}</span>
        ${char.partner ? `<span class="partner-info">❤️ Pareja de ${char.partner}</span>` : ''}
      </div>
      <button class="delete-btn" onclick="deleteCharacter(${index})">🗑️</button>
    `;
    list.appendChild(entry);
  });
}

function deleteCharacter(index) {
  if (confirm(`¿Estás seguro de eliminar a ${characters[index].name}?`)) {
    characters.splice(index, 1);
    updateCharactersList();
    updateCharacterSelects();
    updateFriendshipLevels();
  }
}

function updateCharacterSelects() {
  const selects = ['char1Select', 'char2Select', 'loveChar1Select', 'loveChar2Select'];
  selects.forEach(selectId => {
    const select = document.getElementById(selectId);
    select.innerHTML = '<option value="">Selecciona un personaje</option>';
    characters.forEach((char, index) => {
      select.innerHTML += `<option value="${index}">${char.name}</option>`;
    });
  });
}

function updateFriendshipLevels() {
  const list = document.getElementById('friendshipLevelsList');
  list.innerHTML = '';
  const processedPairs = new Set();
  
  characters.forEach((char1, idx1) => {
    Object.keys(char1.friendshipLevels).forEach(friend2Name => {
      const char2 = characters.find(c => c.name === friend2Name);
      if (!char2) return;
      const pairKey = [char1.name, friend2Name].sort().join('-');
      if (processedPairs.has(pairKey)) return;
      processedPairs.add(pairKey);
      
      const level = Math.min(char1.friendshipLevels[friend2Name], 10);
      let hearts;
      if (level === 10) {
        hearts = '💎'.repeat(10);
      } else if (level > 5) {
        hearts = '💛'.repeat(level);
      } else {
        hearts = '❤️'.repeat(level);
      }
      
      const friendshipDiv = document.createElement('div');
      friendshipDiv.className = 'friendship-pair';
      friendshipDiv.innerHTML = `
        <span>${char1.name} y ${friend2Name}</span>
        <span class="friendship-hearts">${hearts}</span>
      `;
      list.appendChild(friendshipDiv);
    });
  });
  
  if (processedPairs.size === 0) {
    list.innerHTML = '<p>No hay relaciones de amistad todavía</p>';
  }
}// En la función useFriendshipPotion
function useFriendshipPotion() {
  if (window.reproducirLoopTechchan) {
      window.reproducirLoopTechchan();
  }
  
  const char1Index = document.getElementById('char1Select').value;
  const char2Index = document.getElementById('char2Select').value;
  
  if (char1Index === '' || char2Index === '' || char1Index === char2Index) {
    mostrarNotificacion('Por favor, selecciona dos personajes diferentes', 'error');
    return;
  }
  
  const char1 = characters[char1Index];
  const char2 = characters[char2Index];
  const currentLevel = char1.friendshipLevels[char2.name] || 0;
  
  if (currentLevel >= 10) {
    mostrarNotificacion(`¡La amistad entre ${char1.name} y ${char2.name} ya está al máximo nivel!`, 'info');
    return;
  }
  
  const isDeepFriendship = currentLevel >= 5;
  const topic = isDeepFriendship ? deepConversationTopics[Math.floor(Math.random() * deepConversationTopics.length)] : conversationTopics[Math.floor(Math.random() * conversationTopics.length)];
  
  const dialog = document.getElementById('dialogContent');
  dialog.innerHTML = `
    <p><strong>${char1.name}:</strong> ${topic[0]}</p>
    <p><strong>${char2.name}:</strong> ${topic[1]}</p>
    <p><strong>${char1.name}:</strong> ${topic[2]}</p>
    <p class="friendship-result">¡La amistad entre ${char1.name} y ${char2.name} ha aumentado!</p>
  `;
  
  if (!char1.friendshipLevels[char2.name]) char1.friendshipLevels[char2.name] = 0;
  if (!char2.friendshipLevels[char1.name]) char2.friendshipLevels[char1.name] = 0;
  
  if (char1.friendshipLevels[char2.name] < 10) {
    char1.friendshipLevels[char2.name]++;
    char2.friendshipLevels[char1.name]++;
  }
  
  document.getElementById('friendshipDialog').style.display = 'block';
  updateFriendshipLevels();
  
  // Mostrar notificación apropiada según el nivel
  if (char1.friendshipLevels[char2.name] === 10) {
    mostrarNotificacion(`¡${char1.name} y ${char2.name} han alcanzado el máximo nivel de amistad! Ahora pueden usar la poción de amor.`, 'exito');
  } else {
    mostrarNotificacion(`¡La amistad entre ${char1.name} y ${char2.name} ha aumentado!`, 'exito');
  }
}

// En la función useLovePotion
function useLovePotion() {
  if (window.reproducirLoopTechchan) {
      window.reproducirLoopTechchan();
  }
  
  const char1Index = document.getElementById('loveChar1Select').value;
  const char2Index = document.getElementById('loveChar2Select').value;

  if (char1Index === '' || char2Index === '' || char1Index === char2Index) {
    mostrarNotificacion('Por favor, selecciona dos personajes diferentes', 'error');
    return;
  }

  const char1 = characters[char1Index];
  const char2 = characters[char2Index];

  if (char1.gender === char2.gender) {
    mostrarNotificacion('La poción de amor solo funciona entre personajes de sexo opuesto', 'error');
    return;
  }

  const friendshipLevel = char1.friendshipLevels[char2.name] || 0;
  if (friendshipLevel < 10) {
    mostrarNotificacion('Los personajes necesitan tener nivel máximo de amistad para usar la poción de amor', 'error');
    return;
  }

  if (char1.partner || char2.partner) {
    mostrarNotificacion('¡Uno de los personajes ya tiene pareja!', 'error');
    return;
  }

  const topic = loveConversationTopics[Math.floor(Math.random() * loveConversationTopics.length)];
  const dialog = document.getElementById('loveDialogContent');
  dialog.innerHTML = `
    <p><strong>${char1.name}:</strong> ${topic[0]}</p>
    <p><strong>${char2.name}:</strong> ${topic[1]}</p>
    <p><strong>${char1.name}:</strong> ${topic[2]}</p>
    <p class="love-result">¡${char1.name} y ${char2.name} ahora son pareja!</p>
  `;

  char1.partner = char2.name;
  char2.partner = char1.name;
  
  document.getElementById('loveDialog').style.display = 'block';
  updateCharactersList();
  updateFriendshipLevels();
  mostrarNotificacion(`¡${char1.name} y ${char2.name} ahora son pareja!`, 'exito');
}

// Navigation functionality
const editorContent = document.getElementById('editorContent');
const houseContent = document.getElementById('houseContent');
const showEditorBtn = document.getElementById('showEditor');
const showHouseBtn = document.getElementById('showHouse');

showEditorBtn.addEventListener('click', () => {
  editorContent.style.display = 'block';
  houseContent.style.display = 'none';
  showEditorBtn.classList.add('active');
  showHouseBtn.classList.remove('active');
  stopHouseSimulation();
});

showHouseBtn.addEventListener('click', () => {
  editorContent.style.display = 'none';
  houseContent.style.display = 'block';
  showEditorBtn.classList.remove('active');
  showHouseBtn.classList.add('active');
  startHouseSimulation();
});

let houseAnimationRunning = false;
let characterElements = new Map();

// Función mejorada para crear elementos de personaje con diálogos optimizados
// Función mejorada para crear elementos de personaje con diálogos optimizados
function createCharacterInHouse(character) {
  const characterGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
  characterGroup.classList.add('character-house');
  
  const hairHtml = hairStyles[character.gender][character.hairStyle].replace(/hairColor/g, character.hairColor);
  const clothingHtml = clothingStyles[character.clothingStyle].replace(/clothesColor/g, character.clothesColor);
  
  // Crear el cuerpo base del personaje
  characterGroup.innerHTML = `
    <rect x="8" y="16" width="16" height="24" fill="${character.skinColor}"/>
    <rect x="8" y="4" width="16" height="16" fill="${character.skinColor}"/>
    <rect x="11" y="10" width="4" height="4" fill="${character.eyeColor}"/>
    <rect x="17" y="10" width="4" height="4" fill="${character.eyeColor}"/>
    ${hairHtml}
    ${clothingHtml}
  `;
  
  // Crear el nombre en un grupo separado que no se inversará
  const nameGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
  nameGroup.classList.add('character-name-group');
  const nameText = document.createElementNS("http://www.w3.org/2000/svg", "text");
  nameText.setAttribute('x', '16');
  nameText.setAttribute('y', '48');
  nameText.setAttribute('text-anchor', 'middle');
  nameText.setAttribute('font-size', '8');
  nameText.setAttribute('fill', 'white');
  nameText.textContent = character.name;
  nameGroup.appendChild(nameText);
  characterGroup.appendChild(nameGroup);
  
  // Crear grupo de iconos de estado
  const statusIconGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
  statusIconGroup.classList.add('status-icons');
  statusIconGroup.setAttribute('transform', 'translate(16, -8)');
  characterGroup.appendChild(statusIconGroup);
  
  // Crear globo de diálogo optimizado
  const dialogGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
  dialogGroup.classList.add('character-dialog');
  dialogGroup.style.display = 'none';
  dialogGroup.innerHTML = `
    <rect x="-80" y="-45" width="160" height="30" rx="5" fill="white" stroke="#666" stroke-width="1"/>
    <path d="M0,-15 L5,-5 L-5,-5 Z" fill="white" stroke="#666" stroke-width="1"/>
    <text x="0" y="-30" text-anchor="middle" font-size="8" fill="#333" class="dialog-text">Hola</text>
  `;
  statusIconGroup.appendChild(dialogGroup);
  
  // Posicionar inicialmente el personaje
  characterGroup.setAttribute('transform', `translate(${Math.random() * 600 + 50}, 300) scale(1, 1)`);
  return characterGroup;
}


function updateCharacterStatus(character, characterElement) {
  const statusIconGroup = characterElement.querySelector('.status-icons');
  if (!statusIconGroup) return;
  
  // Limpiar iconos existentes
  const existingIcons = statusIconGroup.querySelectorAll('.status-icon');
  existingIcons.forEach(icon => icon.remove());
  
  let iconOffset = 0;
  
  // Mostrar icono de pareja
  if (character.partner) {
    const loveIcon = document.createElementNS("http://www.w3.org/2000/svg", "text");
    loveIcon.classList.add('status-icon', 'love-icon');
    loveIcon.setAttribute('x', iconOffset);
    loveIcon.setAttribute('y', '0');
    loveIcon.setAttribute('text-anchor', 'middle');
    loveIcon.setAttribute('font-size', '12');
    loveIcon.textContent = '❤️';
    statusIconGroup.appendChild(loveIcon);
    iconOffset += 15;
  }
  
  // Mostrar iconos de amistad
  const friendships = Object.entries(character.friendshipLevels || {});
  const strongFriendships = friendships.filter(([_, level]) => level >= 5);
  
  if (strongFriendships.length > 0) {
    const friendIcon = document.createElementNS("http://www.w3.org/2000/svg", "text");
    friendIcon.classList.add('status-icon', 'friend-icon');
    friendIcon.setAttribute('x', iconOffset);
    friendIcon.setAttribute('y', '0');
    friendIcon.setAttribute('text-anchor', 'middle');
    friendIcon.setAttribute('font-size', '12');
    friendIcon.textContent = '😊';
    statusIconGroup.appendChild(friendIcon);
    iconOffset += 15;
    
    // Mostrar número de amigos cercanos
    if (strongFriendships.length > 1) {
      const friendCount = document.createElementNS("http://www.w3.org/2000/svg", "text");
      friendCount.classList.add('status-icon', 'friend-count');
      friendCount.setAttribute('x', iconOffset);
      friendCount.setAttribute('y', '2');
      friendCount.setAttribute('text-anchor', 'middle');
      friendCount.setAttribute('font-size', '8');
      friendCount.setAttribute('fill', 'white');
      friendCount.setAttribute('stroke', '#666');
      friendCount.setAttribute('stroke-width', '0.5');
      friendCount.textContent = `+${strongFriendships.length}`;
      statusIconGroup.appendChild(friendCount);
    }
  }
}

// Función optimizada para distribuir personajes sin superposición
function distributeCharacters() {
  const MIN_DISTANCE = 100; // Distancia mínima entre personajes normales
  const FRIEND_DISTANCE = 60; // Distancia mínima para amigos
  const PARTNER_DISTANCE = 40; // Distancia mínima para parejas
  const MAX_ATTEMPTS = 50; // Intentos máximos para encontrar posición
  
  // Primero, distribuir personajes con pareja cerca entre sí
  const pairedCharacters = characters.filter(char => char.partner);
  const processedPairs = new Set();
  
  pairedCharacters.forEach(character => {
    if (processedPairs.has(character.name)) return;
    
    const partner = characters.find(char => char.name === character.partner);
    if (!partner || !characterElements.has(character.name) || !characterElements.has(partner.name)) return;
    
    const charElement = characterElements.get(character.name);
    const partnerElement = characterElements.get(partner.name);
    
    // Ubicar la pareja junta
    const pairBaseX = Math.random() * 600 + 50; // Entre 50 y 650
    const pairBaseY = 300; // Altura base
    
    // Personaje principal
    character.position = { x: pairBaseX, y: pairBaseY };
    charElement.setAttribute('transform', `translate(${pairBaseX}, ${pairBaseY}) scale(1, 1)`);
    
    // Su pareja
    const offset = Math.random() * 30 + 10; // Pequeño offset aleatorio entre 10-40
    partner.position = { x: pairBaseX + offset, y: pairBaseY };
    partnerElement.setAttribute('transform', `translate(${pairBaseX + offset}, ${pairBaseY}) scale(1, 1)`);
    
    // Marcar esta pareja como procesada
    processedPairs.add(character.name);
    processedPairs.add(partner.name);
  });
  
  // Luego distribuir los personajes con amistades fuertes
  const remainingCharacters = characters.filter(char => !processedPairs.has(char.name));
  const processedFriends = new Set([...processedPairs]);
  
  remainingCharacters.forEach(character => {
    if (processedFriends.has(character.name)) return;
    
    // Buscar amigos cercanos
    const friends = Object.entries(character.friendshipLevels || {})
      .filter(([name, level]) => level >= 5 && !processedPairs.has(name))
      .map(([name]) => characters.find(char => char.name === name))
      .filter(friend => friend && !processedFriends.has(friend.name));
    
    if (friends.length > 0 && characterElements.has(character.name)) {
      const charElement = characterElements.get(character.name);
      
      // Ubicar grupo de amigos
      const groupBaseX = Math.random() * 600 + 50; // Entre 50 y 650
      const groupBaseY = 300; // Altura base
      
      // Personaje principal
      character.position = { x: groupBaseX, y: groupBaseY };
      charElement.setAttribute('transform', `translate(${groupBaseX}, ${groupBaseY}) scale(1, 1)`);
      processedFriends.add(character.name);
      
      // Sus amigos
      let offsetX = 70; // Empezar con un offset
      friends.forEach(friend => {
        if (!characterElements.has(friend.name)) return;
        
        const friendElement = characterElements.get(friend.name);
        const friendX = groupBaseX + offsetX;
        
        friend.position = { x: friendX, y: groupBaseY };
        friendElement.setAttribute('transform', `translate(${friendX}, ${groupBaseY}) scale(1, 1)`);
        
        processedFriends.add(friend.name);
        offsetX += 70; // Aumentar offset para el siguiente amigo
      });
    }
  });
  
  // Finalmente, distribuir el resto de personajes asegurando distancia mínima
  const finalRemainingChars = characters.filter(char => !processedFriends.has(char.name));
  
  finalRemainingChars.forEach(character => {
    if (!characterElements.has(character.name)) return;
    
    const element = characterElements.get(character.name);
    let validPosition = false;
    let attempts = 0;
    let newX, newY;
    
    // Buscar una posición válida
    while (!validPosition && attempts < MAX_ATTEMPTS) {
      attempts++;
      validPosition = true;
      
      // Generar nueva posición aleatoria
      newX = Math.random() * 600 + 50; // Entre 50 y 650
      newY = 300; // Altura fija en el suelo
      
      // Verificar colisión con todos los personajes ya posicionados
      for (const otherChar of characters) {
        if (otherChar.name === character.name || !otherChar.position) continue;
        
        const otherX = otherChar.position.x;
        const otherY = otherChar.position.y;
        
        // Calcular distancia
        const distance = Math.sqrt(Math.pow(newX - otherX, 2) + Math.pow(newY - otherY, 2));
        
        // Determinar la distancia mínima requerida
        let requiredDistance = MIN_DISTANCE;
        
        if (otherChar.name === character.partner || character.name === otherChar.partner) {
          requiredDistance = PARTNER_DISTANCE;
        } else if ((character.friendshipLevels?.[otherChar.name] || 0) >= 5) {
          requiredDistance = FRIEND_DISTANCE;
        }
        
        if (distance < requiredDistance) {
          validPosition = false;
          break;
        }
      }
    }
    
    // Si encontramos posición válida, mover el personaje
    if (validPosition) {
      character.position = { x: newX, y: newY };
      element.setAttribute('transform', `translate(${newX}, ${newY}) scale(1, 1)`);
    } else {
      // Si no se pudo encontrar posición después de los intentos, forzar una
      newX = Math.random() * 600 + 50;
      character.position = { x: newX, y: newY };
      element.setAttribute('transform', `translate(${newX}, ${newY}) scale(1, 1)`);
    }
  });
}

// Mejorar el sistema de diálogos para que siempre sean visibles
function showCharacterDialog(character, characterElement, message) {
  // Cancelar diálogo anterior si existe
  if (character.dialogTimer) {
    clearTimeout(character.dialogTimer);
    character.dialogTimer = null;
  }
  
  const dialogGroup = characterElement.querySelector('.character-dialog');
  if (!dialogGroup) return;
  
  const dialogText = dialogGroup.querySelector('.dialog-text');
  const dialogRect = dialogGroup.querySelector('rect');
  
  // Ajustar el texto del diálogo
  dialogText.textContent = message;
  
  // Crear un SVG temporal para medir el texto
  const tempSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  const tempText = document.createElementNS("http://www.w3.org/2000/svg", "text");
  tempText.setAttribute("font-size", "8");
  tempText.textContent = message;
  tempSvg.appendChild(tempText);
  document.body.appendChild(tempSvg);
  
  // Medir el texto
  let bbox;
  try {
    bbox = tempText.getBBox();
  } catch (e) {
    bbox = { width: message.length * 5, height: 10 }; // Fallback si getBBox falla
  }
  
  document.body.removeChild(tempSvg);
  
  // Ajustar el tamaño del globo de diálogo
  const padding = 10;
  const width = Math.min(Math.max(bbox.width + padding * 2, 80), 200); // Mínimo 80px, máximo 200px
  
  dialogRect.setAttribute("width", width);
  dialogRect.setAttribute("x", -width / 2);
  
  // Obtener la escala actual del personaje
  let scale = 1;
  const transform = characterElement.getAttribute('transform');
  if (transform) {
    const scaleMatch = transform.match(/scale\(([-\d.]+)/);
    if (scaleMatch && scaleMatch[1]) {
      scale = parseFloat(scaleMatch[1]);
    }
  }
  
  // Contrarrestar la escala negativa en el texto del diálogo
  if (scale < 0) {
    dialogText.setAttribute('transform', 'scale(-1, 1)');
    dialogText.setAttribute('x', '0');
  } else {
    dialogText.setAttribute('transform', '');
    dialogText.setAttribute('x', '0');
  }
  
  // Mostrar el diálogo
  dialogGroup.style.display = 'block';
  character.showingDialog = true;
  
  // Configurar temporizador para ocultar el diálogo
  character.dialogTimer = setTimeout(() => {
    dialogGroup.style.display = 'none';
    character.showingDialog = false;
    character.dialogTimer = null;
    
    // Opcional: Alejarse después del diálogo
    if (Math.random() < 0.3) {
      moveCharacterAfterDialog(character, characterElement);
    }
  }, 5000); // 5 segundos (ajustable)
}

// Función mejorada para mover personajes garantizando la correcta orientación
function moveCharacterToPosition(characterElement, character, targetX, targetY, duration = 2) {
  if (!characterElement || !character) return;
  
  const currentTransform = characterElement.getAttribute('transform') || '';
  let currentX = character.position?.x || 0;
  let currentY = character.position?.y || 0;
  
  // Intentar obtener la posición actual desde el transform si está disponible
  const translateMatch = currentTransform.match(/translate\(([\d.]+),\s*([\d.]+)\)/);
  if (translateMatch && translateMatch[1] && translateMatch[2]) {
    currentX = parseFloat(translateMatch[1]);
    currentY = parseFloat(translateMatch[2]);
  }
  
  // Determinar la escala (dirección) basada en la dirección del movimiento
  const scale = targetX > currentX ? 1 : -1;
  
  // Aplicar la transición
  characterElement.style.transition = `transform ${duration}s ease-in-out`;
  
  // Configurar los fotogramas clave para la animación
  try {
    const keyframes = [
      { transform: `translate(${currentX}px, ${currentY}px) scale(${scale}, 1)` },
      { transform: `translate(${targetX}px, ${targetY}px) scale(${scale}, 1)` }
    ];
    
    // Iniciar la animación
    const animation = characterElement.animate(keyframes, {
      duration: duration * 1000,
      easing: 'ease-in-out',
      fill: 'forwards'
    });
    
    // Actualización continua de la orientación del diálogo y nombre durante la animación
    const startTime = Date.now();
    const updateInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / (duration * 1000), 1);
      const currentPosX = currentX + (targetX - currentX) * progress;
      
      // Actualizar posición interna
      character.position = { 
        x: currentPosX, 
        y: currentY + (targetY - currentY) * progress 
      };
      
      // Actualizar orientación del diálogo
      updateDialogOrientation(characterElement, scale);
      
      // Actualizar orientación del nombre
      updateNameOrientation(characterElement, scale);
    }, 50);
    
    // Cuando termina la animación
    animation.onfinish = () => {
      clearInterval(updateInterval);
      
      // Actualizar el atributo transform al final
      characterElement.setAttribute('transform', `translate(${targetX}, ${targetY}) scale(${scale}, 1)`);
      
      // Actualizar la posición interna del personaje
      character.position = { x: targetX, y: targetY };
      
      // Asegurarse de que el diálogo y nombre estén orientados correctamente
      updateDialogOrientation(characterElement, scale);
      updateNameOrientation(characterElement, scale);
    };
  } catch (e) {
    // Fallback si la animación falla
    console.error("Error en animación:", e);
    characterElement.setAttribute('transform', `translate(${targetX}, ${targetY}) scale(${scale}, 1)`);
    character.position = { x: targetX, y: targetY };
    updateDialogOrientation(characterElement, scale);
    updateNameOrientation(characterElement, scale);
  }
}

// Función para actualizar la orientación del nombre
function updateNameOrientation(characterElement, scale) {
  const nameGroup = characterElement.querySelector('.character-name-group');
  if (!nameGroup) return;
  
  // Si el personaje está mirando hacia la izquierda (scale negativo),
  // invertir el nombre para que se lea correctamente
  if (scale < 0) {
    nameGroup.setAttribute('transform', 'scale(-1, 1)');
  } else {
    nameGroup.setAttribute('transform', '');
  }
}

// Función para actualizar la orientación del diálogo
function updateDialogOrientation(characterElement, scale) {
  const dialogGroup = characterElement.querySelector('.character-dialog');
  if (!dialogGroup || dialogGroup.style.display === 'none') return;
  
  const dialogText = dialogGroup.querySelector('.dialog-text');
  if (!dialogText) return;
  
  // Ajustar la orientación del texto según la escala
  if (scale < 0) {
    dialogText.setAttribute('transform', 'scale(-1, 1)');
  } else {
    dialogText.setAttribute('transform', '');
  }
}

  // Función mejorada para mover personajes garantizando la correcta orientación
function moveCharacterToPosition(characterElement, character, targetX, targetY, duration = 2) {
  if (!characterElement || !character) return;
  
  const currentTransform = characterElement.getAttribute('transform') || '';
  let currentX = character.position?.x || 0;
  let currentY = character.position?.y || 0;
  
  // Intentar obtener la posición actual desde el transform si está disponible
  const translateMatch = currentTransform.match(/translate\(([\d.]+),\s*([\d.]+)\)/);
  if (translateMatch && translateMatch[1] && translateMatch[2]) {
    currentX = parseFloat(translateMatch[1]);
    currentY = parseFloat(translateMatch[2]);
  }
  
  // Determinar la escala (dirección) basada en la dirección del movimiento
  const scale = targetX > currentX ? 1 : -1;
  
  // Aplicar la transición
  characterElement.style.transition = `transform ${duration}s ease-in-out`;
  
  // Configurar los fotogramas clave para la animación
  try {
    const keyframes = [
      { transform: `translate(${currentX}px, ${currentY}px) scale(${scale}, 1)` },
      { transform: `translate(${targetX}px, ${targetY}px) scale(${scale}, 1)` }
    ];
    
    // Iniciar la animación
    const animation = characterElement.animate(keyframes, {
      duration: duration * 1000,
      easing: 'ease-in-out',
      fill: 'forwards'
    });
    
    // Actualización continua de la orientación del diálogo durante la animación
    const startTime = Date.now();
    const updateInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / (duration * 1000), 1);
      const currentPosX = currentX + (targetX - currentX) * progress;
      
      // Actualizar posición interna
      character.position = { 
        x: currentPosX, 
        y: currentY + (targetY - currentY) * progress 
      };
      
      // Actualizar orientación del diálogo
      updateDialogOrientation(characterElement, scale);
    }, 50);
    
    // Cuando termina la animación
    animation.onfinish = () => {
      clearInterval(updateInterval);
      
      // Actualizar el atributo transform al final
      characterElement.setAttribute('transform', `translate(${targetX}, ${targetY}) scale(${scale}, 1)`);
      
      // Actualizar la posición interna del personaje
      character.position = { x: targetX, y: targetY };
      
      // Asegurarse de que el diálogo esté orientado correctamente
      updateDialogOrientation(characterElement, scale);
    };
  } catch (e) {
    // Fallback si la animación falla
    console.error("Error en animación:", e);
    characterElement.setAttribute('transform', `translate(${targetX}, ${targetY}) scale(${scale}, 1)`);
    character.position = { x: targetX, y: targetY };
    updateDialogOrientation(characterElement, scale);
  }
}
function findNearestBench() {
  const benches = [
    { x: 150, y: 320, occupied: false },
    { x: 400, y: 320, occupied: false },
    { x: 650, y: 320, occupied: false }
  ];
  
  return benches.find(bench => !bench.occupied);
}
function moveCharacter(characterElement, character) {
  if (character.isSeated) return;
  
  let newX = Math.random() * 700;
  let newY = 300;
  
  // Si tiene pareja, alta probabilidad de moverse cerca de ella
  if (character.partner) {
    const partner = characters.find(c => c.name === character.partner);
    const partnerElement = characterElements.get(character.partner);
    
    if (partnerElement && partner && Math.random() < 0.8) {
      const partnerX = partner.position.x;
      newX = partnerX + (Math.random() * 100 - 50);
      newX = Math.max(0, Math.min(700, newX));
      
      // Mostrar diálogo romántico ocasionalmente
      if (Math.random() < 0.3) {
        const loveMessages = [
          "Te amo",
          "¿Vamos juntos?",
          "Eres especial",
          "Mi amor",
          "Siempre contigo",
          "Mi corazón es tuyo",
          "Eres mi mundo",
          "¿Un beso?",
          "Te adoro",
          "Mi vida",
          "Juntos por siempre",
          "Mi tesoro",
          "Te necesito",
          "Mi alma gemela",
          "¿Paseamos?",
          "Mi cielo",
          "Tu sonrisa me ilumina",
          "Mi razón de ser",
          "Mi complemento perfecto",
          "¿Me das la mano?",
          "Mi príncipe/princesa",
          "Contigo todo es mejor",
          "Mi felicidad"
        ];
        showCharacterDialog(character, characterElement, loveMessages[Math.floor(Math.random() * loveMessages.length)]);
      }
    }
  }
  
  // Si tiene amigos cercanos, probabilidad de moverse cerca de ellos
  else if (Math.random() < 0.6) {
    const friends = Object.entries(character.friendshipLevels || {})
      .filter(([_, level]) => level >= 5)
      .map(([name, _]) => name);
    
    if (friends.length > 0) {
      const friendName = friends[Math.floor(Math.random() * friends.length)];
      const friend = characters.find(c => c.name === friendName);
      const friendElement = characterElements.get(friendName);
      
      if (friendElement && friend && Math.random() < 0.7) {
        const friendX = friend.position.x;
        newX = friendX + (Math.random() * 120 - 60);
        newX = Math.max(0, Math.min(700, newX));
        
        // Mostrar diálogo amistoso ocasionalmente
        if (Math.random() < 0.2) {
          // Diferentes mensajes según el nivel de amistad
          const friendshipLevel = character.friendshipLevels[friend.name] || 0;
          let friendMessages;
          
          if (friendshipLevel >= 8) {
            // Mejores amigos
            friendMessages = [
              "¡Mi mejor amigo!",
              "¿Aventura juntos?",
              "Confío en ti",
              "Eres genial",
              "¡Qué suerte tenerte!",
              "Amigo del alma",
              "¿Compartimos secretos?",
              "Cuenta conmigo siempre",
              "¡Eres increíble!",
              "¡Vamos a divertirnos!",
              "Gracias por estar aquí",
              "¿Una misión juntos?",
              "Eres mi familia elegida",
              "¡Qué buenos momentos!"
            ];
          } else if (friendshipLevel >= 5) {
            // Buenos amigos
            friendMessages = [
              "¡Hola amigo!",
              "¿Cómo estás?",
              "¡Qué día!",
              "¿Vamos?",
              "¡Me alegra verte!",
              "¿Todo bien?",
              "¡Qué gusto!",
              "¿Charlamos?",
              "¡Hey, amigo!",
              "¿Paseamos un rato?",
              "¡Cuánto tiempo!",
              "¿Alguna novedad?",
              "¡Qué casualidad!",
              "¿Tomamos algo?",
              "¡Tengo que contarte algo!"
            ];
          } else {
            // Conocidos
            friendMessages = [
              "Hola",
              "¿Qué tal?",
              "Buen día",
              "¿Cómo va?",
              "Saludos",
              "¿Todo bien?",
              "Nos vemos",
              "¿Qué hay?",
              "Buenos días",
              "¿Cómo te va?",
              "Un placer verte",
              "¿Qué cuentas?",
              "Hace buen día",
              "¿De paseo?",
              "Qué coincidencia"
            ];
          }
          
          showCharacterDialog(character, characterElement, friendMessages[Math.floor(Math.random() * friendMessages.length)]);
        }
      }
    }
  }
  
  // Para personajes solos, ocasionalmente mostrar pensamientos
  else if (Math.random() < 0.1) {
    const lonelyMessages = [
      "Qué día tan tranquilo",
      "Me pregunto qué habrá de nuevo",
      "Tal vez haga nuevos amigos",
      "El parque está hermoso",
      "¿Qué aventura me espera?",
      "Necesito conocer más gente",
      "Es un buen día para pasear",
      "Me siento algo mal...",
      "¿Habrá alguien interesante?",
      "Quizás debería socializar más",
      "El clima está perfecto",
      "¿Qué me deparará el día?",
      "Extraño tener compañía",
      "Este lugar es mágico",
      "Ojalá tuviera con quién hablar"
    ];
    showCharacterDialog(character, characterElement, lonelyMessages[Math.floor(Math.random() * lonelyMessages.length)]);
  }
  
  // Probabilidad de sentarse en una banca
  if (Math.random() < 0.3) {
    const bench = findNearestBench();
    if (bench) {
      bench.occupied = true;
      character.isSeated = true;
      moveCharacterToPosition(characterElement, character, bench.x, bench.y);
      
      // Diálogo al sentarse
      if (Math.random() < 0.5) {
        const sittingMessages = [
          "Necesito descansar",
          "Qué vista tan bonita",
          "Un momento de paz",
          "Me gusta este lugar",
          "Tiempo de reflexionar",
          "Ah, qué alivio",
          "Perfecto para relajarse",
          "Me quedaré un rato",
          "Necesitaba esto",
          "Qué tranquilidad"
        ];
        showCharacterDialog(character, characterElement, sittingMessages[Math.floor(Math.random() * sittingMessages.length)]);
      }
      
      setTimeout(() => {
        bench.occupied = false;
        character.isSeated = false;
        
        // Diálogo al levantarse
        if (Math.random() < 0.3) {
          const standingMessages = [
            "Hora de continuar",
            "Fue un buen descanso",
            "A seguir paseando",
            "Me siento Increíble",
            "Vamos a explorar"
          ];
          showCharacterDialog(character, characterElement, standingMessages[Math.floor(Math.random() * standingMessages.length)]);
        }
      }, 10000);
      return;
    }
  }
  
  moveCharacterToPosition(characterElement, character, newX, newY);
}

// Modificación de la función startHouseSimulation
function startHouseSimulation() {
  houseAnimationRunning = true;
  const container = document.getElementById('characterContainer');
  container.innerHTML = '';
  characterElements.clear();
  
  // Crear elementos de personaje
  characters.forEach(character => {
    const characterElement = createCharacterInHouse(character);
    container.appendChild(characterElement);
    characterElements.set(character.name, characterElement);
    updateCharacterStatus(character, characterElement);
  });
  
  // Distribuir inicialmente sin superposición
  distributeCharacters();
  
  // Sistema de animación mejorado
  function improvedAnimationLoop() {
    if (!houseAnimationRunning) return;
    
    characters.forEach(character => {
      const element = characterElements.get(character.name);
      if (!element) return;
      
      // Actualizar iconos de estado
      updateCharacterStatus(character, element);
      
      // Solo mover si no está mostrando diálogo y aleatoriamente
      if (!character.showingDialog && Math.random() < 0.01) {
        
        // Variables para buscar amigos y parejas
        let closestFriend = null;
        let minFriendDistance = Infinity;
        let closestPartner = null;
        let minPartnerDistance = Infinity;
        
        // Verificar distancias con otros personajes
        characters.forEach(otherChar => {
          if (otherChar.name === character.name || !otherChar.position) return;
          
          const distance = Math.sqrt(
            Math.pow(character.position.x - otherChar.position.x, 2) +
            Math.pow(character.position.y - otherChar.position.y, 2)
          );
          
          // Encontrar pareja cercana
          if (otherChar.name === character.partner && distance < minPartnerDistance) {
            minPartnerDistance = distance;
            closestPartner = otherChar;
          }
          
          // Encontrar amigo cercano
          if ((character.friendshipLevels?.[otherChar.name] || 0) >= 5 && distance < minFriendDistance) {
            minFriendDistance = distance;
            closestFriend = otherChar;
          }
        });
        
        // Prioridad: 1. Moverse hacia la pareja si está lejos
        if (closestPartner && minPartnerDistance > 200) {
          const partnerX = closestPartner.position.x;
          const moveX = partnerX + (Math.random() * 60 - 30);
          const boundedX = Math.max(50, Math.min(650, moveX));
          moveCharacterToPosition(element, character, boundedX, character.position.y);
        }
        // 2. Iniciar conversación con pareja si está cercana
        else if (closestPartner && minPartnerDistance < 100 && Math.random() < 0.4) {
          const partnerElement = characterElements.get(closestPartner.name);
          
          if (partnerElement && !closestPartner.showingDialog) {
            const loveMessages = [
              "Te amo mucho",
              "¿Paseamos juntos?",
              "Eres lo mejor de mi vida",
              "Mi amor por ti crece cada día",
              "Siempre estaré contigo"
            ];
            
            const index = Math.floor(Math.random() * loveMessages.length);
            showCharacterDialog(character, element, loveMessages[index]);
            
            // Respuesta de la pareja
            setTimeout(() => {
              if (!closestPartner.showingDialog) {
                const responses = [
                  "Yo también te amo",
                  "Eres mi mundo entero",
                  "Contigo siempre",
                  "Te adoro",
                  "Mi corazón es tuyo"
                ];
                showCharacterDialog(closestPartner, partnerElement, responses[Math.floor(Math.random() * responses.length)]);
              }
            }, 1000);
          }
        }
        // 3. Moverse hacia amigo si está lejos
        else if (closestFriend && minFriendDistance > 150 && Math.random() < 0.3) {
          const friendX = closestFriend.position.x;
          const moveX = friendX + (Math.random() * 80 - 40);
          const boundedX = Math.max(50, Math.min(650, moveX));
          moveCharacterToPosition(element, character, boundedX, character.position.y);
        }
        // 4. Iniciar conversación con amigo si está cercano
        else if (closestFriend && minFriendDistance < 100 && Math.random() < 0.3) {
          const friendElement = characterElements.get(closestFriend.name);
          
          if (friendElement && !closestFriend.showingDialog) {
            const friendMessages = [
              "¡Hola amigo!",
              "¿Cómo estás hoy?",
              "¡Qué bueno verte!",
              "¿Tienes planes?",
              "¡Tengo algo que contarte!"
            ];
            
            showCharacterDialog(character, element, friendMessages[Math.floor(Math.random() * friendMessages.length)]);
            
            // Respuesta del amigo
            setTimeout(() => {
              if (!closestFriend.showingDialog) {
                const responses = [
                  "¡Hola! Todo bien",
                  "¡Qué alegría!",
                  "¡Te estaba buscando!",
                  "Estoy genial, ¿y tú?",
                  "Cuéntame más"
                ];
                showCharacterDialog(closestFriend, friendElement, responses[Math.floor(Math.random() * responses.length)]);
              }
            }, 1000);
          }
        }
        // 5. Movimiento aleatorio normal o pensamiento solitario
        else if (Math.random() < 0.5) {
          const newX = character.position.x + (Math.random() * 160 - 80);
          const boundedX = Math.max(50, Math.min(650, newX));
          moveCharacterToPosition(element, character, boundedX, character.position.y);
        } else if (Math.random() < 0.2) {
          const soloMessages = [
            "Qué día tan hermoso",
            "Me pregunto qué haré hoy",
            "Necesito nuevas aventuras",
            "Este lugar es tranquilo",
            "¿Qué me deparará el futuro?"
          ];
          showCharacterDialog(character, element, soloMessages[Math.floor(Math.random() * soloMessages.length)]);
        }
      }
    });
    
    requestAnimationFrame(improvedAnimationLoop);
  }
  
  improvedAnimationLoop();
}

function stopHouseSimulation() {
  houseAnimationRunning = false;
}

// Función para actualizar las opciones de ropa dinámicamente
function updateClothingOptions() {
  const clothingStyleSelect = document.getElementById('clothingStyle');
  clothingStyleSelect.innerHTML = '';
  
  Object.keys(clothingStyles).forEach(style => {
    const option = document.createElement('option');
    option.value = style;
    // Formatear el nombre del estilo (reemplazar _ por espacio y capitalizar)
    option.textContent = style.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
    clothingStyleSelect.appendChild(option);
  });
}

// Update hair style options when gender changes
document.getElementById('gender').addEventListener('change', function() {
  const gender = this.value;
  const hairStyleSelect = document.getElementById('hairStyle');
  hairStyleSelect.innerHTML = '';
  
  Object.keys(hairStyles[gender]).forEach(style => {
    const option = document.createElement('option');
    option.value = style;
    // Formatear el nombre del estilo (reemplazar _ por espacio y capitalizar)
    option.textContent = style.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
    hairStyleSelect.appendChild(option);
  });
  
updateCharacterPreview();
});

// Initialize
document.getElementById('saveCharacter').addEventListener('click', saveCharacter);
document.getElementById('usePotionBtn').addEventListener('click', useFriendshipPotion);
document.getElementById('useLovePotionBtn').addEventListener('click', useLovePotion);

['hairColor', 'skinColor', 'eyeColor', 'clothesColor', 'gender', 'hairStyle', 'clothingStyle'].forEach(id => {
 const element = document.getElementById(id);
 if (element) {
   element.addEventListener('change', updateCharacterPreview);
 }
});

// Initialize hair style options
document.getElementById('gender').dispatchEvent(new Event('change'));
// Initialize clothing options
updateClothingOptions();
updateCharacterPreview();
updateCharacterSelects();
updateFriendshipLevels();