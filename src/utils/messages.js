const generateMessage = (text, username) => {
    if (!username) {username = "Admin"}
    return {
        text,
        username,
        createdAt: new Date().getTime()
    }
}

const generateLocationMessage = (url, username) => {
    if (!username) {username = "Admin"}
    return {
        url,
        username,
        createdAt: new Date().getTime()
    }
}

module.exports = {
    generateMessage,
    generateLocationMessage
}