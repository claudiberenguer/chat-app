const socket = io() 

// Elements
const $messageForm = document.querySelector('#messageForm')
const $messageFormInput = $messageForm.querySelector('input')
const $messageFormButton = $messageForm.querySelector('button')
const $shareLocationButton = document.querySelector('#shareLocation')
const $messages = document.querySelector('#messages')

//Templates
const messageTemplate = document.querySelector('#message-template').innerHTML
const locationTemplate = document.querySelector('#location-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

//Options
// Qs és l'objecte que carrega qs.js a chat.hml. La fomr de index.xml, quan es clica al botó, posa al navegador un GET amb la url de chat.hmtl amb un 'querystring' que conté els camps de la form
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true})  

const autoscroll = () => {
    
    // New Message Element
    $newMessage = $messages.lastElementChild

    // Height of the message
    const newMessageStyle = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyle.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    // Visible Height
    const visibleHeight = $messages.offsetHeight // És l'alçada en pixels de lo visible

    // Height of messages container
    const containerHeight = $messages.scrollHeight // És l'alçada de tot l'element, inclosa la part no visible

    // How far have I scrolled
    const scrollOffset = $messages.scrollTop + visibleHeight // srollTop és l'scroll des de la posició 0 - a dalt de tot - i si hi sumem visibleHeight dóna la posició de la part més baixa de lo visible respecte a l'inici de l'element

    if (containerHeight - newMessageHeight <= scrollOffset) { //És si abans d'entrar el nou missatge teniem l'scroll al final o l'hem mogut més enllá des de què ha entrat
        $messages.scrollTop = containerHeight // Si teniem l'scroll al final abans de què entrés el missatge, després d'entrar fem un autoscroll al final per a què es vegi; sino no, seguim veient el què estàvem veinet
    }
}



socket.on('message', (parameter) => {
    const html = Mustache.render(messageTemplate, { // La llibreria de Mustache s'ha carregat a a index.html
        message: parameter.text,  //s'hagés pogut fer dient-li al paràmetre de la funció 'message', però així es pot distingir clarament que etem assignant el valor del paràmetre a la variable Mustache que està entre {{}} al html
        createdAt: moment(parameter.createdAt).format('h:mm a'), // La llibreria de moment s'ha carregat a a index.html
        username: parameter.username
    })  // Aquí Mustache compila el template
    $messages.insertAdjacentHTML('beforeend', html) // Aquí insertem el template compilat a la pàgina
    autoscroll()
})

socket.on('locationMessage', (location) => {  //location és una url de maps.google
    const html = Mustache.render(locationTemplate, {
        location_url: location.url,       
        createdAt: moment(location.createdAt).format('h:mm a'),
        username: location.username
    })  // Aquí Mustache compila el template
    $messages.insertAdjacentHTML('beforeend', html) // Aquí insertem el template compilat a la pàgina
    autoscroll()
})

socket.on('roomData', ({room, users}) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    })
    document.querySelector('#sidebar').innerHTML = html
})

$messageForm.addEventListener('submit', (e) => { //e és 'event'; 
    // Es deshabilita el botó una vegada picat fins que es reb l'acknowledge, per evitar enviar un missatge mentre un altre està en vol
    $messageFormButton.setAttribute('disabled', 'disabled')
    //La línia de sota evita que el borwser faci l'acció per defecte que és refrescar tota la pàgina, el què faria
    //que es tirés la connexió actual i s'en crees una de nova
    e.preventDefault() // el default és tornar a carregar la pàgina
    // target és el target de l'event, que és el form i amb elemnts es té accés als elements del target
    // Si el 3er paràmetre és opcional i és una callback function que es crida quan es reb l'acknowledge
    // opcionalment amb l'ackenowledge hi pot venir un paràmetres, als que se n'hi diu status en aquest cas
    socket.emit('message', e.target.elements.messageInput.value, (status) => {
        // Habilitem botó de nou netegem l'input i li passem el focus una vegada es disposa del Ack
        $messageFormButton.removeAttribute('disabled')
        $messageFormInput.value = ''
        $messageFormInput.focus()
        if (status) {
            return console.log('Status: ' + status)
        }
        console.log('Status: Ok')
    })
})

$shareLocationButton.addEventListener('click', (e) => {
    if (!navigator.geolocation) {
        return alert('This browser does not support geolocation')
    }
    
    $shareLocationButton.setAttribute('disabled', 'disabled')
    navigator.geolocation.getCurrentPosition( (position) => {
        socket.emit('sendLocation', {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
        }, () => {
            console.log('location has been shared')
            $shareLocationButton.removeAttribute('disabled')
        })
    })
})

socket.emit('join', { username, room }, (error) => {  // l'acknowledge envia l'error si ha passat algo, undefined serà en altre cas
    if (error) {
        // Si hi ha error s'obre un missatge de notificació i es redirigeix a l'usuari a la pàgina inicial
        alert(error)
        location.href = '/'  //Això sitúa al client de nou a l'arrel del site, des d'on de li dóna index.xml 
    }
})


// fixer-shi que aquí al 'io' n'hi diem socket, però és lo mateix que al cantó del servidor és 'io' en tal com
// s'hi fa servir la funció on, que és la que escolta els events

// socket.on('countUpdated', (count) => {
//     console.log('Actual counter value: ' + count)
// })

// document.querySelector('#increment').addEventListener('click', () => {
//     console.log('clicked')
//     socket.emit('increment')
// })