const users = []

const addUser = ({id, username, room}) => {

    // Clean the data
    username = username.trim().toLowerCase()
    room = room.trim().toLowerCase()

    // Validate the data
    if (!username || !room) {
        return {
            error: 'username and room are required'
        }
    }

    // Check for an existing user
    existingUser = users.find( (user) => {
        return username === user.username && room === user.room
    })
    if (existingUser) {
        return {
            error: 'username already in this room'
        }
    }

    // Store the data
    const user = {id, username, room}
    users.push(user)
    return {
        user
    }
    console.log(users)
}

const removeUser = (id) => {
    userIndex = users.findIndex( (user) => user.id === id ) // El bucle es para quan troba un match i retorna l'índex d'aquell moment a l'array
    if (userIndex != -1) {// retorna -1 si si no n'hi cap qua acompleixi la funció
        return users.splice(userIndex, 1)[0] // splice borra a partir d'un índex el número d'ítems indicat i retorna un array contenint lo borrat
    } // per defecte una funció retorna 'undefined'
}

const getUser = (id) => {
    return users.find( (user) => user.id === id)
}

const getUsersInRoom = (room) => {
    return users.filter( (user) => user.room === room)
}

module.exports = {
    addUser,
    removeUser,
    getUser,
    getUsersInRoom
}

