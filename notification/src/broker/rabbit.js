import amqp from "amqplib";
import config from "../config/config.js";

let channel, connection;
let reconnectAttempt = 0;
let isReconnecting = false;
let onReadyCallback = null;

export async function connect(onReady) {
  if (onReady) onReadyCallback = onReady;

  try {
    connection = await amqp.connect(config.RABBITMQ_URI);
    channel = await connection.createChannel();
    await channel.prefetch(10);

    reconnectAttempt = 0;
    isReconnecting = false;
    console.log("Connected to RabbitMQ");

    connection.on("error", (err) => {
      console.error("RabbitMQ connection error:", err.message);
      scheduleReconnect();
    });

    connection.on("close", () => {
      console.warn("RabbitMQ connection closed. Scheduling reconnect...");
      scheduleReconnect();
    });

    if (onReadyCallback) await onReadyCallback();
  } catch (err) {
    console.error("RabbitMQ connection failed:", err.message);
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

export async function subscribeToQueue(queueName, callback) {
  await channel.assertQueue(queueName, { durable: true });

  channel.consume(queueName, async (msg) => {
    if (!msg) return;
    try {
      await callback(JSON.parse(msg.content.toString()));
      channel.ack(msg);
    } catch (err) {
      console.error(`Failed to process message from "${queueName}":`, err.message);
      channel.nack(msg, false, true);
    }
  });
}

export async function closeConnection() {
  try {
    await channel?.close();
    await connection?.close();
    console.log("RabbitMQ connection closed gracefully");
  } catch (err) {
    console.error("Error during RabbitMQ shutdown:", err.message);
  }
}
