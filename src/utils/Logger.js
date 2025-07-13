class Logger {
    log(message) {
        console.log(message);
    }

    error(message) {
        console.error(message);
    }

    warn(message) {
        console.warn(message);
    }
}

module.exports = new Logger();