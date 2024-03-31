import { Server } from "socket.io"
import Redis from "ioredis"
import { produceMessage } from "./kafka"
require('dotenv').config()

const redisCred = {
    host: process.env.REDIS_HOST || "localhost",
    port: Number(process.env.REDIS_PORT) || 6369,
    username: process.env.REDIS_USERNAME || "default",
    password: process.env.REDIS_PASSWORD || "password"
}
const messageChannel = "MESSAGES"
const pub = new Redis(redisCred)
const sub = new Redis(redisCred)

class SocketService {
    private _io: Server
    constructor() {
        console.log("Init socket service...")
        this._io = new Server({
            cors: {
                allowedHeaders: ["*"],
                origin: "*"
            }
        })
        sub.subscribe(messageChannel)
    }

    public initListener() {
        const io = this._io
        console.log("Init socket listeners...")
        io.on("connection", (socket) => {
            console.log(`New Socket Connected ${socket.id}`)

            socket.on("event:message", async ({ message }: { message: string }) => {
                console.log('New message rec', message)
                //publish this message to redis
                await pub.publish(messageChannel, JSON.stringify({ message }))
            })
        })

        sub.on("message", async (channel, message) => {
            if (channel === messageChannel) {
                console.log("New message from redis", message)
                io.emit("message", message)
            
                await produceMessage(message)
                console.log("Message produced to kafka broker")
            }
        })
    }

    get io() {
        return this._io
    }
}

export default SocketService