$(document).ready(function() {
    $('#en').click(function() {
        parseTextToEnglish();
    });
    $('#es').click(function() {
        transformaTextoAEspanol();
    });
});

function parseTextToEnglish() {
    //Menu items
    $('#item-menu-start').html('Start');
    $('#item-menu-resume').html('Resume');
    $('#item-menu-services').html('Services');
    $('#item-menu-portfolio').html('Portfolio');
    $('#item-menu-contact').html('Contact');

    //Front page
    $('#front-presentation-page').html("Hi, I'm <strong>Rodolfo Aravena Collipal</strong> - Computer and Informatics Engineer, backend developer over web and mobile platforms");

}

function transformaTextoAEspanol() {
    //Menú
    $('#item-menu-start').html('Inicio');
    $('#item-menu-resume').html('CV');
    $('#item-menu-services').html('Servicios');
    $('#item-menu-portfolio').html('Portafolio');
    $('#item-menu-contact').html('Contacto');

    //Portada
    $('#front-presentation-page').html("Hola, soy <strong>Rodolfo Aravena Collipal</strong> - Ingeniero en Computación e Informática, desarrollador Backend en Web y Móvil");

}