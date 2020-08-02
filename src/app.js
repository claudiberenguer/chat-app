const express = require('express')
const http = require('http')
const socketio = require('socket.io')
const path = require('path')
// const { on } = require('process') // El mètode 'on' que es crida des de la instància e socketio és en realitat el 'on' de process, que és una forma d'interceptar events de Node
const Filter = require('bad-words')
const {generateMessage, generateLocationMessage} = require('./utils/messages.js')
const {addUser, removeUser, getUser, getUsersInRoom} = require('./utils/users.js')

const port = process.env.PORT || 3000
const publicDir = path.join(__dirname, '../public')

const app = express()
const server = http.createServer(app)
// Hem importat la llibreria http per a poder obtenir un objecte 'http server' per poder passar a socketio;
// express no retorna aquest objecte, per això hi hem posat la llibrera http pel mig
const io = socketio(server)  

app.use(express.static(publicDir))

// socket.io funciona per events. A baix el què fem és capturar l'event per què un client s'ha connectat
// a l'objecte socket hi ha el client que s'ha connectat; Aquesta funció és crida per a cada client cada vegada
// que aquest es connecta, pel que soket sempre fa referència a aquell client en aquell moment
// Hi ha events predefinits, com 'connection' però també en pots crear de nous. Un event es crea i s'envia
// amb el mètode emit de socket; el primer paràmere d'emit és el nom de l'event i els subsguents són els paràemtres
// de l'event; per al client, quin és quin, ve determinat per l'ordre
//let count = 0

// Això és codi de configuració; no s'executa cada vegada que hi ha una connexió; el què es fa és configurar
// socket.io, que es queda funcionant en segon plà, per a què per a cada connexió executi aquest codi
// Tenir en compte que socket.io és una connnexió permanent, pel què quan entra una nova connexió es crea un
// procés que l'atén segons la funció descrita a baix
// socket és l'objecte connexió amb el client; ** recordar que és un enllaç PERMANENT i bi-direccional **
io.on('connection', (socket) => {  // Aquí configurem un 'listener' al servidor
    // Les dues primeres línies nomes s'executen en la 'inicialització - ie, quan el servidor ha rebut l'event 'connection'
    console.log(`New WebSocket conectiion. Socket id: ${socket.id}`)
    //const message = 'Welcome!'
    // * Les dues línies de baix es passen al listener de l'event 'join'
    //  socket.emit('message', generateMessage("Welcome!")) // S'envia només al client
    //  socket.broadcast.emit('message', generateMessage('A new user has joined')) // S'envia a tothom menys a aquest client
    socket.on('join', (join_data, callback) => {
        // addUser retrona un objecte amb camp user quan tot va bé o amb cambp error quan va malament; hi fem un destructiring, de forma que el que no es retorna serà undefined 
        const {error, user} = addUser({id: socket.id, ...join_data}) // join_data és {username, room} i és el cos del missatge enviat per chat.js
        
        if (error) {
            return callback(error) // enviem un Acknowledge al client amb error si n'hi ha 
        }
        callback()

        socket.join(user.room) // addUser els adequa, pel què es retorna els adequants - trimmed & lowerCased -
        socket.emit('message', generateMessage("Welcome!")) // S'envia només al client
        socket.to(user.room).broadcast.emit('message', generateMessage(`${user.username} has joined`)) // S'envia a tots els de 'room' menys l'usuari de 'socket' 
        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        })
    })
    // El primer paràmetre són les dades que venen amb el missatge
    // El segon paràmetre es posa si es vol eviar un acknowledge; només per ser-hi ja fa que s'envii l'acknowledge
    socket.on('message', (message, callback) => {   // Quan es reb del client
        
        const filter = new Filter()                 //
        if (filter.isProfane(message)){
            return callback('Profanity is not allowed')  // Si no passa el filtre, no es passa al emit i el callback envia un missatge dient què ha passat
        }

        const user = getUser(socket.id)
        io.to(user.room).emit('message', generateMessage(message, user.username))                 // El servidor envia a tothom
        callback()                                  // El callback per donar l'acknowledge es fa al final de tot i pot passar un o més paràmetres
    })
    // socket.emit('countUpdated', count)  // Al fer l'emit des de socket, només s'envia per aquest enllaç en concret, ie, a aquest client
    // // Aquí configurem un 'listener' a la instancia que representa l'enllaç amb el client
    // socket.on('increment', () => {         // Al fer socket.on vol dir missatge enviat des d'aquest client en concret
    //     count++
    //     // socket.emit('countUpdated', count) --> Això enviaria el missatge només a aquest client
    //     io.emit('countUpdated', count)     // En ser 'io' qui envia, ho envia a tots els clients
    // })
    socket.on('sendLocation', (coords, callback) => {
        const user = getUser(socket.id)
        io.to(user.room).emit('locationMessage',  generateLocationMessage(`https://www.google.com/maps?q=${coords.latitude},${coords.longitude}`, user.username))
        callback()
    })

    socket.on('disconnect', () => {  // Quan reb del client el disconnect - com el connect són missatges que genera automàticament socket.io      
        const user = removeUser(socket.id)
        if (user) {
            io.to(user.room).emit('message', generateMessage(`${user.username} has left`))
            io.to(user.room).emit('roomData', {
                room: user.room,
                users: getUsersInRoom(user.room)
            })
        }
    })

})

server.listen(port, (error) => {
    if (error) {
        return console.log(error)
    }
    console.log('server is up and listening on port ' + port)
})


