import amqp from "amqplib";
import config from "../config/config.js";

let channel, connection;
let reconnectAttempt = 0;
let isReconnecting = false;

export async function connect() {
  try {
    connection = await amqp.connect(config.RABBITMQ_URI);
    channel = await connection.createChannel();

    reconnectAttempt = 0;
    isReconnecting = false;
    console.log("Connected to RabbitMQ");

    connection.on("error", (err) => {
      console.error("RabbitMQ connection error:", err.message);
      scheduleReconnect();
    });

    connection.on("close", () => {
      console.warn("RabbitMQ connection closed. Scheduling reconnect...");
      channel = null;
      scheduleReconnect();
    });
  } catch (err) {
    console.error("Failed to connect to RabbitMQ:", err.message);
    scheduleReconnect();
  }
}

function scheduleReconnect() {
  if (isReconnecting) return;
  isReconnecting = true;
  const delay = Math.min(1000 * 2 ** reconnectAttempt, 30000);
  reconnectAttempt++;
  console.log(`Retrying RabbitMQ in ${delay / 1000}s (attempt ${reconnectAttempt})...`);
  setTimeout(connect, delay);
}

export async function publishToQueue(queueName, data) {
  if (!channel) {
    console.warn(`RabbitMQ channel not ready — message to "${queueName}" dropped`);
    return;
  }
  try {
    await channel.assertQueue(queueName, { durable: true });
    channel.sendToQueue(queueName, Buffer.from(JSON.stringify(data)));
    console.log(`Message sent to queue "${queueName}"`);
  } catch (err) {
    console.error(`Failed to publish to queue "${queueName}":`, err.message);
  }
}
