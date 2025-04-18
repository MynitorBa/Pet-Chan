let numerosDeTambor = document.querySelectorAll(".drum").length;


for (let inde = 0; inde < numerosDeTambor; inde++) {    
    document.querySelectorAll(".drum")[inde].addEventListener("click", function() {
        let buttonInnerHTML = this.innerHTML;
        makeSound(buttonInnerHTML);
        buttonAnimation(buttonInnerHTML);
    });
}

document.addEventListener("keypress", function(evento){
    makeSound(evento.key);
    buttonAnimation(evento.key);
});

function makeSound(key){
    switch (key) {
        case "w":
            var ton1 = new Audio('archivos_de_minijuegos/sounds/tom-1.mp3');
            ton1.play();
            break;
        case "a":
            var ton1 = new Audio('archivos_de_minijuegos/sounds/tom-2.mp3');
            ton1.play();
            break;
        case "s":
            var ton1 = new Audio('archivos_de_minijuegos/sounds/tom-3.mp3');
            ton1.play();
            break;
        case "d":
            var ton1 = new Audio('archivos_de_minijuegos/sounds/tom-4.mp3');
            ton1.play();
            break;
        case "j":
            var ton1 = new Audio('archivos_de_minijuegos/sounds/snare.mp3');
            ton1.play();
            break;
        case "k":
            var ton1 = new Audio('archivos_de_minijuegos/sounds/crash.mp3');
            ton1.play();
            break;
        case "l":
            var ton1 = new Audio('archivos_de_minijuegos/sounds/kick-bass.mp3');
            ton1.play();
            break;
        default:
            console.log(key);       
    }
}

function buttonAnimation(currentKey){
    var activeButton = document.querySelector("." + currentKey);
    
    if (activeButton) {  // Solo si activeButton existe
        activeButton.classList.add("pressed");
        setTimeout(function(){
            activeButton.classList.remove("pressed");
        }, 100);
    }
}
