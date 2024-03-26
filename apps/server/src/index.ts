import http from "node:http"
import SocketService from "./services/socket"

async function init() {

    const socketService = new SocketService()

    const httpServer = http.createServer()
    const PORT = process.env.PORT || 8000

    // attaching the socket server 
    socketService.io.attach(httpServer)

    httpServer.listen(PORT, ()=>{
        console.log(`Http server started on port ${PORT}`)
    })

    socketService.initListener()
}

init()