import fs from "fs"
import path from "path"
import { Kafka, Producer } from "kafkajs"
import prismaClient from "./prisma"
require('dotenv').config()

const kafka = new Kafka({
    brokers: [process.env.Kafka_Broker || ""],
    ssl: {
        ca: [fs.readFileSync(path.resolve("./kafka/ca.pem")), 'utf-8']
    },
    sasl: {
        username: process.env.Kafka_Username || "",
        password: process.env.Kafka_Password || "",
        mechanism: "plain"
    }
})

const messagesTopic = "MESSAGES"
let producer: Producer | null = null

export async function createProducer() {
    if (producer) {
        return producer
    } else {
        const _producer = kafka.producer()
        await _producer.connect()
        producer = _producer
        return producer
    }
}

export async function produceMessage(message: string) {
    const producer = await createProducer()

    producer.send({
        messages: [{
            key: `message-${Date.now()}`,
            value: message
        }],
        topic: messagesTopic
    })
}

export async function startMessagesConsumer() {
    console.log("consumer is running")
    const consumer = kafka.consumer({groupId: "default"})

    await consumer.connect()
    await consumer.subscribe({topic: messagesTopic, fromBeginning: true})

    await consumer.run({
        autoCommit: true,
        eachMessage: async ({message, pause}) =>{
            if (!message) return
            console.log(`New message rec...`)
            try {
                // await prismaClient.message.create({
                //     data: {
                //         message: message.value?.toString(),
                //     }
                // })

                await prismaClient.message.create({
                    data:{
                        text: message.value?.toString() as string
                    }
                })
            } catch (error) {
                console.log(`Something is wrong`)
                pause()
                setTimeout(()=>{
                    consumer.resume([
                        {topic: messagesTopic}
                    ])
                },50000)
            }
            
        }
    })
}

export default kafka