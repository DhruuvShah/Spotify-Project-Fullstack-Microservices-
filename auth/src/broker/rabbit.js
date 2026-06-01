import amqp from "amqplib";
import config from "../config/config.js";

let channel, connection;

export async function connect() {
  try {
    connection = await amqp.connect(config.RABBITMQ_URI);
    channel = await connection.createChannel();
    console.log("Connected to RabbitMQ");
  } catch (err) {
    console.error("Failed to connect to RabbitMQ:", err);
  }
}

export async function publishToQueue(queueName, data) {
  if (!channel) {
    console.warn(
      `RabbitMQ channel not ready — skipping publish to "${queueName}"`,
    );
    return;
  }
  try {
    await channel.assertQueue(queueName, { durable: true });
    channel.sendToQueue(queueName, Buffer.from(JSON.stringify(data)));
    console.log(`Message sent to queue ${queueName}`);
  } catch (err) {
    console.error(`Failed to publish to queue "${queueName}":`, err);
  }
}
