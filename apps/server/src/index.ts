import http from "node:http"
import SocketService from "./services/socket"

async function init() {

    const sockerService = new SocketService()

    const httpServer = http.createServer()
    const PORT = process.env.PORT || 8000

    // attaching the socket server 
    sockerService.io.attach(httpServer)

    httpServer

    httpServer.listen(PORT, ()=>{
        console.log(`Http server started on port ${PORT}`)
    })
}

init()